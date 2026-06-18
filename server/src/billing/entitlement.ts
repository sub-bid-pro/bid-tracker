import type { BillingProfile, ViewState } from './types';

/**
 * THE single entitlement resolver. Both the API (GET /billing/access) and the
 * frontend mirror this. Returns what the user should see:
 *   - 'normal' : full access, no UI
 *   - 'banner' : full access + dunning warning banner (past_due within grace)
 *   - 'wall'   : blurred lock + single Checkout CTA
 *
 * `now` is injectable for testing.
 */
export const resolveView = (profile: BillingProfile, now: Date = new Date()): ViewState => {
  // Admins/devs bypass the paywall entirely.
  if (profile.role === 'admin') return 'normal';

  const ts = (v: string | null) => (v ? new Date(v).getTime() : null);

  switch (profile.access_state) {
    case 'active':
      return 'normal';

    case 'trialing': {
      // Harden against the gap between trial end and the W2 expiry worker run:
      // a no-card trial whose clock has run out is walled immediately.
      const trialEnd = ts(profile.trial_ends_at);
      if (!profile.stripe_subscription_id && trialEnd !== null && now.getTime() > trialEnd) {
        return 'wall';
      }
      return 'normal';
    }

    case 'past_due': {
      const graceEnd = ts(profile.grace_ends_at);
      // Within an active grace window → keep access, show banner.
      if (graceEnd !== null && now.getTime() < graceEnd) return 'banner';
      // Grace lapsed or never started → wall.
      return 'wall';
    }

    case 'expired':
    case 'canceled':
    default:
      return 'wall';
  }
};

/** Convenience booleans for API responses / templates. */
export const accessSummary = (profile: BillingProfile, now: Date = new Date()) => {
  const view = resolveView(profile, now);
  return {
    view,
    hasAccess: view !== 'wall',
    showBanner: view === 'banner',
    locked: view === 'wall',
    graceEndsAt: profile.access_state === 'past_due' ? profile.grace_ends_at : null,
  };
};
