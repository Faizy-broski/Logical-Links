-- =============================================================================
-- Migration 046: Auto-generated Delivery Confirmation Numbers
--
-- reference_number format: LLC-0001 (4-digit, no year segment)
-- Mirrors the invoices_seq / generate_invoice_number() pattern from migration 021.
-- Reuses the existing shipments.reference_number column — no rename, no backfill
-- of historical rows (old manually-entered values are left as-is; only new
-- inserts going forward get the auto-generated format).
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS shipments_confirmation_seq START 1;

CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number :=
      'LLC-' || LPAD(nextval('shipments_confirmation_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_confirmation_number
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_confirmation_number();
