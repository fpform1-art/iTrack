-- 0006_prop_type_optional.sql
--
-- Prop Type is no longer collected during Bet Entry (users now only enter
-- the Prop itself). This migration is purely additive/relaxing — it does
-- NOT drop the column and does NOT touch any existing data. Existing rows
-- keep whatever prop_type value they already have; new bets simply store
-- NULL for it going forward. CSV import from the legacy tracker can still
-- populate it when the old export includes it.

alter table public.bet_legs alter column prop_type drop not null;
