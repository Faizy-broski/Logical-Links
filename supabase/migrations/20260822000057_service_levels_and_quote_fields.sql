-- =============================================================================
-- Migration 057: Service Levels + Weight Pricing + Quotation Request Fields
--
-- The "Request a Quote" flow needs to capture Service Level, Number of
-- Packages, Weight, and Preferred Delivery Date (in addition to the address/
-- service-type/cargo fields it already had) — see shipments.service_level /
-- .weight_kg / .pieces / .preferred_delivery_date (migration 050), which
-- quotations never got equivalents of.
--
-- Service Level and Weight also become real pricing inputs for the
-- residential instant-quote calculator (Service Type already was):
--   - service_levels: admin-editable per-level multiplier (Standard 1.0x,
--     Express 1.25x, Same-Day 1.5x, Priority 1.75x) applied to the base
--     delivery charge, same full-CRUD pattern as delivery_rate_cards.
--   - pricing_settings: a single admin-editable $/kg rate applied to the
--     submitted weight and added to the subtotal.
-- =============================================================================

-- ── 1. service_levels ──────────────────────────────────────────────────────
create table if not exists service_levels (
  level_id    uuid primary key default gen_random_uuid(),
  slug        text not null unique,   -- standard / express / same_day / priority
  label       text not null,          -- "Same-Day"
  multiplier  numeric(6,3) not null default 1.000,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger service_levels_updated_at
  before update on service_levels
  for each row execute function set_updated_at();

insert into service_levels (slug, label, multiplier, sort_order) values
  ('standard', 'Standard',  1.000, 1),
  ('express',  'Express',   1.250, 2),
  ('same_day', 'Same-Day',  1.500, 3),
  ('priority', 'Priority',  1.750, 4)
on conflict (slug) do nothing;

-- ── 2. pricing_settings ────────────────────────────────────────────────────
-- Small key/value table for scalar pricing inputs that aren't per-service-type
-- rate cards. Starts with just the weight surcharge rate.
create table if not exists pricing_settings (
  key         text primary key,
  label       text not null,
  value       numeric not null,
  unit        text,
  updated_at  timestamptz not null default now()
);

create trigger pricing_settings_updated_at
  before update on pricing_settings
  for each row execute function set_updated_at();

insert into pricing_settings (key, label, value, unit) values
  ('weight_per_kg_rate', 'Weight Surcharge Rate', 0.50, 'usd_per_kg')
on conflict (key) do nothing;

-- ── 3. Quotation columns for the newly-captured request fields ────────────────
alter table quotations
  add column if not exists service_level          text,
  add column if not exists weight_kg               numeric(10,2),
  add column if not exists pieces                   int,
  add column if not exists preferred_delivery_date  timestamptz;

-- ── 4. RBAC: reuse the existing pricing.view / pricing.edit keys ─────────────
-- (seeded in migration 051 and already granted to ceo/vp, view-only to
-- manager/assistant) — service_levels and pricing_settings are gated by the
-- same permissions as delivery_rate_cards / additional_charges, no new
-- permission rows needed.
