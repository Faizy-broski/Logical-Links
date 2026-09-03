-- =============================================================================
-- Migration 074: Rewards redemption 50% cap — customer-facing copy
--
-- The redemption cap (a rewards discount can cover at most 50% of a
-- quotation total; enforced in rewardsCreditService.redeemPointsForQuotation)
-- was previously unstated. Reflect it in the "Redeeming Points" rule shown on
-- the residential Rewards "How It Works" panel. Data-only, no schema change.
-- =============================================================================

UPDATE rewards_rules
SET description = 'Customers can redeem points toward a future delivery, covering up to 50% of the quote total — the rest is paid as normal.'
WHERE slug = 'redemption_policy';
