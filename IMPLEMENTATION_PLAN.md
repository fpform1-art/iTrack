# iTrack — Implementation Plan

Personal, multi-user betting performance tracker. Next.js (App Router) + TypeScript + Supabase (Postgres/Auth/RLS) + Tailwind + Recharts. Deployed on Vercel.

## Phases

1. **Project init** — Next.js/TS/Tailwind scaffold, deps, folder structure. ✅
2. **Supabase schema** — migrations for `profiles`, `bets`, `bet_legs`, `feedback`, enums, indexes, triggers, RLS, grants.
3. **App shell** — auth pages, protected layout, nav (desktop + mobile), profile/settings.
4. **Home dashboard** — bankroll/P&L/ROI cards, multi-select filters (book/month/sport/league), client-side filtering.
5. **Bet Entry drawer** — global slide-over, single/SGP/parlay forms, listed vs manual game source.
6. **My Bets** — status tabs, filters/search, edit, delete.
7. **Grade** — pending queue, single + multi-leg grading, suggested overall result.
8. **Performance** — breakdowns, Recharts charts (daily net bar/line, bankroll).
9. **Sports/game lookup** — server-side Odds API v4 route with in-memory/DB cache, league config.
10. **CSV import + Beta Feedback**.
11. **Testing, lint, typecheck, build, README, deployment docs.**

## Status

Actively building. See README "Known limitations" for what's stubbed vs complete in this pass.

## Credentials needed from you (see "NEEDED FROM YOU" in final summary)

- Supabase project URL + publishable (anon) key
- The Odds API key (optional for beta — app runs with manual entry only if absent)
- Vercel project (for actual deployment — code + docs are prepared regardless)
- Optional `BETA_ACCESS_CODE`
