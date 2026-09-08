-- =============================================================================
-- Migration 075: Contact Support (public contact form)
--
-- contact_messages — anonymous "Contact Support" inquiries submitted from the
-- public marketing site footer, separate from the "Get a Quote" flow. Handled
-- entirely via the backend service role (no end-user session exists at
-- submission time), matching the support_cases pattern — RLS enabled with no
-- policies means default-deny for anon/authenticated roles.
-- =============================================================================

CREATE TABLE contact_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT,
  subject     TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Service-role only access — no policies, matching support_cases.
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_contact_messages_status     ON contact_messages (status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages (created_at DESC);
