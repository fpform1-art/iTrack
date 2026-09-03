import { describe, it, expect } from "vitest";
import {
  LEAGUE_CONFIG,
  SPORTS,
  leaguesForSport,
  findLeague,
  findLeagueByLabel,
  supportsListedFixtures,
} from "@/lib/odds/leagues";

describe("league configuration (Beta 0.2 expansion)", () => {
  const NEW_LEAGUES: { label: string; apiKey: string }[] = [
    { label: "EFL Championship", apiKey: "soccer_efl_champ" },
    { label: "Scottish Premiership", apiKey: "soccer_spl" },
    { label: "Eredivisie", apiKey: "soccer_netherlands_eredivisie" },
    { label: "Primeira Liga", apiKey: "soccer_portugal_primeira_liga" },
    { label: "Belgian Pro League", apiKey: "soccer_belgium_first_div" },
    { label: "MLS", apiKey: "soccer_usa_mls" },
  ];

  it("includes all six newly added leagues with their exact verified Odds API keys", () => {
    for (const { label, apiKey } of NEW_LEAGUES) {
      const entry = findLeague(apiKey);
      expect(entry, `expected a league config entry for ${apiKey}`).toBeDefined();
      expect(entry?.label).toBe(label);
      expect(entry?.sport).toBe("Soccer");
    }
  });

  const EXISTING_LEAGUES: string[] = [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_italy_serie_a",
    "soccer_germany_bundesliga",
    "soccer_france_ligue_one",
    "soccer_uefa_champs_league",
    "soccer_uefa_europa_league",
    "soccer_uefa_europa_conference_league",
    "basketball_nba",
    "baseball_mlb",
    "americanfootball_nfl",
    "icehockey_nhl",
  ];

  it("preserves every previously supported league", () => {
    for (const apiKey of EXISTING_LEAGUES) {
      expect(findLeague(apiKey), `expected ${apiKey} to still be present`).toBeDefined();
    }
  });

  it("has no duplicate apiKeys", () => {
    const keys = LEAGUE_CONFIG.map((l) => l.apiKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("SPORTS reflects every distinct sport across the config, including Soccer", () => {
    expect(SPORTS).toContain("Soccer");
    expect(SPORTS).toContain("Basketball");
  });

  it("leaguesForSport('Soccer') includes both old and newly added soccer leagues", () => {
    const soccer = leaguesForSport("Soccer");
    const apiKeys = soccer.map((l) => l.apiKey);
    expect(apiKeys).toContain("soccer_epl"); // existing
    expect(apiKeys).toContain("soccer_usa_mls"); // new
  });

  it("findLeagueByLabel resolves a stored bet.league string back to its config entry", () => {
    const entry = findLeagueByLabel("MLS");
    expect(entry?.apiKey).toBe("soccer_usa_mls");
  });

  it("findLeagueByLabel returns undefined for a manual-entry league with no match", () => {
    expect(findLeagueByLabel("Some Local Sunday League")).toBeUndefined();
  });

  it("supportsListedFixtures defaults to true when unset (every current league)", () => {
    for (const league of LEAGUE_CONFIG) {
      expect(supportsListedFixtures(league)).toBe(true);
    }
  });

  it("supportsListedFixtures respects an explicit false override", () => {
    expect(supportsListedFixtures({ label: "X", apiKey: "x", sport: "Soccer", listedFixturesSupported: false })).toBe(
      false
    );
  });
});
