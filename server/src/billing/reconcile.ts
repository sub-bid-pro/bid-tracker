import type Stripe from 'stripe';
import { mapStripeStatus, type AccessState } from './types';

// Higher = more authoritative when a customer has multiple subscriptions.
const STATUS_RANK: Record<string, number> = {
  active: 4,
  trialing: 4,
  past_due: 3,
  unpaid: 2,
  incomplete: 2,
  paused: 1,
  incomplete_expired: 0,
  canceled: 0,
};

/** Picks the subscription that should drive the profile's access state. */
export const pickBestSubscription = (
  subs: Stripe.Subscription[],
): Stripe.Subscription | null => {
  if (!subs.length) return null;
  return [...subs].sort(
    (a, b) => (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0) || b.created - a.created,
  )[0];
};

export interface SubscriptionPatch {
  access_state: AccessState;
  stripe_subscription_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/**
 * Derives the profile fields a subscription implies. Shared by the webhook and
 * the on-read reconcile so the two can never drift.
 */
export const subscriptionToPatch = (
  sub: Stripe.Subscription,
  successfulPaymentCount: number,
): SubscriptionPatch => {
  const item = sub.items?.data?.[0] as Stripe.SubscriptionItem | undefined;
  const periodEnd =
    (item as any)?.current_period_end ?? (sub as any).current_period_end ?? null;
  const cancelPending = !!(
    sub.cancel_at_period_end ||
    sub.cancel_at ||
    (sub.canceled_at && sub.status === 'active')
  );
  return {
    access_state: mapStripeStatus(sub.status, successfulPaymentCount),
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: cancelPending,
  };
};
