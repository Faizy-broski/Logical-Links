-- ============================================================
-- Migration 000028: Load Tracking System
-- Run this SQL in your Supabase SQL editor (or psql).
-- ============================================================

create extension if not exists citext;

-- ── 1. locations ─────────────────────────────────────────────────────────────
create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  province    text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- No duplicate city within the same province (case-insensitive)
  -- constraint locations_city_province_unique unique (lower(city), lower(province))
  constraint locations_city_province_unique unique (city, province)
);

-- Trigger: keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger locations_updated_at
  before update on locations
  for each row execute function set_updated_at();

-- ── 2. Seed: Canadian provinces ──────────────────────────────────────────────
-- (insert cities below - duplicates are ignored)

insert into locations (city, province) values
  -- Alberta
  ('Calgary',           'Alberta'),
  ('Edmonton',          'Alberta'),
  ('Red Deer',          'Alberta'),
  ('Lethbridge',        'Alberta'),
  ('St. Albert',        'Alberta'),
  ('Medicine Hat',      'Alberta'),
  ('Grande Prairie',    'Alberta'),
  ('Airdrie',           'Alberta'),
  ('Spruce Grove',      'Alberta'),
  ('Okotoks',           'Alberta'),
  -- British Columbia
  ('Vancouver',         'British Columbia'),
  ('Surrey',            'British Columbia'),
  ('Burnaby',           'British Columbia'),
  ('Richmond',          'British Columbia'),
  ('Kelowna',           'British Columbia'),
  ('Abbotsford',        'British Columbia'),
  ('Coquitlam',         'British Columbia'),
  ('Langley',           'British Columbia'),
  ('Saanich',           'British Columbia'),
  ('Delta',             'British Columbia'),
  ('Kamloops',          'British Columbia'),
  ('Nanaimo',           'British Columbia'),
  ('Victoria',          'British Columbia'),
  ('Prince George',     'British Columbia'),
  -- Manitoba
  ('Winnipeg',          'Manitoba'),
  ('Brandon',           'Manitoba'),
  ('Steinbach',         'Manitoba'),
  ('Thompson',          'Manitoba'),
  ('Portage la Prairie','Manitoba'),
  -- New Brunswick
  ('Moncton',           'New Brunswick'),
  ('Saint John',        'New Brunswick'),
  ('Fredericton',       'New Brunswick'),
  ('Miramichi',         'New Brunswick'),
  ('Bathurst',          'New Brunswick'),
  -- Newfoundland and Labrador
  ('St. John''s',       'Newfoundland and Labrador'),
  ('Mount Pearl',       'Newfoundland and Labrador'),
  ('Corner Brook',      'Newfoundland and Labrador'),
  ('Paradise',          'Newfoundland and Labrador'),
  -- Nova Scotia
  ('Halifax',           'Nova Scotia'),
  ('Cape Breton',       'Nova Scotia'),
  ('Truro',             'Nova Scotia'),
  ('New Glasgow',       'Nova Scotia'),
  -- Ontario
  ('Toronto',           'Ontario'),
  ('Ottawa',            'Ontario'),
  ('Mississauga',       'Ontario'),
  ('Brampton',          'Ontario'),
  ('Hamilton',          'Ontario'),
  ('London',            'Ontario'),
  ('Markham',           'Ontario'),
  ('Vaughan',           'Ontario'),
  ('Kitchener',         'Ontario'),
  ('Windsor',           'Ontario'),
  ('Oakville',          'Ontario'),
  ('Burlington',        'Ontario'),
  ('Greater Sudbury',   'Ontario'),
  ('Oshawa',            'Ontario'),
  ('Barrie',            'Ontario'),
  ('Richmond Hill',     'Ontario'),
  ('Guelph',            'Ontario'),
  ('Ajax',              'Ontario'),
  ('Whitby',            'Ontario'),
  ('Pickering',         'Ontario'),
  ('Newmarket',         'Ontario'),
  ('Thunder Bay',       'Ontario'),
  ('Waterloo',          'Ontario'),
  ('Cambridge',         'Ontario'),
  ('Kingston',          'Ontario'),
  ('Chatham-Kent',      'Ontario'),
  ('Brantford',         'Ontario'),
  ('Clarington',        'Ontario'),
  ('Halton Hills',      'Ontario'),
  ('Milton',            'Ontario'),
  ('Peterborough',      'Ontario'),
  ('Sarnia',            'Ontario'),
  ('St. Catharines',    'Ontario'),
  ('Niagara Falls',     'Ontario'),
  -- Prince Edward Island
  ('Charlottetown',     'Prince Edward Island'),
  ('Summerside',        'Prince Edward Island'),
  -- Quebec
  ('Montreal',          'Quebec'),
  ('Quebec City',       'Quebec'),
  ('Laval',             'Quebec'),
  ('Gatineau',          'Quebec'),
  ('Longueuil',         'Quebec'),
  ('Sherbrooke',        'Quebec'),
  ('Saguenay',          'Quebec'),
  ('Lévis',             'Quebec'),
  ('Trois-Rivières',    'Quebec'),
  ('Terrebonne',        'Quebec'),
  ('Repentigny',        'Quebec'),
  ('Brossard',          'Quebec'),
  ('Drummondville',     'Quebec'),
  ('Saint-Jean-sur-Richelieu', 'Quebec'),
  -- Saskatchewan
  ('Saskatoon',         'Saskatchewan'),
  ('Regina',            'Saskatchewan'),
  ('Prince Albert',     'Saskatchewan'),
  ('Moose Jaw',         'Saskatchewan'),
  ('Swift Current',     'Saskatchewan'),
  -- Northwest Territories
  ('Yellowknife',       'Northwest Territories'),
  ('Hay River',         'Northwest Territories'),
  ('Inuvik',            'Northwest Territories'),
  -- Nunavut
  ('Iqaluit',           'Nunavut'),
  ('Rankin Inlet',      'Nunavut'),
  -- Yukon
  ('Whitehorse',        'Yukon'),
  ('Dawson City',       'Yukon')
on conflict do nothing;

-- ── 3. load_tracking_events ───────────────────────────────────────────────────
create table if not exists load_tracking_events (
  id               uuid primary key default gen_random_uuid(),
  load_id          uuid not null references shipments(shipment_id) on delete cascade,
  location_id      uuid references locations(id) on delete set null,
  tracking_status  text not null,
  notes            text,
  created_by       uuid not null references profiles(id) on delete restrict,
  created_by_role  text not null,     -- 'admin' | 'company_admin' | 'employee'
  event_timestamp  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger load_tracking_events_updated_at
  before update on load_tracking_events
  for each row execute function set_updated_at();

-- Index for fast per-load timeline queries
create index if not exists idx_load_tracking_events_load_id
  on load_tracking_events(load_id, event_timestamp desc);

-- Index for per-creator queries (employee edits own events)
create index if not exists idx_load_tracking_events_created_by
  on load_tracking_events(created_by);
