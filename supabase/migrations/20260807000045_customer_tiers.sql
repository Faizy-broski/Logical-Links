-- ============================================================
-- Migration 000045: Corporate Customer Tiers
-- Standard / Preferred / Priority / Enterprise loyalty tiers for
-- shipper (corporate) accounts, unlocked by lifetime delivered
-- shipment count. Thresholds and benefit copy are admin-editable
-- from Admin > Tiers.
-- ============================================================

-- ── 1. customer_tiers ───────────────────────────────────────────────────────
create table if not exists customer_tiers (
  tier_id           uuid primary key default gen_random_uuid(),
  rank              smallint not null unique,        -- 1..4, ascending tier order
  slug              text not null unique,             -- standard / preferred / priority / enterprise
  name              text not null,                     -- "Standard Partner", etc.
  min_deliveries    integer not null default 0,        -- lifetime delivered shipments required to reach this tier
  -- This tier's OWN additional benefits only — cumulative display is computed
  -- by concatenating every tier's benefits up to and including the target rank.
  benefits          text[] not null default '{}',
  quote_turnaround  text not null,                     -- static SLA label shown alongside benefits
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Reuses set_updated_at(), created by the load tracking migration (000028).
create trigger customer_tiers_updated_at
  before update on customer_tiers
  for each row execute function set_updated_at();

-- ── 2. Seed the 4 fixed tiers ────────────────────────────────────────────────
insert into customer_tiers (rank, slug, name, min_deliveries, benefits, quote_turnaround) values
  (1, 'standard', 'Standard Partner', 0,
    array[
      'Full portal access',
      'Real-time shipment tracking',
      'GPS tracking visibility',
      'Shipment history',
      'Invoice access',
      'Standard support'
    ],
    'Within 1 business day'),
  (2, 'preferred', 'Preferred Partner', 25,
    array[
      'Priority quote turnaround',
      'Monthly activity reports',
      'Preferred dispatch consideration'
    ],
    'Within 6 hours'),
  (3, 'priority', 'Priority Partner', 75,
    array[
      'Higher dispatch priority',
      'Dedicated account representative',
      'Custom performance reporting'
    ],
    'Within 2 hours'),
  (4, 'enterprise', 'Enterprise Partner', 200,
    array[
      'Message: will be in future'
    ],
    'Immediate')
on conflict (slug) do nothing;

-- ── 3. RBAC: tiers.view / tiers.edit permissions ────────────────────────────
insert into permissions (key, category, label, sort_order) values
  ('tiers.view', 'Customer Management', 'View Tiers', 5),
  ('tiers.edit', 'Customer Management', 'Edit Tiers', 6)
on conflict (key) do nothing;

-- CEO: everything (existing blanket grant already covers new keys via the
-- app's own re-run of that seed if needed, but insert explicitly here too
-- since this migration runs after the original CEO seed).
insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'ceo', key, true from permissions where key in ('tiers.view', 'tiers.edit')
on conflict (admin_role, permission_key) do nothing;

-- VP: gets both automatically under the original "category not in (...)" rule
-- (Customer Management isn't excluded), seeded explicitly here for the same reason.
insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'vp', key, true from permissions where key in ('tiers.view', 'tiers.edit')
on conflict (admin_role, permission_key) do nothing;

-- Manager & Assistant: view-only, mirroring their customers.view-but-not-edit access.
insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'tiers.view', true
  from (values ('manager'::admin_role), ('assistant'::admin_role)) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'tiers.edit', false
  from (values ('manager'::admin_role), ('assistant'::admin_role)) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;
