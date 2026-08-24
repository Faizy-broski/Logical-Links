-- =============================================================================
-- Migration 067: Make the Rewards Credit earn rate admin-editable
-- =============================================================================
-- rewards-credit.service.ts already reads earn_credit's `value` dynamically
-- from this table on every delivery completion (see getRuleValue /
-- earnCreditForDelivery) — the $1-per-delivery rate was never hardcoded in
-- application code, only locked in the admin UI/API via is_editable=false
-- (rewards.service.ts's updateRewardsRule rejects value changes when
-- is_editable is false). Flipping this to true is the entire change needed
-- to make the points-per-delivery rate admin-configurable — the settings
-- page (admin/rewards) and PATCH /rewards/rules/:id already render/accept
-- an edit control for any rule where is_editable is true, with no other
-- code change required.
--
-- redeem_credit and cash_value stay fixed — they're policy statements with
-- no numeric value (value is null), not a rate to tune.

update rewards_rules set is_editable = true where slug = 'earn_credit';
