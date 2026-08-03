-- =============================================================================
-- Migration 044: Residential customers — shipments.customer_id + RLS
--
-- Split from migration 043: ALTER TYPE ... ADD VALUE cannot be used in the
-- same transaction it was added in, so the new 'residential' enum value
-- must land in its own prior migration before it can appear in policy
-- definitions here.
-- =============================================================================

ALTER TABLE shipments
  ADD COLUMN customer_id UUID REFERENCES profiles (id) ON DELETE SET NULL;

CREATE INDEX idx_shipments_customer_id ON shipments (customer_id);

-- ── shipments ─────────────────────────────────────────────────────────────────
CREATE POLICY "residential_read_own_shipments" ON shipments
  FOR SELECT USING (
    current_user_role() = 'residential'
    AND customer_id = auth.uid()
    AND deleted_at IS NULL
  );

-- ── shipment_status_history ───────────────────────────────────────────────────
CREATE POLICY "residential_read_own_ssh" ON shipment_status_history
  FOR SELECT USING (
    current_user_role() = 'residential'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  customer_id = auth.uid()
    )
  );

-- ── load_tracking_events ──────────────────────────────────────────────────────
-- Residential customers only ever read tracking events for their own load —
-- mirrors tracking_employee_select's shape from migration 030, scoped by
-- customer_id instead of assigned_employee_id.
CREATE POLICY "tracking_residential_select" ON load_tracking_events
  FOR SELECT
  USING (
    current_user_role() = 'residential'
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE customer_id = auth.uid()
    )
  );

-- ── notes ─────────────────────────────────────────────────────────────────────
CREATE POLICY "residential_read_public_notes" ON notes
  FOR SELECT USING (
    current_user_role() = 'residential'
    AND is_internal = FALSE
    AND deleted_at IS NULL
    AND entity_type = 'shipment'
    AND entity_id IN (
      SELECT shipment_id FROM shipments WHERE customer_id = auth.uid()
    )
  );
