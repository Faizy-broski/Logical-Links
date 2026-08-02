-- =============================================================================
-- Migration 038: Admin-authored alerts
--
-- Lets an admin push a notification to a specific shipper (company_admin of
-- one account) or broadcast to every shipper company at once. Reuses the
-- existing notifications table/list/badge machinery — just adds a new type
-- plus severity + module-category tagging so alerts surface in the correct
-- existing tab (Deliveries/Invoices/Quotes/Support/Account).
-- =============================================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_alert';

ALTER TABLE notifications
  ADD COLUMN severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  ADD COLUMN category TEXT CHECK (category IN ('deliveries', 'invoices', 'quotes', 'support', 'account'));
