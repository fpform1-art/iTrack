import { describe, it, expect } from "vitest";
import { validateLegCount, multiLegBetSchema, MIN_LEGS, MAX_LEGS } from "@/lib/calc/validation";

describe("validateLegCount", () => {
  it("rejects fewer than 2 legs", () => {
    expect(validateLegCount(1).valid).toBe(false);
    expect(validateLegCount(0).valid).toBe(false);
  });

  it("accepts 2 to 6 legs", () => {
    for (let n = MIN_LEGS; n <= MAX_LEGS; n++) {
      expect(validateLegCount(n).valid).toBe(true);
    }
  });

  it("rejects more than 6 legs", () => {
    expect(validateLegCount(7).valid).toBe(false);
  });
});

function leg(overrides: Partial<{ sport: string; league: string; match: string; prop_type: string; prop: string }> = {}) {
  return {
    sport: "Soccer",
    league: "Premier League",
    match: "Arsenal vs Chelsea",
    prop_type: "Moneyline",
    prop: "Arsenal ML",
    ...overrides,
  };
}

describe("multiLegBetSchema", () => {
  const base = {
    bet_type: "parlay" as const,
    when_placed: "pregame" as const,
    sportsbook: "bet365",
    wager: 50,
    odds: 4.5,
  };

  it("rejects a parlay with only 1 leg", () => {
    const result = multiLegBetSchema.safeParse({ ...base, legs: [leg()] });
    expect(result.success).toBe(false);
  });

  it("accepts a parlay with 2 legs", () => {
    const result = multiLegBetSchema.safeParse({ ...base, legs: [leg(), leg()] });
    expect(result.success).toBe(true);
  });

  it("accepts a parlay with 6 legs", () => {
    const legs = Array.from({ length: 6 }, () => leg());
    const result = multiLegBetSchema.safeParse({ ...base, legs });
    expect(result.success).toBe(true);
  });

  it("rejects a parlay with 7 legs", () => {
    const legs = Array.from({ length: 7 }, () => leg());
    const result = multiLegBetSchema.safeParse({ ...base, legs });
    expect(result.success).toBe(false);
  });

  it("rejects odds <= 1", () => {
    const result = multiLegBetSchema.safeParse({ ...base, odds: 1, legs: [leg(), leg()] });
    expect(result.success).toBe(false);
  });
});
