import { supabaseAdmin } from '../lib/supabase';
import { sendTrialReminder } from '../lib/postmark';

/**
 * W1 — Trial reminder. Emails accounts whose trial ends in ~3 days and who
 * haven't been reminded, are still no-card trialing, and aren't admins.
 *
 * Idempotent: rows are claimed atomically by stamping reminder_sent_at in a
 * single UPDATE ... RETURNING, so concurrent runs can't double-send.
 */
export const runTrialReminder = async (now: Date = new Date()) => {
  const windowStart = new Date(now.getTime() + 2 * 86400_000).toISOString(); // now + 2d
  const windowEnd = new Date(now.getTime() + 3 * 86400_000).toISOString(); // now + 3d

  // Atomic claim: only rows still NULL get stamped and returned to us.
  const { data: claimed, error } = await supabaseAdmin
    .from('profiles')
    .update({ reminder_sent_at: now.toISOString() })
    .is('reminder_sent_at', null)
    .is('stripe_subscription_id', null)
    .eq('access_state', 'trialing')
    .neq('role', 'admin')
    .gte('trial_ends_at', windowStart)
    .lte('trial_ends_at', windowEnd)
    .select('id, first_name, trial_ends_at');

  if (error) {
    console.error('[W1 trialReminder] claim failed:', error.message);
    throw error;
  }

  const rows = claimed ?? [];
  let sent = 0;

  for (const row of rows) {
    try {
      // Email lives on auth.users, not profiles — fetch it via the admin API.
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(row.id);
      const email = authData?.user?.email;
      if (!email) continue;

      await sendTrialReminder({
        to: email,
        firstName: row.first_name,
        trialEndsAt: new Date(row.trial_ends_at),
      });
      sent += 1;
    } catch (e: any) {
      // Send failed — release the claim so a later run retries this row.
      console.error(`[W1 trialReminder] send failed for ${row.id}:`, e.message);
      await supabaseAdmin
        .from('profiles')
        .update({ reminder_sent_at: null })
        .eq('id', row.id);
    }
  }

  console.log(`[W1 trialReminder] claimed=${rows.length} sent=${sent}`);
  return { claimed: rows.length, sent };
};

// Railway cron entrypoint: `tsx src/workers/trialReminder.ts`
if (process.argv[1] && process.argv[1].includes('trialReminder')) {
  runTrialReminder()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
