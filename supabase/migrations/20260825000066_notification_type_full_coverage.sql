-- =============================================================================
-- Migration 066: notification_type — full mutation coverage
-- =============================================================================
-- Same bug class as migration 040 (notification_type_enum_sync): the
-- application's NOTIFICATION_TYPES list adds a value, but nothing inserts it
-- into Postgres's notification_type enum, and every notification call site
-- is fire-and-forget (`.catch(() => undefined)`) — so a missing enum value
-- fails silently instead of loudly.
--
-- Adding the types needed to close the "every module, every POST/PUT/PATCH/
-- DELETE fires an alert" gap: delivery edit/ETA/delete, invoice delete,
-- quotation edit/delete, support case create/update/delete, note/location/
-- status delete, and a role-change alert to the affected employee.
--
-- Each ADD VALUE must be its own statement pre-PG12-safe; IF NOT EXISTS makes
-- this idempotent/re-runnable.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_eta_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quotation_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_case_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_case_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'support_case_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'note_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'location_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'user_role_updated';
