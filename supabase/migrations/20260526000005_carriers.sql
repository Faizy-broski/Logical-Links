-- =============================================================================
-- Migration 005: Carriers
--
-- Backend joins: carriers ( carrier_id, carrier_name, phone )
-- Backend selects: * (all columns on direct fetch)
-- =============================================================================

CREATE TABLE carriers (
  carrier_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  carrier_name     TEXT        NOT NULL,
  carrier_code     TEXT        UNIQUE,      -- short internal code e.g. "FXP", "TNT"
  abn              TEXT,

  -- Contact — column names must match backend: email, phone
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,

  -- Address
  address          TEXT,
  city             TEXT,
  state            TEXT,
  postcode         TEXT,
  country          TEXT        NOT NULL DEFAULT 'Australia',

  -- Compliance (MC / DOT numbers for cross-border / US routes)
  mc_number        TEXT,
  dot_number       TEXT,
  insurance_expiry DATE,

  -- Capability
  service_types    TEXT[]      NOT NULL DEFAULT '{}', -- ['freight','last_mile']
  coverage_states  TEXT[]      NOT NULL DEFAULT '{}',
  rating           NUMERIC(3, 1) CHECK (rating BETWEEN 0 AND 5),

  -- Operational notes — backend reads `notes` directly
  notes            TEXT,

  -- State
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Audit
  created_by       UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

-- ── updated_at ────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_carriers_updated_at
  BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
