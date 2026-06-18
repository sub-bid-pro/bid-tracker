import type Stripe from 'stripe';

export type AccessState = 'trialing' | 'active' | 'expired' | 'past_due' | 'canceled';
export type Role = 'member' | 'admin';

/** What the frontend should render. */
export type ViewState = 'normal' | 'banner' | 'wall';

/** The subset of the profiles row the billing logic reads. */
export interface BillingProfile {
  id: string;
  role: Role;
  access_state: AccessState;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  successful_payment_count: number | null;
  grace_started_at: string | null;
  grace_ends_at: string | null;
}

export const GRACE_DAYS = 7;

/** Maps a Stripe subscription status + the user's real-payment count to our enum. */
export const mapStripeStatus = (
  status: Stripe.Subscription.Status,
  successfulPaymentCount: number,
): AccessState => {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      // Phase 3 split: first-ever charge failed → hard wall; established renewal → grace.
      return successfulPaymentCount >= 1 ? 'past_due' : 'expired';
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    case 'canceled':
      return 'canceled';
    default:
      return 'expired';
  }
};
