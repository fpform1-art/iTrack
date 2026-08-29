import { describe, it, expect } from "vitest";
import { applyBetFilters, distinctFilterOptions } from "@/lib/calc/filters";
import type { Bet } from "@/types/database";

function mkBet(overrides: Partial<Bet>): Bet {
  return {
    id: crypto.randomUUID(),
    user_id: "u1",
    bet_type: "single",
    placed_at: "2026-07-01T12:00:00Z",
    when_placed: "pregame",
    sport: "Soccer",
    league: "Premier League",
    match: "Arsenal vs Chelsea",
    odds: 2,
    sportsbook: "bet365",
    wager: 100,
    result: "pending",
    actual_return: null,
    profit: null,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-01T12:00:00Z",
    ...overrides,
  };
}

const bets: Bet[] = [
  mkBet({ sportsbook: "bet365", sport: "Soccer", league: "Premier League", placed_at: "2026-07-05T00:00:00Z" }),
  mkBet({ sportsbook: "FanDuel", sport: "Soccer", league: "Champions League", placed_at: "2026-08-10T00:00:00Z" }),
  mkBet({ sportsbook: "FanDuel", sport: "Basketball", league: "NBA", placed_at: "2026-08-15T00:00:00Z" }),
];

describe("applyBetFilters (multi-select, combined)", () => {
  it("filters by multiple sportsbooks", () => {
    const result = applyBetFilters(bets, {
      sportsbooks: ["bet365", "FanDuel"],
      months: [],
      sports: [],
      leagues: [],
    });
    expect(result).toHaveLength(3);
  });

  it("filters by multiple months", () => {
    const result = applyBetFilters(bets, {
      sportsbooks: [],
      months: ["2026-07", "2026-08"],
      sports: [],
      leagues: [],
    });
    expect(result).toHaveLength(3);

    const julyOnly = applyBetFilters(bets, {
      sportsbooks: [],
      months: ["2026-07"],
      sports: [],
      leagues: [],
    });
    expect(julyOnly).toHaveLength(1);
  });

  it("filters by multiple sports", () => {
    const result = applyBetFilters(bets, {
      sportsbooks: [],
      months: [],
      sports: ["Soccer"],
      leagues: [],
    });
    expect(result).toHaveLength(2);
  });

  it("filters by multiple leagues", () => {
    const result = applyBetFilters(bets, {
      sportsbooks: [],
      months: [],
      sports: [],
      leagues: ["Premier League", "NBA"],
    });
    expect(result).toHaveLength(2);
  });

  it("combines all filters together (AND across dimensions, OR within)", () => {
    const result = applyBetFilters(bets, {
      sportsbooks: ["FanDuel"],
      months: ["2026-08"],
      sports: ["Soccer", "Basketball"],
      leagues: [],
    });
    expect(result).toHaveLength(2);
  });

  it("empty filters return everything (sensible All default)", () => {
    const result = applyBetFilters(bets, { sportsbooks: [], months: [], sports: [], leagues: [] });
    expect(result).toHaveLength(3);
  });
});

describe("distinctFilterOptions", () => {
  it("derives sorted distinct options from loaded bets", () => {
    const opts = distinctFilterOptions(bets);
    expect(opts.sportsbooks).toEqual(["FanDuel", "bet365"]);
    expect(opts.sports.sort()).toEqual(["Basketball", "Soccer"]);
    expect(opts.months).toContain("2026-07");
    expect(opts.months).toContain("2026-08");
  });
});
