# iTraxc — Betting Performance Tracker

A personal, private, multi-user tool for tracking bets, results, bankroll,
and ROI over time. It replaces an earlier Google Sheets + Apps Script
prototype with a fast Next.js app on Supabase.

**iTraxc is not a sportsbook, gambling operator, AI picks service, odds
recommendation service, or betting automation system.** It only helps users
record and analyze bets they've placed elsewhere.

## Tech stack

- Next.js 16 (App Router) + TypeScript + React
- Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Recharts for charts
- Vitest + Testing Library for unit tests
- Vercel for deployment

## Project structure

```
app/                 Routes (App Router). (app)/ is the authenticated shell;
                      login/signup/reset-password/auth are public.
components/          UI components, grouped by feature area.
lib/
  actions/           Server actions (auth, bets, profile, feedback, import).
  calc/              Pure, unit-tested calculation/validation logic.
  data/              Server-side read helpers (RLS-scoped Supabase queries).
  odds/              The Odds API client + league configuration.
  import/            CSV parsing for the legacy Google Sheets import.
  supabase/          Browser/server/admin Supabase clients + auth middleware.
types/               Shared domain types mirroring the DB schema.
supabase/migrations/ SQL migrations (run these against your Supabase project).
supabase/RLS_VERIFICATION.md  Documented manual RLS security checklist.
tests/               Vitest unit tests for lib/calc and lib/import.
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your Supabase project's values
   (see **Supabase setup** below):

   ```bash
   cp .env.example .env.local
   ```

3. Run the migrations against your Supabase project (see below).

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Supabase setup

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - That's it — this app does **not** use a Supabase service-role key
     anywhere (see "Service-role key" note below).
3. Run the migrations in `supabase/migrations/`, in filename order, against
   your project's Postgres database. Either:
   - **Supabase SQL Editor**: paste each file's contents in order
     (`0001_profiles.sql`, `0002_bets.sql`, `0003_feedback.sql`,
     `0004_fixture_cache.sql`, `0005_fixture_cache_rpc.sql`) and run them, or
   - **Supabase CLI**: `supabase link --project-ref <your-ref>` then
     `supabase db push` (with the migration files in place).
4. In **Authentication → URL Configuration**, set the Site URL and add a
   Redirect URL for `<your-app-url>/auth/callback` (used for email
   confirmation, magic links, and password reset). For local dev this is
   `http://localhost:3000/auth/callback`.
5. Email/password signup is on by default in Supabase Auth. Magic link uses
   the same "OTP" email flow and needs no extra setup.
6. **Verify Row Level Security** using the documented checklist in
   `supabase/RLS_VERIFICATION.md` before inviting real users — every
   migration enables RLS and defines per-user ownership policies, but this
   file walks through confirming it with two real test accounts against your
   live project (a step that can't be automated in this repo's unit tests).

### Optional: beta access code

Set `BETA_ACCESS_CODE` in your environment to require that exact code at
signup (a simple private-beta gate). Leave it unset/empty to allow open
signup.

### Optional: The Odds API (listed-game lookup)

Sign up at https://the-odds-api.com and set `ODDS_API_KEY` to enable
"Listed game" lookup in the Bet Entry drawer (searches upcoming
fixtures instead of typing them in manually). This is entirely optional —
without it, users can still track every bet type via **Manual Entry**, and
the `/api/fixtures` route reports "not configured" instead of erroring.

The integration:
- Runs **server-side only** — `ODDS_API_KEY` is never sent to the browser.
- Uses the low-cost `events` endpoint, not the `odds` endpoint.
- Caches results in the `fixture_cache` table for ~20 minutes, so repeated
  lookups across users don't re-hit the API.
- Never polls in the background — it only fetches when a user opens the
  game picker for a given league.
- Writes to the cache through the `upsert_fixture_cache()` Postgres function
  (see `supabase/migrations/0005_fixture_cache_rpc.sql`), callable by any
  authenticated user but scoped to exactly that one operation — no
  service-role key is needed or used anywhere in this app.

