/**
 * Sport/league configuration for The Odds API v4 event lookups.
 * Add/remove entries here without touching the rest of the app.
 *
 * IMPORTANT: Europa League / Conference League *qualification* matches may
 * not appear under these regular-season keys — The Odds API does not
 * currently expose separate qualifying-round keys for all competitions.
 * Do NOT invent keys for them. Manual Entry remains available for any match
 * that isn't listed.
 */
export interface LeagueConfig {
  /** Display label shown in the UI. */
  label: string;
  /** The Odds API `sport_key` for the /v4/sports/{sport_key}/events endpoint. */
  apiKey: string;
  /** Broad sport grouping, for the Sport dropdown. */
  sport: string;
}

export const LEAGUE_CONFIG: LeagueConfig[] = [
  { label: "English Premier League", apiKey: "soccer_epl", sport: "Soccer" },
  { label: "La Liga", apiKey: "soccer_spain_la_liga", sport: "Soccer" },
  { label: "Serie A", apiKey: "soccer_italy_serie_a", sport: "Soccer" },
  { label: "Bundesliga", apiKey: "soccer_germany_bundesliga", sport: "Soccer" },
  { label: "Ligue 1", apiKey: "soccer_france_ligue_one", sport: "Soccer" },
  { label: "UEFA Champions League", apiKey: "soccer_uefa_champs_league", sport: "Soccer" },
  { label: "UEFA Europa League", apiKey: "soccer_uefa_europa_league", sport: "Soccer" },
  {
    label: "UEFA Europa Conference League",
    apiKey: "soccer_uefa_europa_conference_league",
    sport: "Soccer",
  },
  { label: "NBA", apiKey: "basketball_nba", sport: "Basketball" },
  { label: "MLB", apiKey: "baseball_mlb", sport: "Baseball" },
  { label: "NFL", apiKey: "americanfootball_nfl", sport: "Football" },
  { label: "NHL", apiKey: "icehockey_nhl", sport: "Hockey" },
];

export const SPORTS = [...new Set(LEAGUE_CONFIG.map((l) => l.sport))];

export function leaguesForSport(sport: string): LeagueConfig[] {
  return LEAGUE_CONFIG.filter((l) => l.sport === sport);
}

export function findLeague(apiKey: string): LeagueConfig | undefined {
  return LEAGUE_CONFIG.find((l) => l.apiKey === apiKey);
}
