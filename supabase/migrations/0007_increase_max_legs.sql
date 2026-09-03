-- 0007_increase_max_legs.sql
--
-- Raises the maximum legs per SGP/parlay from 6 to 12. Purely a constraint
-- relaxation — no data is touched, no column dropped, existing 2-6 leg
-- bets are completely unaffected and remain valid under the new, wider
-- bound.
--
-- The original CHECK constraint in 0002_bets.sql was declared inline
-- without an explicit name, so Postgres auto-named it using its standard
-- <table>_<column>_check convention.

alter table public.bet_legs
  drop constraint if exists bet_legs_leg_order_check;

alter table public.bet_legs
  add constraint bet_legs_leg_order_check check (leg_order >= 1 and leg_order <= 12);
