-- =============================================================================
-- Migration 077: Per-permission "all vs own/assigned" scope
-- =============================================================================
-- Adds a `scope` column to admin_role_permissions so the CEO can configure a
-- role's grant as scope 'all' (sees everything, today's behavior — default,
-- zero behavior change) or 'own' (sees only records tied to that specific
-- staff member) for permissions where the data model supports it: Deliveries
-- (via delivery_assignments), Quotations and Invoices (via
-- shipments.assigned_employee_id). See auth.service.ts::resolveAdminPermissions
-- and the per-module repository scoping this pairs with.

ALTER TABLE admin_role_permissions
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'all'
  CHECK (scope IN ('all', 'own'));
