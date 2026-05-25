-- =============================================================================
-- Migration 006: Assignments + Assignment History
--
-- Backend selects:
--   assignment_id, shipment_id, carrier_id, driver_name, driver_phone,
--   vehicle_plate, trailer_number, pickup_date, status, notes,
--   assigned_by, created_at, updated_at,
--   carriers ( carrier_id, carrier_name, phone ),
--   shipments ( shipment_id, load_number, status, origin_city, destination_city )
--
-- Only ONE assignment per shipment should be "active" at a time.
-- is_current=TRUE flags the live assignment for fast lookups.
-- Reassigning creates a new row and sets the old one is_current=FALSE.
-- =============================================================================

CREATE TABLE assignments (
  assignment_id   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships — names match backend exactly
  shipment_id     UUID              NOT NULL REFERENCES shipments (shipment_id) ON DELETE RESTRICT,
  carrier_id      UUID              NOT NULL REFERENCES carriers  (carrier_id)  ON DELETE RESTRICT,

  -- Driver / vehicle
  driver_name     TEXT              NOT NULL,
  driver_phone    TEXT,
  vehicle_plate   TEXT,
  trailer_number  TEXT,

  -- Schedule
  pickup_date     TIMESTAMPTZ,

  -- State
  status          assignment_status NOT NULL DEFAULT 'pending',
  is_current      BOOLEAN           NOT NULL DEFAULT TRUE,  -- only one TRUE per shipment

  -- Notes — column name must match backend
  notes           TEXT,

  -- Audit — assigned_by must match backend
  assigned_by     UUID              NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
  -- No deleted_at: assignments are archived by status/is_current, not soft-deleted
);

-- ── Enforce single active assignment per shipment ─────────────────────────────
-- When a new assignment is created or is_current is set TRUE,
-- mark all other assignments for that shipment as is_current=FALSE.
CREATE OR REPLACE FUNCTION enforce_single_current_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE assignments
    SET    is_current = FALSE
    WHERE  shipment_id  = NEW.shipment_id
      AND  assignment_id <> NEW.assignment_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_current_assignment
  AFTER INSERT OR UPDATE OF is_current ON assignments
  FOR EACH ROW EXECUTE FUNCTION enforce_single_current_assignment();

-- ── updated_at ────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Assignment history (immutable audit log) ──────────────────────────────────
CREATE TABLE assignment_history (
  history_id    UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID              NOT NULL REFERENCES assignments (assignment_id) ON DELETE CASCADE,
  shipment_id   UUID              NOT NULL REFERENCES shipments   (shipment_id)  ON DELETE CASCADE,
  carrier_id    UUID              NOT NULL REFERENCES carriers    (carrier_id)   ON DELETE RESTRICT,
  old_status    assignment_status,
  new_status    assignment_status NOT NULL,
  changed_by    UUID              NOT NULL REFERENCES auth.users  (id)           ON DELETE RESTRICT,
  reason        TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Auto-log every assignment status change
CREATE OR REPLACE FUNCTION log_assignment_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO assignment_history
      (assignment_id, shipment_id, carrier_id, old_status, new_status, changed_by)
    VALUES (
      NEW.assignment_id,
      NEW.shipment_id,
      NEW.carrier_id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status,
      NEW.assigned_by
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignment_history
  AFTER INSERT OR UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION log_assignment_status_change();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
