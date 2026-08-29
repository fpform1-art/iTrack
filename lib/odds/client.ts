import { createClient } from "@/lib/supabase/server";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes — well within the 10-30min guidance.

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

export function isOddsApiConfigured() {
  return Boolean(process.env.ODDS_API_KEY);
}

/**
 * Fetch upcoming events for a sport_key, using the events endpoint (not
 * odds) to keep API usage low, and caching results in Postgres so repeated
 * dropdown interactions across users don't hit the API again within the TTL.
 * No background polling — this only runs on demand, server-side.
 *
 * Uses the normal session-scoped Supabase client (not a service-role
 * client): reads are allowed for any authenticated user via RLS, and the
 * cache write goes through the narrowly-scoped upsert_fixture_cache() RPC
 * (see supabase/migrations/0005_fixture_cache_rpc.sql) rather than a
 * broadly-privileged admin client.
 */
export async function getEventsForLeague(sportKey: string): Promise<OddsApiEvent[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ODDS_API_KEY is not configured. Listed-game lookup is unavailable — use Manual Entry."
    );
  }

  const supabase = await createClient();

  const { data: cached } = await supabase
    .from("fixture_cache")
    .select("payload, fetched_at")
    .eq("sport_key", sportKey)
    .maybeSingle();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return cached.payload as OddsApiEvent[];
  }

  const url = `${ODDS_API_BASE}/sports/${encodeURIComponent(sportKey)}/events?apiKey=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    // Fall back to stale cache rather than failing outright, if we have one.
    if (cached) return cached.payload as OddsApiEvent[];
    throw new Error(`The Odds API request failed (${res.status}).`);
  }

  const events = (await res.json()) as OddsApiEvent[];

  await supabase.rpc("upsert_fixture_cache", { p_sport_key: sportKey, p_payload: events });

  return events;
}
