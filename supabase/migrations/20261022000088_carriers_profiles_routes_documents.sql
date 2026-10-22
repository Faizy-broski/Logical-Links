-- =============================================================================
-- Migration 088: Carrier profiles — pipeline, services, routes, documents
-- =============================================================================
-- Reshapes the carriers table from migration 087 to the agreed carrier profile:
--   • 7-stage pipeline (same stages as the corporate customer pipeline)
--   • Services Offered, "Other" equipment text, last contact / next follow-up
--   • Service areas as separate route rows (carrier_routes)
--   • Uploaded compliance documents (carrier_documents + private bucket)
-- The NSC / CVOR / insurance-expiry / free-text service-area columns are
-- dropped: credentials now live in Documents, lanes in carrier_routes.
-- =============================================================================

-- ── Pipeline ─────────────────────────────────────────────────────────────────
ALTER TABLE carriers DROP CONSTRAINT IF EXISTS carriers_status_check;
UPDATE carriers SET status = 'lost' WHERE status = 'do_not_use';
ALTER TABLE carriers ADD CONSTRAINT carriers_status_check
  CHECK (status IN ('prospect', 'contacted', 'interested', 'onboarding', 'active', 'inactive', 'lost'));

-- ── Profile fields ───────────────────────────────────────────────────────────
ALTER TABLE carriers
  ADD COLUMN IF NOT EXISTS services_offered   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment_other    TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_at  DATE,
  ADD COLUMN IF NOT EXISTS next_follow_up_at  DATE;

ALTER TABLE carriers
  DROP COLUMN IF EXISTS nsc_number,
  DROP COLUMN IF EXISTS cvor_number,
  DROP COLUMN IF EXISTS insurance_expiry,
  DROP COLUMN IF EXISTS service_area;

-- ── Service areas / operating lanes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carrier_routes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id        UUID        NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  province          TEXT,       -- province or US state
  origin_city       TEXT,
  destination_city  TEXT,
  cross_border      BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order        INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carrier_routes_carrier ON carrier_routes (carrier_id, sort_order);

ALTER TABLE carrier_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_carrier_routes" ON carrier_routes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Documents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carrier_documents (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id           UUID        NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  document_type        TEXT        NOT NULL,
  file_path            TEXT        NOT NULL,   -- storage object path; signed URLs minted on read
  file_name            TEXT        NOT NULL,
  file_size            BIGINT,
  mime_type            TEXT,
  issue_date           DATE,
  expiry_date          DATE,
  verification_status  TEXT        NOT NULL DEFAULT 'not_reviewed'
                       CHECK (verification_status IN ('not_reviewed', 'pending', 'verified', 'expired', 'rejected')),
  notes                TEXT,
  uploaded_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carrier_documents_carrier ON carrier_documents (carrier_id, created_at);
CREATE INDEX IF NOT EXISTS idx_carrier_documents_expiry  ON carrier_documents (expiry_date) WHERE expiry_date IS NOT NULL;

CREATE TRIGGER trg_carrier_documents_updated_at
  BEFORE UPDATE ON carrier_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE carrier_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_carrier_documents" ON carrier_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Private bucket — carrier compliance files. Uploads and reads both go through
-- backend-issued signed URLs after a permission check (same pattern as
-- support-attachments, migration 034).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'carrier-documents',
  'carrier-documents',
  false,
  20971520,  -- 20 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin_all_carrier_documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'carrier-documents'
    AND current_user_role() = 'admin'
  );
