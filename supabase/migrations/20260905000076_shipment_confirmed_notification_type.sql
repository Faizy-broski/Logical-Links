-- =============================================================================
-- Migration 076: Add 'shipment_confirmed' notification type
-- =============================================================================
-- Same bug class as migrations 040/066 (notification_type_enum_sync /
-- notification_type_full_coverage): the application's NOTIFICATION_TYPES list
-- adds a value, but nothing inserts it into Postgres's notification_type enum,
-- and every notification call site is fire-and-forget (`.catch(() =>
-- undefined)`) — so a missing enum value fails silently instead of loudly.
--
-- 'shipment_confirmed' covers the "request received / being reviewed" stage
-- of the delivery lifecycle (status: pending -> confirmed), which previously
-- had no dedicated notification and jumped straight to shipment_picked_up.
-- It belongs to the existing 'deliveries' notifications.category, which is
-- already permitted by the notifications_category_check constraint (migration
-- 041) — no constraint change needed here, only the enum value.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shipment_confirmed';
