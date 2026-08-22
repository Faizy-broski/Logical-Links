-- =============================================================================
-- Migration 065: Multi-employee delivery assignment
--
-- "Assign to Shipping Company" no longer makes sense — corporate customers
-- are pure customers now (see migration 064), never operate a delivery
-- themselves, so there's nothing to hand off to them. Admin now assigns a
-- delivery internally to Logical Links' own staff instead — any employee,
-- not just drivers, and more than one at once (e.g. a driver AND a
-- dispatcher on the same delivery). shipments.assigned_employee_id is a
-- single column, so a many-to-many table replaces it.
-- =============================================================================

CREATE TABLE delivery_assignments (
  delivery_id  UUID        NOT NULL REFERENCES shipments (shipment_id) ON DELETE CASCADE,
  employee_id  UUID        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  assigned_by  UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (delivery_id, employee_id)
);

CREATE INDEX idx_delivery_assignments_employee ON delivery_assignments (employee_id);

-- Backfill from the existing single-assignee column so nothing already
-- assigned is lost. shipments.assigned_employee_id itself is left in place
-- (unused going forward, not dropped) — same conservative approach as
-- earlier renames in this project: no destructive step without a separate,
-- deliberate follow-up once the new path is confirmed working.
INSERT INTO delivery_assignments (delivery_id, employee_id, assigned_by, assigned_at)
SELECT shipment_id, assigned_employee_id, created_by, updated_at
FROM shipments
WHERE assigned_employee_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Same bug class as migrations 042/056/058/059/060: service_role needs an
-- explicit policy or every insert/select from the backend is denied.
CREATE POLICY "service_role_all_delivery_assignments" ON delivery_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
