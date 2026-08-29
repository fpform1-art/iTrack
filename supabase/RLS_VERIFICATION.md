# RLS Verification Queries

These are documented manual verification steps for iTrack's Row Level
Security. Run them in the Supabase SQL editor (or `psql`) against a real
project after applying the migrations, using two real auth users.

They can't run as part of `npm test` because they require a live Postgres
instance with `auth.users` populated (Vitest/unit tests cover the pure
calculation logic instead — see `tests/`). Treat this file as the RLS
regression checklist for every beta release.

## Setup

1. Sign up two accounts through the app (or `auth.admin.createUser`) —
   call them **User A** and **User B**. Note their `auth.users.id` UUIDs.
2. As **User A**, create one bet of each type (single, SGP, parlay) via the
   app so `bets` and `bet_legs` have real rows, plus one feedback submission.
3. Run the queries below **as each user** via the Supabase SQL editor's
   "Run as" role impersonation, or via `supabase.auth.signInWithPassword`
   from a script and querying through `supabase-js` with that session (this
   exercises RLS exactly as the app does — service-role/SQL-editor "postgres"
   connections bypass RLS entirely and are NOT a valid test).

## profiles

```sql
-- As User B, attempt to read User A's profile — expect 0 rows.
select * from public.profiles where id = '<user_a_id>';

-- As User B, attempt to update User A's profile — expect 0 rows affected
-- (RLS silently filters, it does not error).
update public.profiles set display_name = 'hacked' where id = '<user_a_id>';

-- As User B, reading their own profile — expect exactly 1 row.
select * from public.profiles where id = '<user_b_id>';
```

## bets

```sql
-- As User B, attempt to read User A's bets — expect 0 rows.
select * from public.bets where user_id = '<user_a_id>';

-- As User B, attempt to update one of User A's bets by id — expect 0 rows
-- affected.
update public.bets set result = 'won' where id = '<user_a_bet_id>';

-- As User B, attempt to delete one of User A's bets — expect 0 rows
-- affected.
delete from public.bets where id = '<user_a_bet_id>';

-- As User B, attempt to INSERT a bet row with user_id spoofed as User A —
-- expect a policy violation error (42501).
insert into public.bets (user_id, bet_type, sport, league, match, odds, sportsbook, wager)
values ('<user_a_id>', 'single', 'Soccer', 'EPL', 'X vs Y', 2.0, 'bet365', 10);
```

## bet_legs

```sql
-- As User B, attempt to read User A's bet legs — expect 0 rows.
select * from public.bet_legs where user_id = '<user_a_id>';

-- As User B, attempt to attach a new leg to one of User A's bets — expect a
-- policy violation error (the INSERT policy checks the parent bet's owner).
insert into public.bet_legs (bet_id, user_id, leg_order, sport, league, match, prop_type, prop)
values ('<user_a_multileg_bet_id>', '<user_b_id>', 3, 'Soccer', 'EPL', 'X vs Y', 'ML', 'X');

-- As User B, attempt to grade (update the result of) one of User A's legs —
-- expect 0 rows affected.
update public.bet_legs set result = 'won' where id = '<user_a_leg_id>';
```

## feedback

```sql
-- As User B, attempt to read User A's feedback — expect 0 rows.
select * from public.feedback where user_id = '<user_a_id>';

-- As User B, attempt to insert feedback spoofed as User A — expect a policy
-- violation error.
insert into public.feedback (user_id, category, message)
values ('<user_a_id>', 'bug', 'spoofed');
```

## Expected results summary

| Table      | Cross-user SELECT | Cross-user UPDATE | Cross-user DELETE | Spoofed INSERT (owner = other user) |
|------------|--------------------|--------------------|--------------------|--------------------------------------|
| profiles   | 0 rows             | 0 rows affected    | n/a (no policy)    | rejected (42501)                     |
| bets       | 0 rows             | 0 rows affected    | 0 rows affected    | rejected (42501)                     |
| bet_legs   | 0 rows             | 0 rows affected    | 0 rows affected    | rejected (42501)                     |
| feedback   | 0 rows             | n/a (no policy)    | n/a (no policy)    | rejected (42501)                     |

If any of these produce a different result, do not ship the beta — file an
issue against the relevant migration in `supabase/migrations/` immediately.
