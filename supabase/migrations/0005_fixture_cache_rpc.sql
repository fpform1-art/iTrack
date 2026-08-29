-- 0005_fixture_cache_rpc.sql
--
-- Replaces the need for a service-role client to write to fixture_cache.
-- fixture_cache has no per-user data and no insert/update policy for
-- regular users (see 0004_fixture_cache.sql), so writing to it previously
-- required Postgres to bypass RLS entirely via the Supabase service role —
-- a much broader privilege than this one operation needs.
--
-- A SECURITY DEFINER function scopes that privilege escalation down to
-- exactly this one upsert: it runs with the function owner's privileges
-- (bypassing the caller's RLS restrictions for this table only), but any
-- authenticated user can call it, and it can only ever upsert a cache row —
-- it has no other capability. This lets the app's server code use the
-- normal session-scoped Supabase client everywhere, with no service-role
-- key needed at all.

create or replace function public.upsert_fixture_cache(p_sport_key text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fixture_cache (sport_key, payload, fetched_at)
  values (p_sport_key, p_payload, now())
  on conflict (sport_key) do update
    set payload = excluded.payload,
        fetched_at = excluded.fetched_at;
end;
$$;

-- Only authenticated users may call it (matches the table's read policy);
-- explicitly keep anon off it.
revoke all on function public.upsert_fixture_cache(text, jsonb) from public;
revoke all on function public.upsert_fixture_cache(text, jsonb) from anon;
grant execute on function public.upsert_fixture_cache(text, jsonb) to authenticated;
