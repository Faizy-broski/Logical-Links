-- =============================================================================
-- Migration 050: Logistics-style Shipment Details fields
--
-- Adds the fields the redesigned quotation "Shipment Details" section needs
-- (Aug 3 PDF) that the shipments table doesn't capture yet:
--   service_level           e.g. Standard/Express/Same-Day/Priority — distinct
--                            from service_type (added in migration 049)
--   package_type             Pallet/Box/Crate/Envelope/Other
--   preferred_delivery_date  the customer's requested date, distinct from the
--                            existing estimated_delivery_date (the ops estimate)
-- All plain TEXT/TIMESTAMPTZ, not enums, so the option lists stay editable in
-- the frontend without a migration.
-- =============================================================================

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS service_level TEXT,
  ADD COLUMN IF NOT EXISTS package_type TEXT,
  ADD COLUMN IF NOT EXISTS preferred_delivery_date TIMESTAMPTZ;
