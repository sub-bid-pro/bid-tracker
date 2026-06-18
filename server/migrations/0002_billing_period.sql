-- ============================================================================
-- Billing v2 — surface the billing period + pending cancellation on the profile
-- so the UI can show "Active until <date> · won't renew" instead of a bare
-- "Active". Run once against Supabase.
-- ============================================================================

alter table public.profiles
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;
