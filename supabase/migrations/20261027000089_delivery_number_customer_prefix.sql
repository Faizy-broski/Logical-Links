-- =============================================================================
-- Migration 089: Delivery numbers show the customer type
-- =============================================================================
-- load_number ("Delivery #") now carries the customer type in its prefix:
--   LLCR-NNNN  residential customer (shipments.customer_id set)
--   LLCC-NNNN  corporate customer   (shipments.account_id set)
--   LLC-NNNN   no customer attached yet
-- The digits still come from the single shipments_load_seq sequence, so every
-- number stays unique across both prefixes (load_number is also UNIQUE).
-- If a delivery's customer changes, only the prefix is swapped; the digits
-- never change. Existing LLC-NNNN rows are re-prefixed the same way; the
-- older LL-YYYY-NNNNN numbers (pre-migration 063) are left untouched.
-- =============================================================================

CREATE OR REPLACE FUNCTION load_number_prefix(p_customer_id UUID, p_account_id UUID)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_customer_id IS NOT NULL THEN 'LLCR-'
    WHEN p_account_id  IS NOT NULL THEN 'LLCC-'
    ELSE 'LLC-'
  END
$$;

-- New deliveries (trigger trg_load_number, BEFORE INSERT, from migration 004).
CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.load_number IS NULL THEN
    NEW.load_number :=
      load_number_prefix(NEW.customer_id, NEW.account_id)
      || LPAD(nextval('shipments_load_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Customer reassigned → keep the digits, swap the prefix.
CREATE OR REPLACE FUNCTION refresh_load_number_prefix()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  digits TEXT := substring(NEW.load_number FROM '^LLC[RC]?-(\d+)$');
BEGIN
  IF digits IS NOT NULL THEN
    NEW.load_number := load_number_prefix(NEW.customer_id, NEW.account_id) || digits;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_load_number_prefix ON shipments;
CREATE TRIGGER trg_load_number_prefix
  BEFORE UPDATE OF customer_id, account_id ON shipments
  FOR EACH ROW
  WHEN (OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.account_id IS DISTINCT FROM NEW.account_id)
  EXECUTE FUNCTION refresh_load_number_prefix();

-- Backfill existing LLC-NNNN numbers (digits kept, so no collisions).
UPDATE shipments
   SET load_number = load_number_prefix(customer_id, account_id)
                     || substring(load_number FROM '^LLC-(\d+)$')
 WHERE load_number ~ '^LLC-\d+$'
   AND (customer_id IS NOT NULL OR account_id IS NOT NULL);
