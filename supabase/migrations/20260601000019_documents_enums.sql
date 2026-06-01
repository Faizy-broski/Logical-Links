-- =============================================================================
-- Migration 019: Document Enums
-- Quotation status, invoice status, and line item category types
-- =============================================================================

CREATE TYPE quotation_status AS ENUM (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'unpaid',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

CREATE TYPE line_item_category AS ENUM (
  'freight_charge',
  'line_haul',
  'fuel_surcharge',
  'accessorial',
  'loading_fee',
  'unloading_fee',
  'lumper_fee',
  'toll_charges',
  'detention',
  'layover',
  'storage_fee',
  'customs_fee',
  'administrative_fee',
  'insurance',
  'miscellaneous',
  'custom'
);
