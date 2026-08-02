-- =============================================================================
-- Migration 041: Sync notifications.category CHECK constraint with the app
-- =============================================================================
-- Same class of bug as migration 040 (notification_type enum drift), but for
-- a plain CHECK constraint instead of an enum. Migration 038 constrained
-- notifications.category to ('deliveries','invoices','quotes','support',
-- 'account'). This session's account/employee/note/location/status alert
-- sweep added two more categories to NOTIFICATION_CATEGORIES ('team',
-- 'operations') and createAlertSchema validates category against ALL of
-- NOTIFICATION_CATEGORIES's keys — so an admin creating a manual alert with
-- category 'team' or 'operations' passes app-level validation but then fails
-- the INSERT with a CHECK constraint violation.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_category_check
  CHECK (category IN ('deliveries', 'invoices', 'quotes', 'support', 'account', 'team', 'operations'));
