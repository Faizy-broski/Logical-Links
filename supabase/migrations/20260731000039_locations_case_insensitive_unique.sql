-- =============================================================================
-- Migration 039: Case-insensitive uniqueness for locations
-- =============================================================================
-- The original table constraint (migration 028) is unique(city, province) —
-- exact case only. The app's duplicate check (locations.repository.ts
-- checkDuplicate) uses .ilike(), i.e. case-insensitive — so two concurrent
-- POST /locations requests for "Toronto"/"toronto" both pass the app-level
-- check and can both insert, since the DB constraint doesn't catch case
-- variants. This closes that gap with a case-insensitive unique index,
-- matching what the original migration's comment already intended.

-- Remove the unique constraint (this automatically removes its backing index)
ALTER TABLE locations
DROP CONSTRAINT IF EXISTS locations_city_province_unique;

-- Create the new case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS locations_city_province_ci_unique
ON locations (LOWER(city), LOWER(province));
