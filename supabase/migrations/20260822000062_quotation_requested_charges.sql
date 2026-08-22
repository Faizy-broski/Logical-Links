-- =============================================================================
-- Migration 062: Requested additional-charge keys on quotations
--
-- Corporate customers requesting a manual quote (POST /quotations/request)
-- can now pre-select the same global "Additional Charges" options the admin
-- Pricing Calculator offers. There's no price yet at request time — admin
-- still prices the quotation manually — so this just records which charges
-- the customer asked for, to pre-tick them in the calculator when admin
-- works the request. Irrelevant once the quotation is actually priced
-- (status moves past 'requested'); never shown to the customer again.
-- =============================================================================

ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS requested_additional_charge_keys TEXT[] NOT NULL DEFAULT '{}';
