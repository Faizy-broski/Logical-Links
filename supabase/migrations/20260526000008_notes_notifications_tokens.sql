-- =============================================================================
-- Migration 008: Notes, Notifications, Refresh Tokens
-- =============================================================================

-- ── Notes (polymorphic) ───────────────────────────────────────────────────────
-- Backend joins: notes → profiles ( id, full_name )
-- Backend deletes: .eq('note_id', id).eq('created_by', userId)
-- entity_type + entity_id form a polymorphic FK pattern (no enforced FK — intentional
-- because the target table changes per entity_type).

CREATE TABLE notes (
  note_id       UUID             PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic target
  entity_type   note_entity_type NOT NULL,
  entity_id     UUID             NOT NULL,

  -- Content
  content       TEXT             NOT NULL CHECK (LENGTH(content) BETWEEN 1 AND 5000),
  is_internal   BOOLEAN          NOT NULL DEFAULT FALSE, -- admin-only notes

  -- Audit — created_by must match backend
  created_by    UUID             NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  updated_by    UUID             REFERENCES auth.users (id) ON DELETE SET NULL,

  created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ                -- soft delete
);

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ── Notifications ─────────────────────────────────────────────────────────────
-- Backend reads: .in('notification_id', ids)  → PK must be notification_id
-- Backend updates: is_read, read_at
-- Backend filters: user_id, is_read

CREATE TABLE notifications (
  notification_id UUID              PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target — user_id must match backend
  user_id         UUID              NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Content — names match backend
  type            notification_type NOT NULL,
  title           TEXT              NOT NULL CHECK (LENGTH(title) BETWEEN 1 AND 200),
  body            TEXT              NOT NULL,

  -- Optional link back to an entity
  entity_type     TEXT,   -- freeform string for flexibility
  entity_id       UUID,

  -- State — names match backend
  is_read         BOOLEAN           NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,

  -- Lifecycle
  expires_at      TIMESTAMPTZ,      -- NULL = never expires

  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now()

  -- No updated_at (notifications are read-only after creation except is_read/read_at)
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── Refresh Tokens ────────────────────────────────────────────────────────────
-- Supabase manages its own JWT session tokens internally.
-- This table is for any ADDITIONAL custom refresh-token flows or device tracking.
-- Store only a bcrypt/sha256 hash — never the raw token.

CREATE TABLE refresh_tokens (
  token_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id       UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash    TEXT        NOT NULL UNIQUE, -- SHA-256 hex of the raw token

  -- Device context (optional, for session management UI)
  device_info   TEXT,
  ip_address    INET,
  user_agent    TEXT,

  -- State
  is_revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
  revoked_at    TIMESTAMPTZ,

  -- Lifecycle
  expires_at    TIMESTAMPTZ NOT NULL,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
