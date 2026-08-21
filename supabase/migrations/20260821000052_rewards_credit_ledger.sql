-- =============================================================================
-- Migration 052: Rewards Credit ledger
--
-- Residential customer Rewards Credit program (Aug 3 PDF): $1 earned per
-- completed eligible delivery, capped at rewards_rules.max_balance; redeemable
-- up to rewards_rules.max_redemption% of a quotation total. Append-only ledger
-- with a maintained balance column (avoids recomputing from history on read).
-- =============================================================================

create table if not exists customer_credit_balances (
  profile_id  uuid primary key references profiles (id) on delete cascade,
  balance     numeric(10,2) not null default 0,
  updated_at  timestamptz not null default now()
);

create trigger customer_credit_balances_updated_at
  before update on customer_credit_balances
  for each row execute function set_updated_at();

create table if not exists customer_credit_ledger (
  ledger_id   uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  shipment_id uuid references shipments (shipment_id) on delete set null,
  quotation_id uuid references quotations (id) on delete set null,
  amount      numeric(10,2) not null,          -- positive for earn, negative for redeem
  type        text not null check (type in ('earn', 'redeem')),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_credit_ledger_profile_id on customer_credit_ledger (profile_id, created_at desc);

-- quotations.rewards_credit_applied — how much of this quotation's total was
-- covered by the customer's Rewards Credit balance.
alter table quotations
  add column if not exists rewards_credit_applied numeric(14,2) not null default 0;
