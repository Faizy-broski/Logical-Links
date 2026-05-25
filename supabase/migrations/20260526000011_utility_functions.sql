-- =============================================================================
-- Migration 011: Utility Functions
-- Server-side helpers callable from the backend via supabase.rpc()
-- =============================================================================

-- ── Validate shipment status transition ───────────────────────────────────────
-- Returns TRUE if the transition is legal; FALSE otherwise.
-- Mirrors the ALLOWED_TRANSITIONS map in shipments.service.ts.
-- Having this in the DB as well lets triggers enforce it defensively.

CREATE OR REPLACE FUNCTION is_valid_shipment_transition(
  p_current shipment_status,
  p_next    shipment_status
) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_current
    WHEN 'pending'    THEN p_next IN ('quoted',     'cancelled')
    WHEN 'quoted'     THEN p_next IN ('confirmed',  'cancelled')
    WHEN 'confirmed'  THEN p_next IN ('assigned',   'cancelled')
    WHEN 'assigned'   THEN p_next IN ('in_transit', 'cancelled')
    WHEN 'in_transit' THEN p_next IN ('delivered',  'cancelled')
    WHEN 'delivered'  THEN FALSE
    WHEN 'cancelled'  THEN FALSE
    ELSE FALSE
  END;
END;
$$;

-- ── Enforce valid transitions on UPDATE ───────────────────────────────────────
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

-- ── Mark actual_delivery_date automatically ───────────────────────────────────
CREATE OR REPLACE FUNCTION stamp_delivery_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    NEW.actual_delivery_date := COALESCE(NEW.actual_delivery_date, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stamp_delivery_date
  BEFORE UPDATE OF status ON shipments
  FOR EACH ROW EXECUTE FUNCTION stamp_delivery_date();

-- ── Notify all users in an account ───────────────────────────────────────────
-- Called by the backend service layer after status changes.
-- Usage: SELECT notify_account_users(account_id, type, title, body, entity_type, entity_id)

CREATE OR REPLACE FUNCTION notify_account_users(
  p_account_id  UUID,
  p_type        notification_type,
  p_title       TEXT,
  p_body        TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id   UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  SELECT p.id, p_type, p_title, p_body, p_entity_type, p_entity_id
  FROM   profiles p
  WHERE  p.account_id = p_account_id
    AND  p.is_active  = TRUE
    AND  p.deleted_at IS NULL;
END;
$$;

-- ── Count unread notifications for a user ─────────────────────────────────────
-- Used by the frontend badge counter.
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::INTEGER
  FROM   notifications
  WHERE  user_id = p_user_id
    AND  is_read = FALSE
    AND  (expires_at IS NULL OR expires_at > now());
$$;

-- ── Get current assignment for a shipment ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_current_assignment(p_shipment_id UUID)
RETURNS TABLE (
  assignment_id UUID,
  carrier_id    UUID,
  carrier_name  TEXT,
  driver_name   TEXT,
  driver_phone  TEXT,
  vehicle_plate TEXT,
  status        assignment_status
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.assignment_id,
    a.carrier_id,
    c.carrier_name,
    a.driver_name,
    a.driver_phone,
    a.vehicle_plate,
    a.status
  FROM   assignments a
  JOIN   carriers    c ON c.carrier_id = a.carrier_id
  WHERE  a.shipment_id = p_shipment_id
    AND  a.is_current  = TRUE
  LIMIT  1;
$$;

-- ── Expire old refresh tokens (run via pg_cron or cron job) ───────────────────
CREATE OR REPLACE FUNCTION expire_refresh_tokens()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE refresh_tokens
  SET    is_revoked = TRUE,
         revoked_at = now()
  WHERE  expires_at < now()
    AND  is_revoked  = FALSE;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;
