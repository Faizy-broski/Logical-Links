-- =============================================================================
-- Migration 064: Rename "shipper" role to "corporate" everywhere
--
-- The "shipper" role/portal is renamed to "corporate" (customer) across the
-- app — this migration is the DB half of that.
--
-- Written to be safely re-runnable: the first attempt failed partway (the
-- CHECK constraint tightening hit existing rows still literally reading
-- 'shipper' — a TEXT column, untouched by the enum rename below), and
-- depending on how the SQL editor executed the batch, the earlier enum
-- renames may or may not have already committed. Every step below is
-- guarded to no-op if already applied.
-- =============================================================================

-- ── user_role enum ───────────────────────────────────────────────────────────
-- ALTER TYPE ... RENAME VALUE only changes the display label; every existing
-- policy, function, and column default that referenced 'shipper' was already
-- bound to the enum's internal OID at CREATE/ALTER time (not by name), so
-- they keep working unchanged — nothing else needs to be touched for those.
-- The exceptions are the TEXT columns further down, which the rename does
-- NOT reach (a TEXT column just stores whatever string was written).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'shipper'
  ) THEN
    ALTER TYPE user_role RENAME VALUE 'shipper' TO 'corporate';
  END IF;
END $$;

-- note_entity_type is a SEPARATE enum (migration 016/017, admin notes on
-- corporate-customer accounts) that also happened to use the label
-- 'shipper' — same rename, same "existing policies keep working" logic.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'note_entity_type' AND e.enumlabel = 'shipper'
  ) THEN
    ALTER TYPE note_entity_type RENAME VALUE 'shipper' TO 'corporate';
  END IF;
END $$;

-- ── shipments.created_by_role — plain TEXT column, not the enum ─────────────
-- Its CHECK constraint (migration 024, widened in migration 061) hardcodes
-- the literal 'shipper', and existing rows still literally contain the text
-- 'shipper' too. The constraint has to come off BEFORE the backfill runs —
-- the old constraint only allows ('admin','shipper','residential'), so an
-- UPDATE that writes 'corporate' while it's still active violates it
-- (23514, confirmed the hard way on attempt #2 at this migration: dropping
-- the constraint was correctly ordered before the ADD, but the backfill
-- UPDATE above it was still running under the OLD constraint).
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_created_by_role_check;

UPDATE shipments SET created_by_role = 'corporate' WHERE created_by_role = 'shipper';

ALTER TABLE shipments
  ADD CONSTRAINT shipments_created_by_role_check
    CHECK (created_by_role IN ('admin', 'corporate', 'residential'));

-- ── Force logout of every corporate (formerly shipper) session ──────────────
-- Role is baked into the access token at login, not re-checked against the
-- DB per request — an already-issued token still says "shipper", which no
-- code path recognizes anymore. Revoking every refresh token forces a clean
-- re-login instead of a confusing half-broken session.
UPDATE refresh_tokens
SET is_revoked = TRUE, revoked_at = now()
WHERE is_revoked = FALSE
  AND user_id IN (SELECT id FROM profiles WHERE role = 'corporate');
