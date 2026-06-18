import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { supabaseAdmin } from '../lib/supabase';
import { GRACE_DAYS, type AccessState } from '../billing/types';
import { subscriptionToPatch } from '../billing/reconcile';

// ── helpers ──────────────────────────────────────────────────────────────────

const idOf = (
  v: string | { id: string } | null | undefined,
): string | null => (v ? (typeof v === 'string' ? v : v.id) : null);

/** Records the event id; returns false if it was already processed (duplicate). */
const claimEvent = async (event: Stripe.Event): Promise<boolean> => {
  const { error } = await supabaseAdmin
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type });

  // 23505 = unique_violation → we've already handled this event.
  if (error && (error as any).code === '23505') return false;
  if (error) throw error;
  return true;
};

const findUserIdByCustomer = async (customerId: string | null): Promise<string | null> => {
  if (!customerId) return null;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
};

const getCount = async (userId: string): Promise<number> => {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('successful_payment_count')
    .eq('id', userId)
    .single();
  return data?.successful_payment_count ?? 0;
};

const updateProfile = async (userId: string, patch: Record<string, unknown>) => {
  const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
};

const recordCoveragePeriod = async (userId: string, invoice: Stripe.Invoice) => {
  const line: any = invoice.lines?.data?.[0];
  const start = line?.period?.start ?? (invoice as any).period_start;
  const end = line?.period?.end ?? (invoice as any).period_end;
  if (!start || !end) return;

  await supabaseAdmin.from('coverage_periods').insert({
    user_id: userId,
    period_start: new Date(start * 1000).toISOString(),
    period_end: new Date(end * 1000).toISOString(),
    source: invoice.id,
  });
  // Duplicate (unique constraint) is fine — ignore any error silently.
};

// ── event handlers ───────────────────────────────────────────────────────────

const handleSubscriptionState = async (subscription: Stripe.Subscription) => {
  const customerId = idOf(subscription.customer);
  const userId =
    subscription.metadata?.supabase_user_id || (await findUserIdByCustomer(customerId));
  if (!userId) return;

  const count = await getCount(userId);
  const base = subscriptionToPatch(subscription, count);

  const patch: Record<string, unknown> = {
    ...base,
    stripe_customer_id: customerId,
  };

  if (base.access_state === 'past_due') {
    // Established customer entered dunning — start the 7-day grace once.
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('grace_started_at')
      .eq('id', userId)
      .single();
    if (!data?.grace_started_at) {
      const now = new Date();
      patch.grace_started_at = now.toISOString();
      patch.grace_ends_at = new Date(now.getTime() + GRACE_DAYS * 86400_000).toISOString();
    }
  }

  await updateProfile(userId, patch);
};

const handlePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  if ((invoice.amount_paid ?? 0) <= 0) return; // ignore $0 trial invoices

  const customerId = idOf(invoice.customer);
  const userId = await findUserIdByCustomer(customerId);
  if (!userId) return;

  // Atomic, idempotent (event ledger guards against double delivery).
  await supabaseAdmin.rpc('increment_successful_payment_count', { p_user_id: userId });
  await recordCoveragePeriod(userId, invoice);

  // A real payment clears any dunning grace and restores full access.
  await updateProfile(userId, {
    access_state: 'active' as AccessState,
    grace_started_at: null,
    grace_ends_at: null,
  });
};

const handlePaymentFailed = async (invoice: Stripe.Invoice) => {
  const customerId = idOf(invoice.customer);
  const userId = await findUserIdByCustomer(customerId);
  if (!userId) return;

  const count = await getCount(userId);

  if (count === 0) {
    // First-ever charge failed → hard wall immediately, no grace.
    await updateProfile(userId, { access_state: 'expired' as AccessState });
    return;
  }

  // Established renewal failed → keep access, start grace once.
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('grace_started_at')
    .eq('id', userId)
    .single();

  const patch: Record<string, unknown> = { access_state: 'past_due' as AccessState };
  if (!data?.grace_started_at) {
    const now = new Date();
    patch.grace_started_at = now.toISOString();
    patch.grace_ends_at = new Date(now.getTime() + GRACE_DAYS * 86400_000).toISOString();
  }
  await updateProfile(userId, patch);
};

const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.client_reference_id || session.metadata?.supabase_user_id;
  const customerId = idOf(session.customer);

  // Card-update flow (mode=setup): attach the new PM and retry the open invoice.
  if (session.mode === 'setup') {
    const setupIntentId = idOf(session.setup_intent);
    if (!setupIntentId || !customerId) return;

    const si = await stripe.setupIntents.retrieve(setupIntentId);
    const pmId = idOf(si.payment_method);
    const subscriptionId = si.metadata?.subscription_id;
    if (!pmId) return;

    // Make it the default for the customer and the subscription.
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });

    if (subscriptionId) {
      const sub = await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: pmId,
      });
      const openInvoiceId = idOf(sub.latest_invoice);
      if (openInvoiceId) {
        try {
          await stripe.invoices.pay(openInvoiceId);
        } catch (e: any) {
          console.error('[webhook] invoice.pay after card update failed:', e.message);
        }
      }
    }
    return; // resulting invoice.payment_succeeded drives the state change
  }

  // Subscription flow: persist ids and set state from the subscription.
  const subscriptionId = idOf(session.subscription);
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (userId && !subscription.metadata?.supabase_user_id) {
      subscription.metadata = { ...subscription.metadata, supabase_user_id: userId };
    }
    await handleSubscriptionState(subscription);
  } else if (userId && customerId) {
    await updateProfile(userId, { stripe_customer_id: customerId });
  }
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const customerId = idOf(subscription.customer);
  const userId =
    subscription.metadata?.supabase_user_id || (await findUserIdByCustomer(customerId));
  if (!userId) return;

  await updateProfile(userId, {
    access_state: 'canceled' as AccessState,
    stripe_subscription_id: null,
    grace_started_at: null,
    grace_ends_at: null,
    current_period_end: null,
    cancel_at_period_end: false,
  });
};

// ── entry point ──────────────────────────────────────────────────────────────

/**
 * POST /api/stripe/webhook
 * MUST be mounted with express.raw({ type: 'application/json' }) so req.body is
 * the raw Buffer required for signature verification.
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set.');
    return res.status(500).send('Webhook not configured');
  }
  if (!signature) return res.status(400).send('Missing stripe-signature header');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Idempotency: skip events we've already processed.
    const isNew = await claimEvent(event);
    if (!isNew) return res.status(200).json({ received: true, duplicate: true });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionState(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break; // acknowledged, no-op
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    // Release the idempotency claim so Stripe's retry (500 → backoff) can
    // reprocess this event — otherwise the ledger row would make the retry a
    // no-op and the event would be lost.
    try {
      await supabaseAdmin.from('stripe_events').delete().eq('event_id', event.id);
    } catch (cleanupErr: any) {
      console.error('[webhook] Failed to release event claim:', cleanupErr.message);
    }
    console.error(`[webhook] Error handling ${event.type}:`, err.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};
