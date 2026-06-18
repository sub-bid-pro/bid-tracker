-- ============================================================================
-- Billing v2 / Conversion Gate / Dunning Grace — schema additions
-- Run once against Supabase (SQL editor or migration tool).
-- The profiles billing columns (access_state, trial_ends_at, stripe_*, grace_*,
-- successful_payment_count, reminder_sent_at, connection_at) already exist.
-- ============================================================================

-- 1. Role for paywall bypass (dev/admin/support). member = normal customer.
alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('member', 'admin'));

-- 2. Webhook idempotency ledger. Every Stripe event id is recorded exactly once;
--    a duplicate delivery is a no-op.
create table if not exists public.stripe_events (
  event_id     text primary key,
  type         text,
  processed_at timestamptz not null default now()
);

-- 3. Paid coverage windows. Recorded in v1 (not yet enforced at query time);
--    enables period-accurate data gating in a later phase.
create table if not exists public.coverage_periods (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  period_start timestamptz not null,
  period_end   timestamptz not null,
  source       text,            -- e.g. 'invoice', stripe invoice id
  created_at   timestamptz not null default now(),
  unique (user_id, period_start, period_end)
);

create index if not exists coverage_periods_user_idx
  on public.coverage_periods (user_id);

-- 4. Atomic increment for successful_payment_count (avoids read-modify-write
--    races across concurrent webhook deliveries).
create or replace function public.increment_successful_payment_count(p_user_id uuid)
returns integer
language sql
as $$
  update public.profiles
     set successful_payment_count = coalesce(successful_payment_count, 0) + 1
   where id = p_user_id
  returning successful_payment_count;
$$;

-- 5. Indexes backing the scheduled workers' scan predicates.
create index if not exists profiles_trial_reminder_idx
  on public.profiles (trial_ends_at)
  where stripe_subscription_id is null and reminder_sent_at is null;

create index if not exists profiles_trial_expiry_idx
  on public.profiles (trial_ends_at)
  where access_state = 'trialing' and stripe_subscription_id is null;

create index if not exists profiles_grace_expiry_idx
  on public.profiles (grace_ends_at)
  where access_state = 'past_due';

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);
