-- 0004_fixture_cache.sql
-- Server-side cache for The Odds API event/fixture lookups so we don't hit the
-- API on every dropdown interaction. Reads are allowed for any authenticated
-- user (see policy below); writes go through the narrowly-scoped
-- upsert_fixture_cache() SECURITY DEFINER function in
-- 0005_fixture_cache_rpc.sql — never directly, and never via a broader
-- service-role client.

create table if not exists public.fixture_cache (
  sport_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.fixture_cache enable row level security;

-- Any authenticated user may read cached fixtures (no user-specific data here).
drop policy if exists "fixture_cache_select_authenticated" on public.fixture_cache;
create policy "fixture_cache_select_authenticated" on public.fixture_cache
  for select using (auth.role() = 'authenticated');

-- No insert/update/delete policies for normal users on this table directly —
-- writes go exclusively through the upsert_fixture_cache() function above,
-- which is the only thing granted a path around that restriction.

grant select on public.fixture_cache to authenticated;
