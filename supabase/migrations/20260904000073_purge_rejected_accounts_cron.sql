-- =============================================================================
-- Migration 073: Daily sweep — hard-purge rejected accounts past retention
--
-- A rejected corporate account is soft-deleted immediately and keeps a
-- `purge_after = rejected_at + 90 days` deadline (migration 071). This job
-- runs daily and calls purge_account_fully() (migration 072) for every
-- rejected account whose deadline has passed.
--
-- pg_cron is a Supabase-hosted extension; it is not loadable in a bare local
-- `supabase db reset`. The whole thing is wrapped so a missing extension is a
-- notice, not a migration failure — the wrapper function is still created and
-- can be invoked manually / from an external scheduler if cron is unavailable.
-- =============================================================================

-- ── Wrapper the job calls (also usable standalone) ─────────────────────────
CREATE OR REPLACE FUNCTION purge_expired_rejected_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_id IN
    SELECT account_id
    FROM accounts
    WHERE rejected_at IS NOT NULL
      AND purge_after IS NOT NULL
      AND purge_after < now()
  LOOP
    PERFORM purge_account_fully(v_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION purge_expired_rejected_accounts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_expired_rejected_accounts() TO service_role;

-- ── Schedule it (hosted only) ─────────────────────────────────────────────
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;

  -- Replace any prior definition of this job so re-runs are idempotent.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-rejected-accounts') THEN
    PERFORM cron.unschedule('purge-expired-rejected-accounts');
  END IF;

  PERFORM cron.schedule(
    'purge-expired-rejected-accounts',
    '30 3 * * *',                       -- 03:30 daily (server / UTC time)
    'SELECT purge_expired_rejected_accounts();'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable (%). purge_expired_rejected_accounts() created but not scheduled — run it from an external scheduler.', SQLERRM;
END;
$$;
