import { runTrialReminder } from './trialReminder';
import { runTrialExpiry } from './trialExpiry';
import { runGraceExpiry } from './graceExpiry';

/**
 * Combined daily billing cron. Runs all three lifecycle workers in sequence with
 * per-job error isolation (one failure won't stop the others), then exits — which
 * is what Railway's scheduled (cron) services expect.
 *
 * Railway: a separate service with start command `npm run worker:cron` and a
 * daily cron schedule. See server/RAILWAY_CRON.md.
 */
const run = async () => {
  const now = new Date();
  const jobs: Array<[string, () => Promise<unknown>]> = [
    ['trialReminder', () => runTrialReminder(now)],
    ['trialExpiry', () => runTrialExpiry(now)],
    ['graceExpiry', () => runGraceExpiry(now)],
  ];

  const results: Record<string, unknown> = {};
  for (const [name, fn] of jobs) {
    try {
      results[name] = await fn();
    } catch (err: any) {
      console.error(`[cron] ${name} failed:`, err?.message ?? err);
      results[name] = { error: err?.message ?? String(err) };
    }
  }

  console.log('[cron] daily billing jobs complete:', JSON.stringify(results));
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[cron] fatal:', err);
    process.exit(1);
  });
