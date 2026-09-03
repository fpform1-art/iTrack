import { describe, it, expect } from "vitest";
import { getInitials, getColorForName } from "@/lib/logos/initials";
import { normalizeTeamName } from "@/lib/logos/normalize";
import { parseMatchTeams } from "@/lib/logos/parse-match";
import { getTeamLogoUrl } from "@/lib/logos/team-logos";
import { getLeagueLogoUrl } from "@/lib/logos/league-logos";

describe("getInitials", () => {
  it("takes the first letter of each of the first two significant words", () => {
    expect(getInitials("Manchester United")).toBe("MU");
    expect(getInitials("Real Madrid")).toBe("RM");
  });

  it("skips common suffixes like FC/AFC/SC when other words are present", () => {
    expect(getInitials("Arsenal FC")).toBe("A");
    expect(getInitials("AFC Bournemouth")).toBe("B");
  });

  it("falls back to a single initial for a one-word name", () => {
    expect(getInitials("Chelsea")).toBe("C");
  });

  it("returns ? for an empty or whitespace-only name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});

describe("getColorForName", () => {
  it("is deterministic — same name always returns the same color", () => {
    const a = getColorForName("Arsenal");
    const b = getColorForName("Arsenal");
    expect(a).toBe(b);
  });

  it("returns a valid hex color", () => {
    expect(getColorForName("Chelsea")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("normalizeTeamName", () => {
  it("lowercases and strips diacritics/punctuation for stable lookup keys", () => {
    expect(normalizeTeamName("Bayer Leverkusen")).toBe("bayer leverkusen");
    expect(normalizeTeamName("Atlético Madrid")).toBe("atletico madrid");
    expect(normalizeTeamName("St. Louis City")).toBe("st louis city");
  });
});

describe("parseMatchTeams (best-effort, never guesses wrong)", () => {
  it("parses the GamePicker-produced 'Away @ Home' format", () => {
    const result = parseMatchTeams("Chelsea @ Arsenal");
    expect(result).toEqual({ away: "Chelsea", home: "Arsenal" });
  });

  it("parses a manual-entry 'vs' separator", () => {
    const result = parseMatchTeams("Arsenal vs Chelsea");
    expect(result).toEqual({ away: "Arsenal", home: "Chelsea" });
  });

  it("returns null for text with no recognizable separator (never guesses)", () => {
    expect(parseMatchTeams("Total Home Runs Over/Under")).toBeNull();
  });

  it("returns null when a side of the separator is empty", () => {
    expect(parseMatchTeams(" @ Arsenal")).toBeNull();
    expect(parseMatchTeams("Arsenal @ ")).toBeNull();
  });
});

describe("getTeamLogoUrl / getLeagueLogoUrl (empty by design — no fabricated URLs)", () => {
  it("returns null for any team since no verified logo source is configured", () => {
    expect(getTeamLogoUrl("Arsenal")).toBeNull();
    expect(getTeamLogoUrl("")).toBeNull();
  });

  it("returns null for any league since no verified logo source is configured", () => {
    expect(getLeagueLogoUrl("soccer_epl")).toBeNull();
    expect(getLeagueLogoUrl("")).toBeNull();
  });
});
