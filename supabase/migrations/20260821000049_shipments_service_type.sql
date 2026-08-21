-- =============================================================================
-- Migration 049: Last-Mile Service Type
--
-- shipments.service_type captures which specific last-mile service a delivery
-- is (Courier, Medical, Grocery, E-Commerce, Same-Day, Scheduled, Priority —
-- extensible), distinct from the existing shipment_type ('freight'/'last_mile'
-- classification). Plain TEXT, not a Postgres enum, so new service types can be
-- added later purely by updating the frontend option list — no migration needed.
-- =============================================================================

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS service_type TEXT;
