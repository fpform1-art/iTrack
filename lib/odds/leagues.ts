/**
 * Sport/league configuration for The Odds API v4 event lookups.
 *
 * This is the single source of truth for every league iTraxc offers in the
 * listed-game picker — add or remove an entry here and it propagates
 * everywhere (Sport/League dropdowns, the fixtures API route, league logo
 * lookup) with no other changes needed.
 *
 * Every `apiKey` below has been verified against The Odds API's current,
 * official sports list (https://the-odds-api.com/sports-odds-data/sports-apis.html)
 * — never guess or invent a key here.
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
  /** The Odds API `sport_key` for the /v4/sports/{sport_key}/events endpoint. Always a real, verified key — never invented. */
  apiKey: string;
  /** Broad sport grouping, for the Sport dropdown. */
  sport: string;
  /**
   * Whether this league currently has listed-fixture support via The Odds
   * API. Defaults to true. Set to false for a league you want offered in
   * the app (for display, logos, Manual Entry) before it's actually
   * available via the Odds API — the picker will still list it, but will
   * skip fetching fixtures and tell the user to use Manual Entry instead
   * of silently failing.
   */
  listedFixturesSupported?: boolean;
}

export const LEAGUE_CONFIG: LeagueConfig[] = [
  // --- Soccer: existing ---
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
  // --- Soccer: added in Beta 0.2 ---
  { label: "EFL Championship", apiKey: "soccer_efl_champ", sport: "Soccer" },
  { label: "Scottish Premiership", apiKey: "soccer_spl", sport: "Soccer" },
  { label: "Eredivisie", apiKey: "soccer_netherlands_eredivisie", sport: "Soccer" },
  { label: "Primeira Liga", apiKey: "soccer_portugal_primeira_liga", sport: "Soccer" },
  { label: "Belgian Pro League", apiKey: "soccer_belgium_first_div", sport: "Soccer" },
  { label: "MLS", apiKey: "soccer_usa_mls", sport: "Soccer" },
  // --- Other sports ---
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

/**
 * Reverse lookup by display label. Bets store `league` as free text (the
 * label GamePicker wrote for a listed pick, or whatever a manual entry
 * typed), not the apiKey — this recovers the config entry (and its
 * apiKey, for league-logo lookup) when a stored label happens to match a
 * known league exactly. Returns undefined for manual entries that don't
 * match anything, which callers should treat as "no known league" (falls
 * back to initials, not an error).
 */
export function findLeagueByLabel(label: string): LeagueConfig | undefined {
  return LEAGUE_CONFIG.find((l) => l.label === label);
}

/** True unless a league is explicitly marked unavailable via the Odds API. */
export function supportsListedFixtures(league: LeagueConfig): boolean {
  return league.listedFixturesSupported !== false;
}
