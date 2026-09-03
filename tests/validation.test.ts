import { describe, it, expect } from "vitest";
import { validateLegCount, multiLegBetSchema, MIN_LEGS, MAX_LEGS } from "@/lib/calc/validation";

describe("validateLegCount", () => {
  it("rejects fewer than 2 legs", () => {
    expect(validateLegCount(1).valid).toBe(false);
    expect(validateLegCount(0).valid).toBe(false);
  });

  it(`accepts ${MIN_LEGS} to ${MAX_LEGS} legs`, () => {
    for (let n = MIN_LEGS; n <= MAX_LEGS; n++) {
      expect(validateLegCount(n).valid).toBe(true);
    }
  });

  it("accepts legs in the 7-12 range specifically (raised beta limit)", () => {
    for (let n = 7; n <= 12; n++) {
      expect(validateLegCount(n).valid).toBe(true);
    }
  });

  it(`rejects more than ${MAX_LEGS} legs`, () => {
    expect(validateLegCount(MAX_LEGS + 1).valid).toBe(false);
    expect(validateLegCount(13).valid).toBe(false);
  });

  it("MAX_LEGS is 12 (beta 0.2 raised limit)", () => {
    expect(MAX_LEGS).toBe(12);
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

  it("accepts a parlay with 7 legs (beyond the old 6-leg cap)", () => {
    const legs = Array.from({ length: 7 }, () => leg());
    const result = multiLegBetSchema.safeParse({ ...base, legs });
    expect(result.success).toBe(true);
  });

  it(`accepts a parlay with ${MAX_LEGS} legs (new max)`, () => {
    const legs = Array.from({ length: MAX_LEGS }, () => leg());
    const result = multiLegBetSchema.safeParse({ ...base, legs });
    expect(result.success).toBe(true);
  });

  it(`rejects a parlay with ${MAX_LEGS + 1} legs`, () => {
    const legs = Array.from({ length: MAX_LEGS + 1 }, () => leg());
    const result = multiLegBetSchema.safeParse({ ...base, legs });
    expect(result.success).toBe(false);
  });

  it("rejects odds <= 1", () => {
    const result = multiLegBetSchema.safeParse({ ...base, odds: 1, legs: [leg(), leg()] });
    expect(result.success).toBe(false);
  });
});
