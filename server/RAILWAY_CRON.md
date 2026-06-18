# Railway cron — billing lifecycle workers

The billing lifecycle is driven by three workers that must run on a schedule:

| Worker | What it does | Needs |
|---|---|---|
| W1 `trialReminder` | Emails accounts ~3 days before trial end | Postmark |
| W2 `trialExpiry` | Flips no-card trials past `trial_ends_at` → `expired` | — |
| W3 `graceExpiry` | After the 7-day grace lapses, cancels the Stripe sub → `expired` | — |

They're bundled into one daily job: `npm run worker:cron`
(→ `src/workers/runDailyJobs.ts`, runs all three in sequence with per-job error isolation, then exits).

## Why a separate Railway service

A Railway **cron** service runs its start command on schedule and expects the
process to **exit**. Your web/API service is long-running and never exits, so it
**cannot** double as the cron job. Create a second service in the same project,
pointed at the same repo, with a cron schedule.

## Setup (Railway dashboard)

1. In your Railway **project** → **New** → **GitHub Repo** → select this repo
   (creating a second service alongside the existing API service).
2. **Settings → Root Directory:** `server`
3. **Settings → Deploy → Start Command:** `npm run worker:cron`
4. **Settings → Cron Schedule:** `0 14 * * *`  *(daily at 14:00 UTC ≈ 9am ET / 6am PT)*
   - Railway cron is always **UTC**. Adjust the hour to taste.
5. **Variables:** add the same env vars the API service uses. The cron job needs:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` (W3 cancels subscriptions)
   - `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL` (W1 email)
   - `FRONTEND_URL` (email CTA link)
   - *(Not needed: `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`.)*
   Tip: Railway lets you reference another service's variables so you don't duplicate.
6. Deploy. Check the service's logs after the first scheduled run — you should see:
   `[cron] daily billing jobs complete: {...}`

## Notes / gotchas

- **`tsx` at runtime:** both `npm start` and `npm run worker:cron` run via `tsx`
  (a devDependency). Railway/Nixpacks installs devDependencies by default, so this
  works. If you ever prune dev deps in production (`NPM_CONFIG_PRODUCTION=true`),
  move `tsx` into `dependencies`.
- **Idempotent & safe to re-run:** W1 claims rows atomically (`reminder_sent_at`),
  W2/W3 only match rows still needing action — so overlapping or repeated runs
  won't double-send or double-charge.
- **Manual run / local test:** `npm run worker:cron` (or the individual
  `worker:trial-reminder` / `worker:trial-expiry` / `worker:grace-expiry`).
- **Want separate schedules instead?** Create three cron services, each with one
  of the individual start commands and its own schedule.
- **Frequency:** daily is enough — the 7-day grace and ~3-day reminder window both
  tolerate a once-a-day cadence. Bump to e.g. `0 */6 * * *` if you want tighter
  grace-expiry timing.
