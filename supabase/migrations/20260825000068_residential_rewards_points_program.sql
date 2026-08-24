-- =============================================================================
-- Migration 068: Residential Rewards Member Program (points-based)
-- =============================================================================
-- Replaces the flat "$1 credit per completed delivery" model (migrations
-- 048/052) with a simple points program, corporate customers untouched
-- (they were never part of this — tiers, migration 045, remain their
-- separate program):
--
--   Book a delivery (completed) → earn 1 point per $1 spent
--   500 points = $5 delivery credit (100 points = $1)
--   Birthday bonus: 250 points, once per calendar year
--   Points tracked automatically; redeemable toward a future delivery
--
-- customer_credit_balances/customer_credit_ledger (migration 052) already
-- exist and stay — they're residential-only tables — but the unit of
-- account changes from dollars to points. `balance`/`amount` (dollars) are
-- kept, not dropped, so nothing already reading them breaks; new code reads
-- points_balance/points going forward. Existing dollar balances are
-- converted 1:1 at the new rate (100 points = $1) so no value is lost.
-- =============================================================================

-- ── 1. Birthday bonus needs a birthday on file ──────────────────────────────
alter table profiles add column if not exists date_of_birth date;

-- ── 2. Points alongside the existing dollar columns ─────────────────────────
alter table customer_credit_balances add column if not exists points_balance integer not null default 0;
update customer_credit_balances set points_balance = round(balance * 100) where points_balance = 0 and balance > 0;

alter table customer_credit_ledger add column if not exists points integer not null default 0;

-- 'birthday_bonus' joins 'earn'/'redeem' as a ledger entry type.
alter table customer_credit_ledger drop constraint if exists customer_credit_ledger_type_check;
alter table customer_credit_ledger add constraint customer_credit_ledger_type_check
  check (type in ('earn', 'redeem', 'birthday_bonus'));

-- One birthday bonus per profile per calendar year — mirrors the existing
-- per-shipment/per-quotation dedupe indexes (migration 054) but keyed on
-- year instead, since there's no natural per-event id to hang it off.
-- date_trunc(text, timestamptz) is only STABLE (timezone-dependent), not
-- IMMUTABLE, so it can't sit directly in an index expression — converting
-- to a plain timestamp via `AT TIME ZONE 'UTC'` first makes it immutable.
create unique index if not exists idx_credit_ledger_birthday_bonus_per_year
  on customer_credit_ledger (profile_id, date_trunc('year', created_at at time zone 'UTC'))
  where type = 'birthday_bonus';

-- ── 3. Rewards rules — redesigned for the points program ────────────────────
-- Same table/pattern as migration 048 (rank/slug/title/description/value/
-- unit/is_editable) — the admin settings page and PATCH endpoint are
-- already fully generic over this shape, so no app code needs to change to
-- pick these up. {value} in description is a placeholder the frontend
-- interpolates (see formatDescription in admin/rewards/page.tsx).
delete from rewards_rules where slug in ('earn_credit', 'redeem_credit', 'max_balance', 'max_redemption', 'cash_value');

insert into rewards_rules (rank, slug, title, description, value, unit, is_editable) values
  (1, 'earn_rate',        'Earn Points',              'Earn {value} point for every $1 spent on a completed delivery.',              1,   'points_per_usd', true),
  (2, 'credit_conversion', 'Points to Delivery Credit', 'Every {value} points redeemed = $1.00 in delivery credit (500 points = $5).', 100, 'points',          true),
  (3, 'birthday_bonus',   'Birthday Bonus',            'Members automatically receive {value} bonus points on their birthday.',       250, 'points',          true),
  (4, 'auto_tracking',    'Automatic Tracking',        'Points are automatically tracked in the customer''s account — nothing to do.', null, null,             false),
  (5, 'redemption_policy', 'Redeeming Points',          'Customers can redeem their available points toward the cost of a future delivery.', null, null,      false)
on conflict (slug) do update set
  rank = excluded.rank, title = excluded.title, description = excluded.description,
  value = excluded.value, unit = excluded.unit, is_editable = excluded.is_editable;
