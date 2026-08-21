-- =============================================================================
-- Migration 053: Expand Permissions Catalog
--
-- The "Booking Management" category (bookings.view/create/edit/cancel) was
-- seeded in migration 036 but never wired to any actual route or frontend
-- check — it's dead. Meanwhile Locations, Statuses and Notifications (send
-- alert) have no permission keys at all and are only gated by a blanket
-- requireAdmin, so no custom role can be restricted from them. This
-- migration removes the dead category and adds real, enforced keys for
-- those modules. Support Tickets already has its keys
-- (support.view/create/reply/close/assign) — only backend route wiring is
-- needed there, not new catalog rows. The generic /users list/approve
-- endpoints (also previously ungated) turned out to already be the backing
-- API for the residential-customer pages and the corporate-customer
-- approve flow, both already frontend-gated on customers.view/customers.edit
-- — so those routes reuse that existing key rather than getting a new one.
-- =============================================================================

-- ── 1. Remove the dead "Booking Management" category ──────────────────────────
DELETE FROM admin_role_permissions
  WHERE permission_key IN ('bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel');

DELETE FROM permissions
  WHERE key IN ('bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel');

-- ── 2. New category: Locations & Statuses ──────────────────────────────────────
INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('locations.view',   'Locations & Statuses', 'View Locations',    1),
  ('locations.create', 'Locations & Statuses', 'Create Locations',  2),
  ('locations.edit',   'Locations & Statuses', 'Edit Locations',    3),
  ('locations.delete', 'Locations & Statuses', 'Delete Locations',  4),
  ('statuses.view',    'Locations & Statuses', 'View Statuses',     5),
  ('statuses.create',  'Locations & Statuses', 'Create Statuses',   6),
  ('statuses.edit',    'Locations & Statuses', 'Edit Statuses',     7),
  ('statuses.delete',  'Locations & Statuses', 'Delete Statuses',   8)
ON CONFLICT (key) DO NOTHING;

-- ── 3. New key in System Settings: send alerts ─────────────────────────────────
INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('notifications.manage', 'System Settings', 'Send Alerts', 6)
ON CONFLICT (key) DO NOTHING;

-- ── 4. Seed grants for every new key ────────────────────────────────────────────
-- ceo + vp: full access. manager + assistant: view-only by default (editable
-- later by the CEO from Roles & Permissions) — same convention used in
-- migrations 045/048/051 for tiers/rewards/pricing.

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'ceo', key, true FROM permissions
  WHERE key IN (
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'statuses.view', 'statuses.create', 'statuses.edit', 'statuses.delete',
    'notifications.manage'
  )
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'vp', key, true FROM permissions
  WHERE key IN (
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'statuses.view', 'statuses.create', 'statuses.edit', 'statuses.delete',
    'notifications.manage'
  )
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT r.admin_role, k.key, true
  FROM (VALUES ('manager'), ('assistant')) AS r(admin_role)
  CROSS JOIN (VALUES ('locations.view'), ('statuses.view')) AS k(key)
ON CONFLICT (admin_role, permission_key) DO NOTHING;

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT r.admin_role, k.key, false
  FROM (VALUES ('manager'), ('assistant')) AS r(admin_role)
  CROSS JOIN (VALUES
    ('locations.create'), ('locations.edit'), ('locations.delete'),
    ('statuses.create'), ('statuses.edit'), ('statuses.delete'),
    ('notifications.manage')
  ) AS k(key)
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- The "driver" system role (added in migration 047) also needs rows for
-- every key so the permissions matrix query (which expects a row per
-- role x permission) has no gaps — default to ungranted, same as its other
-- permissions.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'driver', key, false FROM permissions
  WHERE key IN (
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'statuses.view', 'statuses.create', 'statuses.edit', 'statuses.delete',
    'notifications.manage'
  )
ON CONFLICT (admin_role, permission_key) DO NOTHING;
