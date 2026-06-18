import type { Request, Response } from 'express';
import { stripe, PRICE_ID, FRONTEND_URL } from '../lib/stripe';
import { supabaseAdmin } from '../lib/supabase';
import { accessSummary } from '../billing/entitlement';
import { GRACE_DAYS, type BillingProfile } from '../billing/types';
import { pickBestSubscription, subscriptionToPatch } from '../billing/reconcile';

const SUCCESS_URL = `${FRONTEND_URL}/settings?billing=success`;
const CANCEL_URL = `${FRONTEND_URL}/settings?billing=cancelled`;

// trial_end must be comfortably in the future for Stripe to accept it.
const TRIAL_END_BUFFER_MS = 60 * 60 * 1000; // 1 hour

/** Returns the user's Stripe customer id, creating + persisting one if needed. */
const getOrCreateCustomer = async (profile: BillingProfile, email?: string): Promise<string> => {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: profile.id },
  });

  await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', profile.id);

  return customer.id;
};

/**
 * Is this subscription one we should recover via a card update (mode=setup)
 * rather than starting a brand-new subscription?
 */
const isRecoverable = (status: string) =>
  status === 'past_due' || status === 'unpaid' || status === 'incomplete';

/**
 * POST /api/billing/session — the single CTA target. Branches:
 *  - live recoverable subscription → mode=setup (update card, then retry invoice)
 *  - otherwise (no sub / canceled)  → mode=subscription (first-time or reactivation)
 */
export const createBillingSession = async (req: Request, res: Response) => {
  const profile = req.profile;
  const userId = req.authUserId;
  const email = req.authEmail;

  if (!profile || !userId) return res.status(401).json({ error: 'Not authenticated' });
  if (!PRICE_ID) {
    console.error('[billing] STRIPE_PRICE_ID is not set.');
    return res.status(500).json({ error: 'Billing is not configured' });
  }

  try {
    const customerId = await getOrCreateCustomer(profile, email);

    // Use Stripe as the source of truth for what subscriptions actually exist
    // (the profile pointer can be stale, e.g. before a webhook lands). This also
    // prevents a duplicate subscription from a rapid double "Subscribe".
    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });
    const recoverable = existing.data.find((s) => isRecoverable(s.status));
    const liveActive = existing.data.find((s) => s.status === 'active' || s.status === 'trialing');

    // Already subscribed → never create a second subscription; send them to the
    // portal to manage the existing one instead.
    if (liveActive) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${FRONTEND_URL}/settings`,
      });
      return res.status(200).json({ url: portal.url, mode: 'portal' });
    }

    // Has a subscription that just needs a working card → card-update setup.
    if (recoverable) {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        customer: customerId,
        payment_method_types: ['card'],
        setup_intent_data: {
          metadata: {
            supabase_user_id: userId,
            purpose: 'card_update',
            subscription_id: recoverable.id,
          },
        },
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
      });
      return res.status(200).json({ url: session.url, mode: 'setup' });
    }

    // Fresh subscription (first-time or reactivation after cancel/expiry).
    const trialEndMs = profile.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : 0;
    const trialEndInFuture = trialEndMs > Date.now() + TRIAL_END_BUFFER_MS;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      client_reference_id: userId,
      metadata: { supabase_user_id: userId },
      subscription_data: {
        metadata: { supabase_user_id: userId },
        // Anchor the first charge to the account's existing trial end so they
        // are never billed for unused days. Omitted (charge now) if already past.
        ...(trialEndInFuture ? { trial_end: Math.floor(trialEndMs / 1000) } : {}),
      },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    if (!session.url) return res.status(500).json({ error: 'Stripe did not return a URL' });
    return res.status(200).json({ url: session.url, mode: 'subscription' });
  } catch (err: any) {
    console.error('[billing] createBillingSession error:', err.message);
    return res.status(500).json({ error: 'Failed to create billing session' });
  }
};

/**
 * POST /api/billing/portal — opens the Stripe Customer Portal so an existing
 * subscriber can update their card, view invoices, or cancel. Requires that the
 * Customer Portal is activated in the Stripe dashboard (Settings → Billing →
 * Customer portal).
 */
export const createPortalSession = async (req: Request, res: Response) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ error: 'Not authenticated' });
  if (!profile.stripe_customer_id) {
    return res.status(400).json({ error: 'No billing account yet' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${FRONTEND_URL}/settings`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('[billing] createPortalSession error:', err.message);
    return res.status(500).json({ error: 'Failed to open billing portal' });
  }
};

/**
 * POST /api/billing/sync — self-healing reconcile. Pulls the customer's real
 * subscription state from Stripe (the source of truth) and corrects the profile.
 * The frontend calls this on the billing page / checkout return so the app is
 * accurate even if a webhook was missed (e.g. server restart in local dev).
 */
export const syncBilling = async (req: Request, res: Response) => {
  const profile = req.profile;
  const userId = req.authUserId;
  if (!profile || !userId) return res.status(401).json({ error: 'Not authenticated' });

  // No customer yet → nothing on Stripe to reconcile against.
  if (!profile.stripe_customer_id) {
    return res.status(200).json({ access_state: profile.access_state, ...accessSummary(profile) });
  }

  try {
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10,
    });
    const best = pickBestSubscription(subs.data);

    let patch: Record<string, unknown>;
    if (!best || best.status === 'canceled' || best.status === 'incomplete_expired') {
      patch = {
        access_state: 'canceled',
        stripe_subscription_id: null,
        current_period_end: null,
        cancel_at_period_end: false,
      };
    } else {
      const count = profile.successful_payment_count ?? 0;
      patch = { ...subscriptionToPatch(best, count) };
      // If we discover a past_due we never recorded, open the grace window once.
      if (patch.access_state === 'past_due' && !profile.grace_started_at) {
        const now = new Date();
        patch.grace_started_at = now.toISOString();
        patch.grace_ends_at = new Date(now.getTime() + GRACE_DAYS * 86400_000).toISOString();
      }
    }

    await supabaseAdmin.from('profiles').update(patch).eq('id', userId);

    const updated = { ...profile, ...patch } as typeof profile;
    return res.status(200).json({ access_state: updated.access_state, role: updated.role, ...accessSummary(updated) });
  } catch (err: any) {
    console.error('[billing] syncBilling error:', err.message);
    return res.status(500).json({ error: 'Failed to sync billing' });
  }
};

/**
 * GET /api/billing/access — frontend reads this (or the profile directly) to
 * decide wall/banner/normal. Mirrors the resolver the React app also runs.
 */
export const getAccess = async (req: Request, res: Response) => {
  const profile = req.profile;
  if (!profile) return res.status(401).json({ error: 'Not authenticated' });

  return res.status(200).json({
    access_state: profile.access_state,
    role: profile.role,
    ...accessSummary(profile),
  });
};
