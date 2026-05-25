-- =============================================================================
-- Migration 004: Shipments + Status History
--
-- Column names are authoritative — match backend repositories exactly:
--   shipment_id, load_number, status, origin_*, destination_*, cargo_description,
--   weight_kg, volume_m3, estimated_pickup_date, estimated_delivery_date,
--   actual_delivery_date, special_instructions, reference_number, created_by
--
-- load_number format: LL-YYYY-NNNNN  (Logical Links)
-- =============================================================================

-- ── Sequence for load_number ──────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS shipments_load_seq START 1;

CREATE TABLE shipments (
  shipment_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  load_number              TEXT        UNIQUE,      -- auto: LL-2024-00001

  -- Ownership
  account_id               UUID        REFERENCES accounts (account_id) ON DELETE RESTRICT,
  created_by               UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

  -- Classification
  shipment_type            shipment_type  NOT NULL DEFAULT 'freight',
  status                   shipment_status NOT NULL DEFAULT 'pending',

  -- Origin
  origin_address           TEXT        NOT NULL,
  origin_city              TEXT        NOT NULL,
  origin_state             TEXT        NOT NULL,
  origin_postcode          TEXT        NOT NULL,
  origin_country           TEXT        NOT NULL DEFAULT 'Australia',

  -- Destination
  destination_address      TEXT        NOT NULL,
  destination_city         TEXT        NOT NULL,
  destination_state        TEXT        NOT NULL,
  destination_postcode     TEXT        NOT NULL,
  destination_country      TEXT        NOT NULL DEFAULT 'Australia',

  -- Cargo
  cargo_description        TEXT        NOT NULL,
  weight_kg                NUMERIC(10, 3),
  volume_m3                NUMERIC(10, 3),
  pieces                   INTEGER,
  is_dangerous_goods       BOOLEAN     NOT NULL DEFAULT FALSE,
  requires_refrigeration   BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Schedule
  estimated_pickup_date    TIMESTAMPTZ,
  estimated_delivery_date  TIMESTAMPTZ,
  actual_pickup_date       TIMESTAMPTZ,
  actual_delivery_date     TIMESTAMPTZ,

  -- Pricing
  quoted_price             NUMERIC(12, 2),
  confirmed_price          NUMERIC(12, 2),
  currency                 CHAR(3)     NOT NULL DEFAULT 'AUD',

  -- Metadata
  special_instructions     TEXT,
  reference_number         TEXT,        -- client's own PO / reference

  -- Audit
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at               TIMESTAMPTZ           -- soft delete
);

-- ── Auto-generate load_number ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.load_number IS NULL THEN
    NEW.load_number :=
      'LL-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('shipments_load_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_load_number
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_load_number();

-- ── updated_at ────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Status history (immutable audit log) ─────────────────────────────────────
CREATE TABLE shipment_status_history (
  history_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id   UUID        NOT NULL REFERENCES shipments (shipment_id) ON DELETE CASCADE,
  old_status    shipment_status,         -- NULL on first insert (new record)
  new_status    shipment_status NOT NULL,
  changed_by    UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-log every status change into shipment_status_history
CREATE OR REPLACE FUNCTION log_shipment_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO shipment_status_history (shipment_id, old_status, new_status, changed_by)
    VALUES (
      NEW.shipment_id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status,
      NEW.created_by   -- best available; services may also write directly
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shipment_status_history
  AFTER INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION log_shipment_status_change();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE shipments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;
