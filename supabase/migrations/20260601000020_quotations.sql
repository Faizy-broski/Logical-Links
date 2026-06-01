-- =============================================================================
-- Migration 020: Quotations + Quotation Items
--
-- quotation_number format: QT-YYYY-NNNNN
-- profile_id links to the shipper's user profile (profiles.id)
-- load_id is nullable — supports both load-linked and standalone quotations
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS quotations_seq START 1;

CREATE TABLE quotations (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number  TEXT            UNIQUE,                       -- auto: QT-2026-00001

  -- Ownership
  profile_id        UUID            NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  load_id           UUID            REFERENCES shipments (shipment_id) ON DELETE SET NULL,
  created_by        UUID            NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

  -- State
  status            quotation_status NOT NULL DEFAULT 'draft',

  -- Dates
  issue_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  expiry_date       DATE,

  -- Customer
  customer_name     TEXT            NOT NULL,
  customer_company  TEXT,
  customer_email    TEXT,
  customer_phone    TEXT,
  billing_address   TEXT,

  -- Content
  notes             TEXT,
  terms             TEXT,

  -- Financials (stored for fast retrieval; recalculated on save)
  subtotal          NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  discount          NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  tax_rate          NUMERIC(5, 4)   NOT NULL DEFAULT 0,           -- e.g. 0.1 = 10%
  tax               NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  total             NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  currency          CHAR(3)         NOT NULL DEFAULT 'AUD',

  -- Storage
  pdf_url           TEXT,

  -- Audit
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- Auto-generate quotation_number on INSERT
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quotation_number IS NULL THEN
    NEW.quotation_number :=
      'QT-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('quotations_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW EXECUTE FUNCTION generate_quotation_number();

CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Quotation Items ───────────────────────────────────────────────────────────

CREATE TABLE quotation_items (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID              NOT NULL REFERENCES quotations (id) ON DELETE CASCADE,

  description     TEXT              NOT NULL,
  category        line_item_category NOT NULL DEFAULT 'miscellaneous',
  quantity        NUMERIC(10, 3)    NOT NULL DEFAULT 1,
  unit            TEXT              NOT NULL DEFAULT 'unit',
  unit_price      NUMERIC(14, 2)    NOT NULL DEFAULT 0,
  amount          NUMERIC(14, 2)    NOT NULL DEFAULT 0,  -- quantity × unit_price
  notes           TEXT,
  sort_order      INTEGER           NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_quotation_items_updated_at
  BEFORE UPDATE ON quotation_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE quotations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items  ENABLE ROW LEVEL SECURITY;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_quotations_profile_id   ON quotations (profile_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_load_id      ON quotations (load_id)        WHERE load_id IS NOT NULL;
CREATE INDEX idx_quotations_status       ON quotations (status)          WHERE deleted_at IS NULL;
CREATE INDEX idx_quotations_created_at   ON quotations (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotation_items_quot_id ON quotation_items (quotation_id, sort_order);
