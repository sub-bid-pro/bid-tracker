import { supabaseAdmin } from '../lib/supabase';

/**
 * W2 — Trial expiry. Flips no-card trials to 'expired' once trial_ends_at has
 * passed, so the blurred wall appears. Stripe never fires for these accounts
 * (no subscription exists), so the app must do it. Admins are excluded.
 *
 * Idempotent: the filter only matches still-trialing rows, so re-runs are no-ops.
 */
export const runTrialExpiry = async (now: Date = new Date()) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ access_state: 'expired' })
    .eq('access_state', 'trialing')
    .is('stripe_subscription_id', null)
    .neq('role', 'admin')
    .lt('trial_ends_at', now.toISOString())
    .select('id');

  if (error) {
    console.error('[W2 trialExpiry] failed:', error.message);
    throw error;
  }

  console.log(`[W2 trialExpiry] expired=${data?.length ?? 0}`);
  return { expired: data?.length ?? 0 };
};

// Railway cron entrypoint: `tsx src/workers/trialExpiry.ts`
if (process.argv[1] && process.argv[1].includes('trialExpiry')) {
  runTrialExpiry()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
