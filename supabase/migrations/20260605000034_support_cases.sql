-- =============================================================================
-- Migration 034: Support Cases (Support & Ticketing)
--
-- support_cases        — the case itself (subject/description/status)
-- support_case_comments — customer/admin conversation on a case
-- support_case_attachments — files attached to a case
-- support_case_events  — system-generated lifecycle timeline ("Case history"),
--                         distinct from the user-authored comment thread
-- =============================================================================

CREATE TYPE support_case_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE support_event_type  AS ENUM ('created', 'status_changed', 'attachment_added');

CREATE SEQUENCE IF NOT EXISTS support_cases_seq START 1;

CREATE TABLE support_cases (
  case_id      UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number  TEXT                 UNIQUE,        -- auto: SUP-YYYY-NNNNN

  -- Ownership — account_id lets company admins see their whole company's cases;
  -- created_by is always the individual user who raised it.
  account_id   UUID                 REFERENCES accounts (account_id) ON DELETE SET NULL,
  created_by   UUID                 NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

  subject      TEXT                 NOT NULL CHECK (LENGTH(subject) BETWEEN 1 AND 200),
  description  TEXT                 NOT NULL CHECK (LENGTH(description) BETWEEN 1 AND 5000),
  status       support_case_status  NOT NULL DEFAULT 'open',

  created_at   TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ          NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION generate_support_case_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number :=
      'SUP-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('support_cases_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_case_number
  BEFORE INSERT ON support_cases
  FOR EACH ROW EXECUTE FUNCTION generate_support_case_number();

CREATE TRIGGER trg_support_cases_updated_at
  BEFORE UPDATE ON support_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Comments ──────────────────────────────────────────────────────────────────

CREATE TABLE support_case_comments (
  comment_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID        NOT NULL REFERENCES support_cases (case_id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  content     TEXT        NOT NULL CHECK (LENGTH(content) BETWEEN 1 AND 5000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Attachments ───────────────────────────────────────────────────────────────

CREATE TABLE support_case_attachments (
  attachment_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID        NOT NULL REFERENCES support_cases (case_id) ON DELETE CASCADE,
  uploaded_by   UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  file_name     TEXT        NOT NULL,
  file_path     TEXT        NOT NULL,   -- storage object path — signed URLs are minted on read
  file_size     INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Case history (system-generated timeline) ─────────────────────────────────

CREATE TABLE support_case_events (
  event_id     UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID                NOT NULL REFERENCES support_cases (case_id) ON DELETE CASCADE,
  event_type   support_event_type  NOT NULL,
  from_status  support_case_status,
  to_status    support_case_status,
  note         TEXT,
  created_by   UUID                REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE support_cases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_case_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_case_events      ENABLE ROW LEVEL SECURITY;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_support_cases_account_id       ON support_cases (account_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_support_cases_status           ON support_cases (status)            WHERE deleted_at IS NULL;
CREATE INDEX idx_support_cases_created_at       ON support_cases (created_at DESC)   WHERE deleted_at IS NULL;
CREATE INDEX idx_support_case_comments_case_id  ON support_case_comments (case_id, created_at);
CREATE INDEX idx_support_case_attach_case_id    ON support_case_attachments (case_id, created_at);
CREATE INDEX idx_support_case_events_case_id    ON support_case_events (case_id, created_at);

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Private — files are sensitive support attachments. All access (upload + read)
-- goes through backend-issued signed URLs after an authorization check, mirroring
-- the "documents" bucket pattern (service role bypasses RLS; no client-side
-- direct-upload policy needed).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin_all_support_attachments" ON storage.objects
  FOR ALL USING (
    bucket_id = 'support-attachments'
    AND current_user_role() = 'admin'
  );
