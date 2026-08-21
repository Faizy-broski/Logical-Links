-- =============================================================================
-- Migration 054: Rewards Credit ledger idempotency
--
-- earnCreditForDelivery and redeemCreditForQuotation each do a read-then-write
-- (compute amount from current balance, then upsert balance + insert ledger
-- row) with no guard against two concurrent calls for the same shipment
-- delivery / quotation redemption (e.g. a client retry after a timeout, or a
-- double-click). These partial unique indexes make a second concurrent
-- ledger insert for the same shipment/quotation fail at the DB level — the
-- service layer inserts the ledger row before touching the balance
-- specifically so that failure prevents the balance from ever being
-- double-adjusted.
-- =============================================================================

create unique index if not exists idx_credit_ledger_earn_shipment
  on customer_credit_ledger (shipment_id)
  where type = 'earn' and shipment_id is not null;

create unique index if not exists idx_credit_ledger_redeem_quotation
  on customer_credit_ledger (quotation_id)
  where type = 'redeem' and quotation_id is not null;
