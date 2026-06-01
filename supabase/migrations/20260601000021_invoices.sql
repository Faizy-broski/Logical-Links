-- =============================================================================
-- Migration 021: Invoices + Invoice Items
--
-- invoice_number format: INV-YYYY-NNNNN
-- Mirrors quotations structure with payment-specific fields added
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS invoices_seq START 1;

CREATE TABLE invoices (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    TEXT            UNIQUE,                       -- auto: INV-2026-00001

  -- Ownership
  profile_id        UUID            NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  load_id           UUID            REFERENCES shipments (shipment_id) ON DELETE SET NULL,
  quotation_id      UUID            REFERENCES quotations (id) ON DELETE SET NULL,  -- converted from
  created_by        UUID            NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

  -- State
  status            invoice_status  NOT NULL DEFAULT 'draft',

  -- Dates
  issue_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,

  -- Customer
  customer_name     TEXT            NOT NULL,
  customer_company  TEXT,
  customer_email    TEXT,
  customer_phone    TEXT,
  billing_address   TEXT,

  -- Content
  notes             TEXT,
  terms             TEXT,
  payment_instructions TEXT,

  -- Financials
  subtotal          NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  discount          NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  tax_rate          NUMERIC(5, 4)   NOT NULL DEFAULT 0,
  tax               NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  total             NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  balance_due       NUMERIC(14, 2)  NOT NULL DEFAULT 0,
  currency          CHAR(3)         NOT NULL DEFAULT 'AUD',

  -- Storage
  pdf_url           TEXT,

  -- Audit
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- Auto-generate invoice_number on INSERT
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number :=
      'INV-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('invoices_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Invoice Items ─────────────────────────────────────────────────────────────

CREATE TABLE invoice_items (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID              NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,

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

CREATE TRIGGER trg_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items  ENABLE ROW LEVEL SECURITY;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_invoices_profile_id    ON invoices (profile_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_load_id       ON invoices (load_id)         WHERE load_id IS NOT NULL;
CREATE INDEX idx_invoices_quotation_id  ON invoices (quotation_id)    WHERE quotation_id IS NOT NULL;
CREATE INDEX idx_invoices_status        ON invoices (status)           WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date      ON invoices (due_date)         WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_created_at    ON invoices (created_at DESC)  WHERE deleted_at IS NULL;
CREATE INDEX idx_invoice_items_inv_id   ON invoice_items (invoice_id, sort_order);
