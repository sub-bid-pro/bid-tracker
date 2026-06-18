import type { Profile } from '../contexts/AuthContext';

export type ViewState = 'normal' | 'banner' | 'wall';

/**
 * Frontend mirror of the server's entitlement resolver
 * (server/src/billing/entitlement.ts). Keep the two in sync.
 *
 *   - 'normal' : full access, no billing UI
 *   - 'banner' : full access + dunning warning (past_due within grace)
 *   - 'wall'   : blurred lock + single Checkout CTA
 */
export const resolveView = (profile: Profile | null, now: Date = new Date()): ViewState => {
  if (!profile) return 'normal';
  if (profile.role === 'admin') return 'normal';

  const ts = (v: string | null | undefined) => (v ? new Date(v).getTime() : null);
  const state = profile.access_state ?? 'trialing';

  switch (state) {
    case 'active':
      return 'normal';

    case 'trialing': {
      const trialEnd = ts(profile.trial_ends_at);
      if (!profile.stripe_subscription_id && trialEnd !== null && now.getTime() > trialEnd) {
        return 'wall';
      }
      return 'normal';
    }

    case 'past_due': {
      const graceEnd = ts(profile.grace_ends_at);
      if (graceEnd !== null && now.getTime() < graceEnd) return 'banner';
      return 'wall';
    }

    case 'expired':
    case 'canceled':
    default:
      return 'wall';
  }
};
