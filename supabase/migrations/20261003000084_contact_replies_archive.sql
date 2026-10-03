-- =============================================================================
-- Migration 084: Contact messages — admin replies + archive
--
-- Resolved and Archived are separate states: `status` keeps new / in_progress /
-- resolved, `archived_at` hides a (resolved) message from the active inbox
-- without ever deleting it. Replies are stored so the original inquiry and the
-- response stay on record.
-- =============================================================================

ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contact_messages_archived_at
  ON contact_messages (archived_at);

CREATE TABLE IF NOT EXISTS contact_message_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
  admin_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body          TEXT NOT NULL,
  email_status  TEXT NOT NULL DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed')),
  email_error   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_message_replies_message
  ON contact_message_replies (message_id, created_at);

-- Service-role access only (same as contact_messages).
ALTER TABLE contact_message_replies ENABLE ROW LEVEL SECURITY;