### Note: no service-role key

Some Supabase apps need a service-role key for privileged server-side
operations. This one doesn't — every write goes through either normal
RLS-scoped queries as the signed-in user, or the narrowly-scoped
`upsert_fixture_cache()` function above. There's no broadly-privileged
secret to configure, rotate, or accidentally leak.

## Environment variables

See `.env.example` for the full list. Summary:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key. Safe for the browser. |
| `ODDS_API_KEY` | No | Enables listed-game lookup. App works fully without it. |
| `BETA_ACCESS_CODE` | No | Gates signup with a shared code if set. |
| `NEXT_PUBLIC_APP_URL` | Yes | Used to build auth redirect URLs (e.g. `http://localhost:3000` locally, your production URL on Vercel). |

## Running tests

```bash
npm run test        # Vitest — pure calculation/validation/import logic
npm run typecheck    # TypeScript
npm run lint          # ESLint
npm run build          # Production build (also type-checks)
```

Unit tests cover: profit/ROI/win-rate/bankroll calculation, the
suggested-actual-return/profit resolution used by grading and CSV import,
multi-leg overall-result suggestion, leg-count validation (2–6), lock-after-
grading behavior, multi-select filter combinations, CSV import parsing and
validation for all three legacy sheet formats, and account-related
validation (settings, feedback, auth password/beta-code rules).

Row Level Security is verified against a live Supabase project rather than
in this test suite — see `supabase/RLS_VERIFICATION.md`.

## CSV import from the old tracker

Settings → **Go to CSV Import** accepts exports from the three legacy
Google Sheets tabs:

- **Form Responses3** (single bets)
- **SGP Responses** (same-game parlays — one shared game + `Leg 1..6`
  columns for Prop Type/Prop/Odds/Result)
- **Parlay Responses** (parlays — `Leg 1..6` columns each with their own
  Sport/League/Match/Prop Type/Prop/Odds/Result)

Column headers are matched case/punctuation-insensitively against a set of
common aliases, so exact old-sheet naming doesn't need to match exactly.
Every row is validated and **previewed before anything is imported** — rows
with problems are listed with the specific error, not silently dropped, and
nothing is written to the database until you click **Import**. Imported
bets are always attached to your own currently-logged-in account.

## Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, **Add New → Project**, import the repository.
3. Framework preset: Next.js (auto-detected).
4. Add the environment variables from the table above under **Project
   Settings → Environment Variables** (Production, and Preview if you want
   preview deployments to work against the same or a separate Supabase
   project). Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL (e.g.
   `https://itraxc.vercel.app`).
5. Deploy.
6. Back in Supabase → **Authentication → URL Configuration**, add
   `https://<your-vercel-domain>/auth/callback` as a Redirect URL (and
   update the Site URL) so email confirmation/magic-link/password-reset
   links work in production.
7. Re-run the RLS verification checklist (`supabase/RLS_VERIFICATION.md`)
   against production before announcing the beta.

No server or container config is needed beyond the environment variables —
this is a standard Next.js App Router deployment.

## Known beta limitations

Deliberately out of scope for this beta (per the original product spec):

- No subscriptions/payments
- No sportsbook account connections or automated bet importing
- No automated grading (grading is manual, with a suggested result you can
  override)
- No AI betting recommendations
- No social feeds, leaderboards, or affiliate systems
- No native iOS/Android apps
- No complex admin dashboard

Other things worth knowing:

- Odds are **decimal only** for this beta; American-odds input/conversion
  isn't implemented yet (the codebase is structured so it can be added
  later without restructuring).
- Listed-game lookup depends on The Odds API's available sport/league keys.
  Qualification-round matches for the Europa League / Conference League may
  not appear under the regular season keys — use Manual Entry for those.
- CSV import is designed to be tolerant of header-naming differences from
  the original Google Sheets export, but very unusual exports may need
  manual column renaming first; the preview step will show exactly which
  rows/fields failed to parse.
