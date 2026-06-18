import { supabaseAdmin } from '../lib/supabase';
import { stripe } from '../lib/stripe';

/**
 * W3 — Grace expiry. For established customers whose 7-day dunning grace has
 * lapsed without payment: cancel the Stripe subscription and flip to 'expired'
 * (blurred wall). We own the cancel — Stripe's auto-cancel should be OFF so the
 * two timers don't race. Admins are excluded.
 *
 * Idempotent: clearing grace_* on flip means re-runs won't match the same rows.
 */
export const runGraceExpiry = async (now: Date = new Date()) => {
  const { data: rows, error } = await supabaseAdmin
    .from('profiles')
    .select('id, stripe_subscription_id')
    .eq('access_state', 'past_due')
    .neq('role', 'admin')
    .not('grace_ends_at', 'is', null)
    .lt('grace_ends_at', now.toISOString());

  if (error) {
    console.error('[W3 graceExpiry] scan failed:', error.message);
    throw error;
  }

  let expired = 0;
  for (const row of rows ?? []) {
    try {
      if (row.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(row.stripe_subscription_id);
        } catch (e: any) {
          // Already gone / not cancelable — proceed to expire locally anyway.
          console.error(`[W3 graceExpiry] cancel failed for ${row.id}:`, e.message);
        }
      }

      await supabaseAdmin
        .from('profiles')
        .update({
          access_state: 'expired',
          grace_started_at: null,
          grace_ends_at: null,
        })
        .eq('id', row.id);

      expired += 1;
    } catch (e: any) {
      console.error(`[W3 graceExpiry] failed for ${row.id}:`, e.message);
    }
  }

  console.log(`[W3 graceExpiry] expired=${expired}`);
  return { expired };
};

// Railway cron entrypoint: `tsx src/workers/graceExpiry.ts`
if (process.argv[1] && process.argv[1].includes('graceExpiry')) {
  runGraceExpiry()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
