-- =============================================================================
-- Migration 080: Corporate customer pipeline status (CRM stages)
-- =============================================================================
-- Adds a sales-pipeline stage to `accounts`, replacing the pending/approved/
-- rejected model as the thing admins see and manage. Portal login access is
-- still gated by profiles.is_approved (auth.service), but that flag is now
-- DERIVED from pipeline_status by accounts.service.syncPortalAccess():
-- true only for 'onboarding' / 'active'.
--
--   prospect   -> identified, not contacted yet
--   contacted  -> reached out
--   interested -> shown interest, not shipping yet   (corporate self-signups land here)
--   onboarding -> agreed, being set up               (portal access granted)
--   active     -> established account / shipping      (portal access granted)
--   inactive   -> previously active, not currently shipping
--   lost       -> chose another provider
-- =============================================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'prospect';

ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_pipeline_status_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_pipeline_status_check
  CHECK (pipeline_status IN
    ('prospect', 'contacted', 'interested', 'onboarding', 'active', 'inactive', 'lost'));

-- Every existing non-deleted account is a real, established customer -> 'active'.
UPDATE accounts SET pipeline_status = 'active' WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_pipeline_status
  ON accounts (pipeline_status)
  WHERE deleted_at IS NULL;
