/**
 * League/competition logo URLs, keyed by the same `apiKey` used in
 * lib/odds/leagues.ts (e.g. "soccer_epl") — already a stable, unique
 * identifier, so no separate normalization is needed here.
 *
 * EMPTY BY DESIGN, for the same reason as lib/logos/team-logos.ts: The
 * Odds API doesn't provide competition logos, and no other verified
 * source is wired up yet. See that file's comment for the full
 * explanation — the same applies here.
 *
 * Example of the shape once populated:
 *   soccer_epl: "https://your-cdn.example.com/leagues/epl.png",
 */
const LEAGUE_LOGOS: Record<string, string> = {};

/** Returns a league's logo URL, or null if none is known (caller should show a fallback). */
export function getLeagueLogoUrl(apiKey: string): string | null {
  if (!apiKey) return null;
  return LEAGUE_LOGOS[apiKey] ?? null;
}
