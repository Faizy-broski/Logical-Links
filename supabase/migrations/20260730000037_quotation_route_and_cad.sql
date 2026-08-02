-- =============================================================================
-- Migration 037: Quotation origin/destination + distance, currency default -> CAD
--
-- Adds address-line + geocoded coordinate columns to quotations so origin and
-- destination can be entered directly (independent of any linked shipment),
-- plus the great-circle distance computed between them on the frontend.
--
-- Also switches the default currency for quotations/invoices/shipments from
-- AUD to CAD and backfills any existing rows still set to AUD.
-- =============================================================================

ALTER TABLE quotations
  ADD COLUMN origin_address      TEXT,
  ADD COLUMN origin_lat          NUMERIC(9, 6),
  ADD COLUMN origin_lng          NUMERIC(9, 6),
  ADD COLUMN destination_address TEXT,
  ADD COLUMN destination_lat     NUMERIC(9, 6),
  ADD COLUMN destination_lng     NUMERIC(9, 6),
  ADD COLUMN distance_km         NUMERIC(10, 2);

ALTER TABLE quotations ALTER COLUMN currency SET DEFAULT 'CAD';
ALTER TABLE invoices   ALTER COLUMN currency SET DEFAULT 'CAD';
ALTER TABLE shipments  ALTER COLUMN currency SET DEFAULT 'CAD';

UPDATE quotations SET currency = 'CAD' WHERE currency = 'AUD';
UPDATE invoices   SET currency = 'CAD' WHERE currency = 'AUD';
UPDATE shipments  SET currency = 'CAD' WHERE currency = 'AUD';
