-- =============================================================================
-- Migration 061: Allow 'residential' in shipments.created_by_role
--
-- The check constraint added in migration 024 (shipper_owned_loads) predates
-- residential customers entirely — it only allowed ('admin', 'shipper').
-- shipments.service.ts createShipment() has always passed the caller's real
-- role through as created_by_role, so every residential-created shipment
-- (quotation acceptance, self-service booking) has been rejected with
-- "new row for relation shipments violates check constraint
-- shipments_created_by_role_check" since residential customers shipped.
-- =============================================================================

ALTER TABLE shipments DROP CONSTRAINT shipments_created_by_role_check;

ALTER TABLE shipments
  ADD CONSTRAINT shipments_created_by_role_check
    CHECK (created_by_role IN ('admin', 'shipper', 'residential'));
