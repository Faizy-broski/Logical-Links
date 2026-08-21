-- ============================================================
-- Migration 048: Rewards Credit Program Rules
-- Residential customer Rewards Credit program — editable admin
-- settings page mirroring the customer_tiers pattern (migration 045).
-- ============================================================

-- ── 1. rewards_rules ─────────────────────────────────────────────────────────
create table if not exists rewards_rules (
  rule_id      uuid primary key default gen_random_uuid(),
  rank         smallint not null unique,
  slug         text not null unique,           -- earn_credit / redeem_credit / max_balance / max_redemption / cash_value
  title        text not null,                   -- "Earn Rewards Credit"
  description  text not null,                   -- static copy; {value} is a placeholder the frontend interpolates
  value        numeric,                         -- nullable: 100.00 / 50 / null for non-numeric rules
  unit         text,                            -- 'usd' | 'percent' | null
  is_editable  boolean not null default false,  -- only max_balance and max_redemption are editable
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger rewards_rules_updated_at
  before update on rewards_rules
  for each row execute function set_updated_at();

-- ── 2. Seed the 5 fixed rules ────────────────────────────────────────────────
insert into rewards_rules (rank, slug, title, description, value, unit, is_editable) values
  (1, 'earn_credit',    'Earn Rewards Credit',   '${value} Rewards Credit is automatically added for every completed eligible delivery.', 1,    'usd',     false),
  (2, 'redeem_credit',  'Redeem Rewards Credit', 'Customers can use their available Rewards Credit toward eligible deliveries.',           null, null,      false),
  (3, 'max_balance',    'Maximum Balance',       'Customers can hold up to ${value} in Rewards Credit.',                                   100,  'usd',     true),
  (4, 'max_redemption', 'Maximum Redemption',    'Customers can use Rewards Credit for up to {value}% of the delivery cost.',              50,   'percent', true),
  (5, 'cash_value',     'Cash Value',            'Rewards Credit has no cash value and cannot be exchanged for cash.',                      null, null,      false)
on conflict (slug) do nothing;

-- ── 3. RBAC: rewards.view / rewards.edit permissions ────────────────────────
insert into permissions (key, category, label, sort_order) values
  ('rewards.view', 'Customer Management', 'View Rewards', 7),
  ('rewards.edit', 'Customer Management', 'Edit Rewards', 8)
on conflict (key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'ceo', key, true from permissions where key in ('rewards.view', 'rewards.edit')
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'vp', key, true from permissions where key in ('rewards.view', 'rewards.edit')
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'rewards.view', true
  from (values ('manager'), ('assistant')) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'rewards.edit', false
  from (values ('manager'), ('assistant')) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;
