-- Migration 086: type of the account's primary contact phone
-- (Direct Contact, Direct Department, Pharmacy, Operations, Dispatch, General, Reception).
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS contact_phone_type TEXT;
