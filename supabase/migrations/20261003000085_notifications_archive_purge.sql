-- =============================================================================
-- Migration 085: Alerts lifecycle — archive + 30-day purge
--
-- Read, Archived and Deleted are separate actions. `is_read` / `read_at` track
-- Read; `archived_at` tracks Archived. Archived notifications are hard-deleted
-- 30 days after they were archived by a daily job.
--
-- pg_cron is hosted-only; a missing extension is a notice, not a failure (same
-- pattern as migration 073).
-- =============================================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_archived_at
  ON notifications (archived_at);

CREATE OR REPLACE FUNCTION purge_archived_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION purge_archived_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_archived_notifications() TO service_role;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-archived-notifications') THEN
    PERFORM cron.unschedule('purge-archived-notifications');
  END IF;

  PERFORM cron.schedule(
    'purge-archived-notifications',
    '45 3 * * *',                       -- 03:45 daily (server / UTC time)
    'SELECT purge_archived_notifications();'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable (%). purge_archived_notifications() created but not scheduled — run it from an external scheduler.', SQLERRM;
END;
$$;
