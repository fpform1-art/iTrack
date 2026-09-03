import { normalizeTeamName } from "./normalize";

/**
 * Team crest/logo URLs, keyed by normalized team name (see normalizeTeamName).
 *
 * EMPTY BY DESIGN. iTraxc's only sports data source is The Odds API's
 * /v4/sports/{sport}/events endpoint, and its documented response schema
 * only includes "event id, home and away teams, and the commence time for
 * each event" — no logo/crest field exists there to read from. Verified
 * against The Odds API's official v4 docs before writing this file; this
 * map is intentionally empty rather than populated with guessed or
 * fabricated image URLs.
 *
 * A real crest data source (a sports-data API with a logo/badge field, or
 * a curated static asset set you control the rights to) is needed to
 * populate this. Until then every lookup returns null and the UI falls
 * back to an initials avatar — see components/ui/team-logo.tsx. This map
 * is the ONLY place that needs populating; every caller already handles
 * the null case gracefully, and a broken/404 image URL degrades to the
 * same fallback automatically (see TeamLogo's onError handler).
 *
 * Example of the shape once populated:
 *   "arsenal": "https://your-cdn.example.com/crests/arsenal.png",
 */
const TEAM_LOGOS: Record<string, string> = {};

/** Returns a team's logo URL, or null if none is known (caller should show a fallback). */
export function getTeamLogoUrl(teamName: string): string | null {
  if (!teamName) return null;
  return TEAM_LOGOS[normalizeTeamName(teamName)] ?? null;
}
