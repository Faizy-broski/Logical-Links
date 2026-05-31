-- =============================================================================
-- Migration 012: Align schema with project requirements
--
-- Changes:
--   1. Drop carriers, assignments, assignment_history, tracking_events tables
--      (carriers are out of scope per requirements)
--   2. Remove 'quoted' from shipment_status enum
--      (status machine: pending → confirmed → assigned → in_transit → delivered/cancelled)
--   3. Add is_approved boolean to profiles
--      (shipper approval workflow)
--   4. Recreate transition validation function without 'quoted'
--   5. Clean up orphaned indexes
-- =============================================================================

DROP POLICY IF EXISTS shipper_update_own_shipment ON shipments;
DROP TRIGGER IF EXISTS trg_stamp_delivery_date ON shipments;

-- ── 1. Drop tables (reverse FK order) ────────────────────────────────────────

DROP TABLE IF EXISTS tracking_events    CASCADE;
DROP TABLE IF EXISTS assignment_history CASCADE;
DROP TABLE IF EXISTS assignments        CASCADE;
DROP TABLE IF EXISTS carriers           CASCADE;

-- ── 2. Migrate 'quoted' rows before changing the enum ────────────────────────

UPDATE shipments
   SET status = 'pending'
 WHERE status = 'quoted';

UPDATE shipment_status_history
   SET old_status = 'pending'
 WHERE old_status = 'quoted';

UPDATE shipment_status_history
   SET new_status = 'pending'
 WHERE new_status = 'quoted';

-- ── 3. Drop objects that depend on the shipment_status enum type ──────────────
-- Must be dropped before altering the enum; recreated below.

DROP TRIGGER   IF EXISTS trg_validate_shipment_transition ON shipments;
DROP FUNCTION  IF EXISTS check_shipment_transition()                     CASCADE;
DROP FUNCTION  IF EXISTS is_valid_shipment_transition(shipment_status, shipment_status) CASCADE;
DROP FUNCTION  IF EXISTS get_current_assignment(UUID)                    CASCADE;

-- ── 4. Rebuild the enum without 'quoted' ─────────────────────────────────────
-- PostgreSQL does not support dropping individual enum values, so we recreate
-- the type under a temporary name, migrate all columns, then rename.

CREATE TYPE shipment_status_new AS ENUM (
  'pending',
  'confirmed',
  'assigned',
  'in_transit',
  'delivered',
  'cancelled'
);

-- shipments.status
ALTER TABLE shipments ALTER COLUMN status DROP DEFAULT;
ALTER TABLE shipments
  ALTER COLUMN status TYPE shipment_status_new
  USING status::text::shipment_status_new;
ALTER TABLE shipments ALTER COLUMN status SET DEFAULT 'pending'::shipment_status_new;

-- shipment_status_history.old_status / new_status
ALTER TABLE shipment_status_history
  ALTER COLUMN old_status TYPE shipment_status_new
  USING old_status::text::shipment_status_new;

ALTER TABLE shipment_status_history
  ALTER COLUMN new_status TYPE shipment_status_new
  USING new_status::text::shipment_status_new;

-- Swap types
DROP TYPE shipment_status;
ALTER TYPE shipment_status_new RENAME TO shipment_status;

CREATE TRIGGER trg_stamp_delivery_date
BEFORE UPDATE OF status ON shipments
FOR EACH ROW
EXECUTE FUNCTION stamp_delivery_date();

-- ── 5. Add is_approved to profiles ───────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- ── 6. Recreate transition validation (without 'quoted') ─────────────────────

CREATE OR REPLACE FUNCTION is_valid_shipment_transition(
  p_current shipment_status,
  p_next    shipment_status
) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_current
    WHEN 'pending'    THEN p_next IN ('confirmed',  'cancelled')
    WHEN 'confirmed'  THEN p_next IN ('assigned',   'cancelled')
    WHEN 'assigned'   THEN p_next IN ('in_transit', 'cancelled')
    WHEN 'in_transit' THEN p_next IN ('delivered',  'cancelled')
    WHEN 'delivered'  THEN FALSE
    WHEN 'cancelled'  THEN FALSE
    ELSE FALSE
  END;
END;
$$;

CREATE OR REPLACE FUNCTION check_shipment_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT is_valid_shipment_transition(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'Invalid shipment status transition: % → %', OLD.status, NEW.status
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_shipment_transition
  BEFORE UPDATE OF status ON shipments
  FOR EACH ROW EXECUTE FUNCTION check_shipment_transition();

-- ── 7. Drop orphaned indexes ──────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_carriers_active;
DROP INDEX IF EXISTS idx_carriers_name_trgm;
DROP INDEX IF EXISTS idx_carriers_code;
DROP INDEX IF EXISTS idx_assignments_shipment;
DROP INDEX IF EXISTS idx_assignments_carrier;
DROP INDEX IF EXISTS idx_assignments_status;
DROP INDEX IF EXISTS idx_assignments_current;
DROP INDEX IF EXISTS idx_assignments_created;
DROP INDEX IF EXISTS idx_assignments_assignee;
DROP INDEX IF EXISTS idx_ah_assignment;
DROP INDEX IF EXISTS idx_ah_shipment;
DROP INDEX IF EXISTS idx_te_shipment_time;
DROP INDEX IF EXISTS idx_te_assignment;
DROP INDEX IF EXISTS idx_te_event_type;
DROP INDEX IF EXISTS idx_te_geo;

CREATE POLICY shipper_update_own_shipment
ON shipments
FOR UPDATE
USING (
  current_user_role() = 'shipper'::user_role
  AND account_id = current_account_id()
  AND status = ANY (
    ARRAY[
      'pending'::shipment_status
    ]
  )
  AND deleted_at IS NULL
);