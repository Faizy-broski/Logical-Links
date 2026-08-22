-- =============================================================================
-- Migration 063: Delivery number matches confirmation number format
--
-- load_number ("Delivery #", the primary identifier shown everywhere) and
-- reference_number ("Confirmation Number", migration 046) have always been
-- two independent auto-numbered fields with two different formats:
--   load_number:      LL-YYYY-NNNNN   (e.g. LL-2026-00064)
--   reference_number:  LLC-NNNN        (e.g. LLC-0006)
-- That inconsistency read as a bug. They stay two separate fields/sequences
-- (delivery # is still the primary identifier, confirmation # still a
-- secondary detail) — only the delivery number's FORMAT changes to match:
-- LLC-NNNN, generated from the same shipments_load_seq sequence it always
-- used. Existing rows keep their old LL-YYYY-##### numbers untouched; only
-- new deliveries get the new format.
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.load_number IS NULL THEN
    NEW.load_number :=
      'LLC-' || LPAD(nextval('shipments_load_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
