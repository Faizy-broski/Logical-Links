-- =============================================================================
-- Migration 040: Sync notification_type enum with the application
-- =============================================================================
-- notifications.type is a real Postgres enum (notification_type), but the
-- application's NOTIFICATION_TYPES list (backend/src/modules/notifications/
-- notifications.schema.ts) has drifted far ahead of it — only 10 of the ~34
-- app-level values exist in the DB enum. Every notification of a type not
-- listed here has been failing to insert with
-- "invalid input value for enum notification_type" — silently, because every
-- call site is fire-and-forget (`.catch(() => undefined)`). This affects
-- every invoice/quotation/support/tracking-event notification, plus every
-- type added for the account/employee/note/location/status alert sweep.
--
-- Each ADD VALUE must be its own statement pre-PG12-safe; IF NOT EXISTS makes
-- this idempotent/re-runnable.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'tracking_event_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'tracking_event_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'tracking_event_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_issued';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_paid';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_overdue';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_sent';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_case_replied';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_case_status_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_note_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_note_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'employee_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'employee_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_employee_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_employee_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'note_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'note_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'location_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'location_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_updated';
