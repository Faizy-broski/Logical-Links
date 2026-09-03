-- =============================================================================
-- Migration 071: Corporate account lifecycle — review / rejection / activity
--
-- A corporate signup creates an `accounts` row that IS the "account request".
-- Until now "reject" only flipped profiles.is_approved and the row stayed on
-- the admin list forever. This migration adds:
--   1. Review + rejection bookkeeping on `accounts` (who reviewed, why, when,
--      and a `purge_after` retention deadline).
--   2. `business_type` / `industry` descriptive fields shown on the profile.
--   3. `account_activity` — an append-only lifecycle feed powering the
--      "Application History" / "Recent Activity" panels on both the admin
--      detail page and the corporate customer's own company page.
--
-- The 90-day hard purge itself lives in migrations 072 (function) + 073 (cron).
-- =============================================================================

-- ── 1. accounts: review / rejection / descriptive columns ────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS business_type    TEXT,
  ADD COLUMN IF NOT EXISTS industry         TEXT,
  -- Review outcome — set on BOTH approve and reject so "Reviewed / Reviewed By"
  -- can render for either path.
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  -- Rejection-specific.
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS review_note      TEXT,
  -- Retention deadline: rejected_at + 90 days. NULL unless currently rejected.
  ADD COLUMN IF NOT EXISTS purge_after      TIMESTAMPTZ;

-- Partial index for the daily purge sweep and the admin "Rejected" tab.
CREATE INDEX IF NOT EXISTS idx_accounts_rejected
  ON accounts (purge_after)
  WHERE rejected_at IS NOT NULL;

-- ── 2. account_activity — lifecycle feed ────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_activity (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID        NOT NULL REFERENCES accounts (account_id) ON DELETE CASCADE,

  -- submitted | reviewed | approved | rejected | reconsidered | restored
  -- | admin_added | terms_accepted | tier_changed | account_updated | note_added
  event_type   TEXT        NOT NULL,
  description  TEXT        NOT NULL,

  -- Who performed it. NULL / 'System' for automated events.
  actor_id     UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_label  TEXT,

  -- `internal = true` events are admin-only and filtered out of the feed the
  -- corporate customer sees on their own company page.
  internal     BOOLEAN     NOT NULL DEFAULT FALSE,

  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_activity_account
  ON account_activity (account_id, created_at DESC);

ALTER TABLE account_activity ENABLE ROW LEVEL SECURITY;

-- Same service_role pattern as migrations 042/056/058/059/060/065 — the
-- backend (service-role key) is the only writer/reader; without this every
-- insert/select is denied.
DROP POLICY IF EXISTS "service_role_all_account_activity" ON account_activity;
CREATE POLICY "service_role_all_account_activity" ON account_activity
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. Backfill history for existing accounts ───────────────────────────────
-- One 'submitted' row per existing (non-deleted) account at its created_at.
INSERT INTO account_activity (account_id, event_type, description, actor_label, internal, created_at)
SELECT a.account_id, 'submitted', 'Account request submitted', 'System', FALSE, a.created_at
FROM accounts a
WHERE a.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- One 'approved' row for every account whose company admin is already approved.
INSERT INTO account_activity (account_id, event_type, description, actor_label, internal, created_at)
SELECT a.account_id, 'approved', 'Account approved', 'System', FALSE, COALESCE(p.updated_at, a.created_at)
FROM accounts a
JOIN profiles p
  ON p.account_id = a.account_id
 AND p.company_role = 'company_admin'
 AND p.is_approved = TRUE
WHERE a.deleted_at IS NULL
ON CONFLICT DO NOTHING;
