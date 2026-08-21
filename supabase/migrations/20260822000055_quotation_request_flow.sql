-- =============================================================================
-- Migration 055: Quotation request flow
--
-- Adds a 'requested' status (a customer-submitted quote request with no price
-- yet, awaiting admin pricing — distinct from 'draft' which is an internal
-- admin-only work-in-progress never shown to the customer) and structured
-- shipment-ready fields quotations didn't previously carry (city/state/
-- postcode per side, a cargo description) so that accepting a quotation can
-- create a matching shipment directly from its own stored data.
-- =============================================================================

ALTER TYPE quotation_status ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_requested';

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS origin_city        TEXT,
  ADD COLUMN IF NOT EXISTS origin_state       TEXT,
  ADD COLUMN IF NOT EXISTS origin_postcode    TEXT,
  ADD COLUMN IF NOT EXISTS destination_city     TEXT,
  ADD COLUMN IF NOT EXISTS destination_state    TEXT,
  ADD COLUMN IF NOT EXISTS destination_postcode TEXT,
  ADD COLUMN IF NOT EXISTS cargo_description TEXT,
  ADD COLUMN IF NOT EXISTS service_type       TEXT;
