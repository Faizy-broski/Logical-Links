-- Custom Status Management System
-- Adds a `statuses` table for both system-protected and user-created statuses.
-- System statuses mirror the existing SHIPMENT_STATUSES values so the state
-- machine keeps working unchanged. Custom statuses are informational.

CREATE TABLE IF NOT EXISTS statuses (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        varchar(100) NOT NULL,
  slug        varchar(100) NOT NULL UNIQUE,
  description text,
  type        varchar(10)  NOT NULL DEFAULT 'custom'
                           CHECK (type IN ('system', 'custom')),
  color       varchar(50),
  is_system   boolean      NOT NULL DEFAULT false,
  is_active   boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION set_statuses_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER statuses_updated_at
  BEFORE UPDATE ON statuses
  FOR EACH ROW EXECUTE FUNCTION set_statuses_updated_at();

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_statuses_slug      ON statuses(slug);
CREATE INDEX IF NOT EXISTS idx_statuses_is_active ON statuses(is_active);

-- ── Seed system statuses ───────────────────────────────────────────────────────
-- These slugs match the values stored in shipments.status, so all existing rows
-- automatically resolve to a status in this table.

INSERT INTO statuses (name, slug, type, is_system, is_active) VALUES
  ('Pending',          'pending',          'system', true, true),
  ('Confirmed',        'confirmed',        'system', true, true),
  ('Assigned',         'assigned',         'system', true, true),
  ('Picked Up',        'picked_up',        'system', true, true),
  ('In Transit',       'in_transit',       'system', true, true),
  ('Out for Delivery', 'out_for_delivery', 'system', true, true),
  ('Delivered',        'delivered',        'system', true, true),
  ('Cancelled',        'cancelled',        'system', true, true)
ON CONFLICT (slug) DO NOTHING;

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active statuses
CREATE POLICY "statuses_select_authenticated"
  ON statuses FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Any authenticated user can create a custom status
CREATE POLICY "statuses_insert_authenticated"
  ON statuses FOR INSERT
  TO authenticated
  WITH CHECK (is_system = false);

-- Any authenticated user can update a custom status they're involved with
-- (fine-grained admin-only restriction enforced at service layer)
CREATE POLICY "statuses_update_authenticated"
  ON statuses FOR UPDATE
  TO authenticated
  USING (is_system = false);

-- Soft-delete only (update is_active); hard deletes blocked at service layer
CREATE POLICY "statuses_delete_service_role"
  ON statuses FOR DELETE
  TO service_role
  USING (true);

-- Grant table access to authenticated role
GRANT SELECT, INSERT, UPDATE ON statuses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON statuses TO service_role;
