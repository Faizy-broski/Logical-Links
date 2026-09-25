-- ─── Archived Deliveries ───────────────────────────────────────────────────────
-- Lets admins move older completed/cancelled deliveries into an "Archived"
-- workspace view instead of deleting them. Archiving is independent of the
-- existing soft-delete (deleted_at) — an archived delivery is still a live,
-- fully-visible record, just excluded from the default working views.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_shipments_archived_at ON shipments (archived_at);

-- New permission, separate from 'deliveries.delete' — archiving is a
-- reversible filing action, not a destructive one.
INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('deliveries.archive', 'Delivery Management', 'Archive Deliveries', 7)
ON CONFLICT (key) DO NOTHING;

-- CEO/VP already get every category-wide or all-permission grant; extend the
-- explicit Manager/Assistant lists the same way 'deliveries.delete' was granted.
UPDATE admin_role_permissions SET granted = TRUE
  WHERE admin_role = 'manager' AND permission_key = 'deliveries.archive';

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'ceo', 'deliveries.archive', TRUE
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'vp', 'deliveries.archive', TRUE
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'manager', 'deliveries.archive', TRUE
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'assistant', 'deliveries.archive', FALSE
ON CONFLICT (admin_role, permission_key) DO NOTHING;
