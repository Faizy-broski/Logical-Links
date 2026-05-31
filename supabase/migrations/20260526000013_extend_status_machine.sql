-- =============================================================================
-- Migration 013: Extend shipment status machine + fix shipper RLS
--
-- Changes:
--   1. Add 'picked_up' and 'out_for_delivery' to shipment_status enum
--      New machine: pending → confirmed → assigned → picked_up → in_transit
--                   → out_for_delivery → delivered (any pre-terminal → cancelled)
--   2. Add 'shipment_picked_up' and 'shipment_out_for_delivery' to notification_type
--   3. Rebuild is_valid_shipment_transition() and check_shipment_transition trigger
--   4. Update stamp_delivery_date() to also stamp actual_pickup_date on picked_up
--   5. Fix shipper RLS policies to cover both account_id and created_by ownership
-- =============================================================================

-- ── 1. Extend shipment_status enum ───────────────────────────────────────────
-- PostgreSQL allows adding enum values but not removing them.
-- 'picked_up' slots between 'assigned' and 'in_transit'.
-- 'out_for_delivery' slots between 'in_transit' and 'delivered'.

ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'picked_up'        AFTER 'assigned';
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'out_for_delivery' AFTER 'in_transit';

-- ── 2. Extend notification_type enum ─────────────────────────────────────────

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_picked_up'        AFTER 'shipment_in_transit';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_out_for_delivery' AFTER 'shipment_picked_up';

-- ── 3. Rebuild transition functions ──────────────────────────────────────────
-- Must drop trigger before dropping functions it depends on.

DROP TRIGGER   IF EXISTS trg_validate_shipment_transition ON shipments;
DROP FUNCTION  IF EXISTS is_valid_shipment_transition(shipment_status, shipment_status) CASCADE;
DROP FUNCTION  IF EXISTS check_shipment_transition() CASCADE;

CREATE OR REPLACE FUNCTION is_valid_shipment_transition(
  p_current shipment_status,
  p_next    shipment_status
) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_current
    WHEN 'pending'          THEN p_next IN ('confirmed',        'cancelled')
    WHEN 'confirmed'        THEN p_next IN ('assigned',         'cancelled')
    WHEN 'assigned'         THEN p_next IN ('picked_up',        'cancelled')
    WHEN 'picked_up'        THEN p_next IN ('in_transit',       'cancelled')
    WHEN 'in_transit'       THEN p_next IN ('out_for_delivery', 'cancelled')
    WHEN 'out_for_delivery' THEN p_next IN ('delivered',        'cancelled')
    WHEN 'delivered'        THEN FALSE
    WHEN 'cancelled'        THEN FALSE
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

-- ── 4. Auto-stamp pickup date ─────────────────────────────────────────────────
-- Extend stamp_delivery_date() to also capture actual_pickup_date when
-- the shipment first moves to 'picked_up'.

DROP TRIGGER   IF EXISTS trg_stamp_delivery_date ON shipments;
DROP FUNCTION  IF EXISTS stamp_delivery_date() CASCADE;

CREATE OR REPLACE FUNCTION stamp_delivery_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'picked_up' AND OLD.status <> 'picked_up' THEN
    NEW.actual_pickup_date := COALESCE(NEW.actual_pickup_date, now());
  END IF;
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    NEW.actual_delivery_date := COALESCE(NEW.actual_delivery_date, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stamp_delivery_date
  BEFORE UPDATE OF status ON shipments
  FOR EACH ROW EXECUTE FUNCTION stamp_delivery_date();

-- ── 5. Fix shipper RLS policies ───────────────────────────────────────────────
-- The original policies only checked account_id. Shippers who create a load
-- before being assigned to an account (or whose load was not yet assigned to
-- their account) need to be covered by the created_by check as well.

-- SELECT: shippers see shipments they own via account OR ones they created
DROP POLICY IF EXISTS shipper_own_account_shipments ON shipments;
CREATE POLICY shipper_own_account_shipments ON shipments
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND deleted_at IS NULL
    AND (
      account_id = current_account_id()
      OR created_by = auth.uid()
    )
  );

-- UPDATE: shippers may update any non-deleted shipment they own via account OR created
-- (the service layer enforces which field updates are permitted; this is defence-in-depth)
DROP POLICY IF EXISTS shipper_update_own_shipment ON shipments;
CREATE POLICY shipper_update_own_shipment ON shipments
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND deleted_at IS NULL
    AND (
      account_id = current_account_id()
      OR created_by = auth.uid()
    )
  );

-- Status history: shippers read history for shipments they can see
DROP POLICY IF EXISTS shipper_read_own_ssh ON shipment_status_history;
CREATE POLICY shipper_read_own_ssh ON shipment_status_history
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  deleted_at IS NULL
        AND  (account_id = current_account_id() OR created_by = auth.uid())
    )
  );
