-- =============================================================================
-- Migration 051: Delivery Rate Library + Additional Charges Library
--
-- Admin-editable pricing settings (Aug 3 PDF) so nothing about delivery
-- pricing is hard-coded — the Pricing Calculator (Phase H) reads from these
-- two tables. Both support full CRUD (unlike the fixed-cardinality
-- customer_tiers/rewards_rules pattern) since the client explicitly wants to
-- add/remove fees and add new service types without a deploy.
-- =============================================================================

-- ── 1. delivery_rate_cards ────────────────────────────────────────────────────
create table if not exists delivery_rate_cards (
  rate_id         uuid primary key default gen_random_uuid(),
  service_type    text not null unique,   -- matches shipments.service_type values (courier/medical/grocery/ecommerce/...)
  label           text not null,          -- "Courier Delivery"
  base_fee        numeric(10,2) not null default 0,
  per_km_rate     numeric(10,4) not null default 0,
  minimum_charge  numeric(10,2) not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger delivery_rate_cards_updated_at
  before update on delivery_rate_cards
  for each row execute function set_updated_at();

insert into delivery_rate_cards (service_type, label, base_fee, per_km_rate, minimum_charge) values
  ('grocery',   'Food / Grocery Delivery', 7.00, 0.75, 12.00),
  ('ecommerce', 'E-Commerce Delivery',     8.00, 0.80, 15.00),
  ('courier',   'Courier Delivery',        8.00, 0.85, 15.00),
  ('medical',   'Medical Delivery',       20.00, 1.00, 30.00)
on conflict (service_type) do nothing;

-- ── 2. additional_charges ─────────────────────────────────────────────────────
create table if not exists additional_charges (
  charge_id    uuid primary key default gen_random_uuid(),
  key          text not null unique,     -- after_hours / weekend / signature_required / ...
  category     text not null,            -- accessorial / medical / adjustment
  label        text not null,
  amount       numeric(10,2),            -- null for "admin controlled" charges like Fuel Surcharge
  unit         text not null default 'flat',  -- flat / per_hour / per_stop / per_km
  purpose      text,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger additional_charges_updated_at
  before update on additional_charges
  for each row execute function set_updated_at();

insert into additional_charges (key, category, label, amount, unit, purpose, is_active, sort_order) values
  ('after_hours',        'accessorial', 'After-Hours Delivery Surcharge', 25.00, 'flat',     'Deliveries outside normal business hours', true, 1),
  ('weekend',             'accessorial', 'Weekend Delivery Surcharge',     20.00, 'flat',     'Saturday/Sunday delivery premium', true, 2),
  ('signature_required',  'accessorial', 'Signature Required',             5.00, 'flat',     'Customer signature confirmation', true, 3),
  ('proof_of_delivery',   'accessorial', 'Proof of Delivery',              5.00, 'flat',     'Delivery confirmation/documentation', true, 4),
  ('priority_service',    'accessorial', 'Priority Delivery Service',     15.00, 'flat',     'Expedited handling or dispatch priority', true, 5),
  ('waiting_time',        'accessorial', 'Waiting Time',                  35.00, 'per_hour', 'Driver waiting beyond reasonable pickup/delivery time (after first 15 min)', true, 6),
  ('additional_stop',     'accessorial', 'Additional Stop',               15.00, 'per_stop', 'Extra pickup or delivery location', true, 7),
  ('heavy_item',          'accessorial', 'Heavy Item Handling',           25.00, 'flat',     'Items requiring additional handling', true, 8),
  ('oversized_item',      'accessorial', 'Oversized Item Handling',       35.00, 'flat',     'Items requiring additional vehicle space or handling', true, 9),
  ('special_handling',    'accessorial', 'Special Handling',              25.00, 'flat',     'Non-standard delivery requirements', true, 10),
  ('failed_delivery',     'accessorial', 'Failed Delivery Attempt',       15.00, 'flat',     'Customer unavailable or unsuccessful delivery attempt', true, 11),
  ('return_trip',         'accessorial', 'Return Trip Fee',               20.00, 'per_km',   'Returning item to origin or alternate location (plus KM charge)', true, 12),

  ('medical_handling',    'medical', 'Medical Handling Fee',             20.00, 'flat', 'Additional care required for medical shipments', true, 20),
  ('temperature_controlled','medical','Temperature Controlled Handling', 35.00, 'flat', 'Refrigerated or temperature-sensitive items', true, 21),
  ('chain_of_custody',    'medical', 'Chain of Custody Handling',        25.00, 'flat', 'Additional tracking/documentation requirements', true, 22),

  ('delivery_area',       'adjustment', 'Delivery Area Surcharge',       15.00, 'flat', 'Used for deliveries outside normal service areas or locations that require additional travel time.', false, 30),
  ('remote_location',     'adjustment', 'Remote Location Surcharge',     25.00, 'flat', 'Used for rural, difficult-to-access, or low-density areas where the delivery requires additional travel time and operating costs.', false, 31),
  ('fuel_surcharge',      'adjustment', 'Fuel Surcharge',                  null, 'flat', 'Admin controlled — used when fuel costs increase significantly, without changing the main delivery rates.', false, 32),
  ('holiday_delivery',    'adjustment', 'Holiday Delivery Surcharge',    35.00, 'flat', 'Used for deliveries requested on statutory holidays or special operating days.', false, 33)
on conflict (key) do nothing;

-- ── 3. RBAC: pricing.view / pricing.edit permissions ────────────────────────
insert into permissions (key, category, label, sort_order) values
  ('pricing.view', 'System Settings', 'View Pricing Settings', 6),
  ('pricing.edit', 'System Settings', 'Edit Pricing Settings', 7)
on conflict (key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'ceo', key, true from permissions where key in ('pricing.view', 'pricing.edit')
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select 'vp', key, true from permissions where key in ('pricing.view', 'pricing.edit')
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'pricing.view', true
  from (values ('manager'), ('assistant')) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;

insert into admin_role_permissions (admin_role, permission_key, granted)
  select r.admin_role, 'pricing.edit', false
  from (values ('manager'), ('assistant')) as r(admin_role)
on conflict (admin_role, permission_key) do nothing;
