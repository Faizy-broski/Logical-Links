-- ─── Internal Admin RBAC: CEO / VP / Manager / Assistant ─────────────────────
-- Introduces admin_role on profiles (platform staff only, role = 'admin') and a
-- DB-driven, CEO-configurable permission matrix. Independent of company_role,
-- which governs shipper companies' own employees.

-- ── 1. admin_role enum ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('ceo', 'vp', 'manager', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Add admin_role to profiles ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role admin_role;

-- Existing platform admin accounts become CEO — nothing loses access.
UPDATE profiles
  SET admin_role = 'ceo'
  WHERE role = 'admin' AND admin_role IS NULL;

-- ── 3. Permission catalog ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  key         TEXT PRIMARY KEY,
  category    TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0
);

-- ── 4. Per-role grant matrix ───────────────────────────────────────────────────
-- Final resolved value per (role, permission) — no live inheritance engine.
-- Seeded below to reflect the CEO > VP > Manager > Assistant hierarchy; each
-- cell is independently editable afterwards from Settings > Roles & Permissions.
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  admin_role      admin_role NOT NULL,
  permission_key  TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  granted         BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_role, permission_key)
);

-- ── 5. Seed permission catalog ────────────────────────────────────────────────
INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('employees.view',              'Employee Management',   'View Employees',        1),
  ('employees.create',            'Employee Management',   'Create Employees',      2),
  ('employees.edit',              'Employee Management',   'Edit Employees',        3),
  ('employees.delete',            'Employee Management',   'Delete Employees',      4),
  ('employees.suspend',           'Employee Management',   'Suspend Employees',     5),
  ('employees.manage_roles',      'Employee Management',   'Manage Roles',          6),
  ('employees.manage_permissions','Employee Management',   'Manage Permissions',    7),

  ('customers.view',              'Customer Management',   'View Customers',        1),
  ('customers.create',            'Customer Management',   'Create Customers',      2),
  ('customers.edit',              'Customer Management',   'Edit Customers',        3),
  ('customers.delete',            'Customer Management',   'Delete Customers',      4),

  ('bookings.view',               'Booking Management',    'View Bookings',         1),
  ('bookings.create',             'Booking Management',    'Create Bookings',       2),
  ('bookings.edit',               'Booking Management',    'Edit Bookings',         3),
  ('bookings.cancel',             'Booking Management',    'Cancel Bookings',       4),

  ('deliveries.view',             'Delivery Management',   'View Deliveries',       1),
  ('deliveries.create',           'Delivery Management',   'Create Deliveries',     2),
  ('deliveries.edit',             'Delivery Management',   'Edit Deliveries',       3),
  ('deliveries.delete',           'Delivery Management',   'Delete Deliveries',     4),
  ('deliveries.assign',           'Delivery Management',   'Assign Deliveries',     5),
  ('deliveries.update_status',    'Delivery Management',   'Update Delivery Status',6),

  ('quotations.view',             'Quotations',             'View',                 1),
  ('quotations.create',           'Quotations',             'Create',               2),
  ('quotations.edit',             'Quotations',             'Edit',                 3),
  ('quotations.delete',           'Quotations',             'Delete',               4),
  ('quotations.approve',          'Quotations',             'Approve',              5),

  ('invoices.view',               'Invoices',               'View',                 1),
  ('invoices.create',             'Invoices',               'Create',               2),
  ('invoices.edit',               'Invoices',               'Edit',                 3),
  ('invoices.delete',             'Invoices',               'Delete',               4),
  ('invoices.mark_paid',          'Invoices',               'Mark Paid',            5),
  ('invoices.refund',             'Invoices',               'Refund',               6),

  ('support.view',                'Support Tickets',        'View',                 1),
  ('support.create',              'Support Tickets',        'Create',               2),
  ('support.reply',               'Support Tickets',        'Reply',                3),
  ('support.close',               'Support Tickets',        'Close',                4),
  ('support.assign',              'Support Tickets',        'Assign',               5),

  ('reports.operational',         'Reports & Analytics',    'View Operational Reports', 1),
  ('reports.financial',           'Reports & Analytics',    'View Financial Reports',   2),
  ('reports.export',              'Reports & Analytics',    'Export Reports',           3),

  ('settings.general',            'System Settings',        'General Settings',      1),
  ('settings.company_info',       'System Settings',        'Company Information',   2),
  ('settings.notifications',      'System Settings',        'Notification Settings', 3),
  ('settings.integrations',       'System Settings',        'Integrations',          4),
  ('settings.security',           'System Settings',        'Security Settings',     5),

  ('finance.view_revenue',        'Finance',                'View Revenue',          1),
  ('finance.view_expenses',       'Finance',                'View Expenses',         2),
  ('finance.export',              'Finance',                'Export Financial Data', 3)
ON CONFLICT (key) DO NOTHING;

-- ── 6. Seed default grant matrix ──────────────────────────────────────────────
-- CEO: everything.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'ceo', key, TRUE FROM permissions
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- VP: all operational categories; no Employee Management, System Settings, Finance,
-- or financial reports.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'vp', key,
    category NOT IN ('Employee Management', 'System Settings', 'Finance')
    AND key <> 'reports.financial'
  FROM permissions
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- Manager: deliveries/dispatch + support in full; view-only on customers,
-- bookings, quotations, invoices; operational reports only.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'manager', key,
    key IN (
      'customers.view',
      'bookings.view',
      'deliveries.view', 'deliveries.create', 'deliveries.edit', 'deliveries.delete',
      'deliveries.assign', 'deliveries.update_status',
      'quotations.view',
      'invoices.view',
      'support.view', 'support.create', 'support.reply', 'support.close', 'support.assign',
      'reports.operational'
    )
  FROM permissions
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- Assistant: view-level access plus booking create/edit and support view/create/reply.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'assistant', key,
    key IN (
      'customers.view',
      'bookings.view', 'bookings.create', 'bookings.edit',
      'deliveries.view',
      'quotations.view',
      'invoices.view',
      'support.view', 'support.create', 'support.reply'
    )
  FROM permissions
ON CONFLICT (admin_role, permission_key) DO NOTHING;
