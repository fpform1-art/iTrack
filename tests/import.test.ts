import { describe, it, expect } from "vitest";
import { parseSingleRows } from "@/lib/import/parse-single";
import { parseSgpRows } from "@/lib/import/parse-sgp";
import { parseParlayRows } from "@/lib/import/parse-parlay";
import { MAX_LEGS } from "@/lib/calc/validation";

describe("parseSingleRows (Form Responses3)", () => {
  it("parses a well-formed row into a valid single bet", () => {
    const { validRows, errors } = parseSingleRows([
      {
        Timestamp: "2026-07-01 12:00:00",
        Sport: "Soccer",
        League: "Premier League",
        Match: "Arsenal vs Chelsea",
        "Prop Type": "Moneyline",
        Prop: "Arsenal ML",
        Odds: "2.10",
        Sportsbook: "bet365",
        Wager: "100",
        Result: "Win",
        "Actual Return": "210",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].bet_type).toBe("single");
    expect(validRows[0].result).toBe("won");
    expect(validRows[0].odds).toBe(2.1);
    expect(validRows[0].actual_return).toBe(210);
  });

  it("flags missing required fields as errors instead of silently dropping the row", () => {
    const { validRows, errors, totalRows } = parseSingleRows([
      { Sport: "Soccer", League: "", Match: "Arsenal vs Chelsea", Odds: "2.1", Wager: "100" },
    ]);
    expect(totalRows).toBe(1);
    expect(validRows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(1);
    expect(errors[0].message).toMatch(/League/);
  });

  it("rejects odds <= 1 and non-positive wagers", () => {
    const { errors } = parseSingleRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "A vs B",
        "Prop Type": "ML",
        Prop: "A",
        Odds: "0.5",
        Sportsbook: "bet365",
        Wager: "-10",
        Result: "Win",
      },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/Odds/);
    expect(errors[0].message).toMatch(/Wager/);
  });

  it("defaults an empty/unspecified Result to pending", () => {
    const { validRows, errors } = parseSingleRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "A vs B",
        "Prop Type": "ML",
        Prop: "A",
        Odds: "2.0",
        Sportsbook: "bet365",
        Wager: "10",
        Result: "",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows[0].result).toBe("pending");
    expect(validRows[0].actual_return).toBeNull();
  });

  it("processes multiple rows independently — one bad row doesn't block good rows", () => {
    const { validRows, errors } = parseSingleRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "A vs B",
        "Prop Type": "ML",
        Prop: "A",
        Odds: "2.0",
        Sportsbook: "bet365",
        Wager: "10",
        Result: "Win",
      },
      { Sport: "Soccer" }, // missing everything else
    ]);
    expect(validRows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });
});

describe("parseSgpRows (SGP Responses)", () => {
  it("parses shared game + multiple leg columns into one bet with legs", () => {
    const { validRows, errors } = parseSgpRows([
      {
        Sport: "Soccer",
        League: "Premier League",
        Match: "Arsenal vs Chelsea",
        "Combined Odds": "4.5",
        Sportsbook: "FanDuel",
        Wager: "50",
        Result: "Win",
        "Actual Return": "225",
        "Leg 1 Prop Type": "Anytime Scorer",
        "Leg 1 Prop": "Saka",
        "Leg 1 Odds": "1.8",
        "Leg 1 Result": "Win",
        "Leg 2 Prop Type": "Total Goals",
        "Leg 2 Prop": "Over 2.5",
        "Leg 2 Odds": "2.0",
        "Leg 2 Result": "Win",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].bet_type).toBe("sgp");
    expect(validRows[0].legs).toHaveLength(2);
    expect(validRows[0].legs![0].match).toBe("Arsenal vs Chelsea");
  });

  it("requires at least 2 legs", () => {
    const { errors } = parseSgpRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "A vs B",
        "Combined Odds": "3.0",
        Sportsbook: "bet365",
        Wager: "20",
        Result: "Win",
        "Leg 1 Prop Type": "ML",
        "Leg 1 Prop": "A",
      },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/at least 2 legs/);
  });

  it("caps at MAX_LEGS legs even if more columns exist", () => {
    const row: Record<string, string> = {
      Sport: "Soccer",
      League: "EPL",
      Match: "A vs B",
      "Combined Odds": "10",
      Sportsbook: "bet365",
      Wager: "10",
      Result: "Win",
    };
    for (let n = 1; n <= 14; n++) {
      row[`Leg ${n} Prop Type`] = "ML";
      row[`Leg ${n} Prop`] = `Team ${n}`;
      row[`Leg ${n} Result`] = "Win";
    }
    const { validRows } = parseSgpRows([row]);
    expect(validRows[0].legs!.length).toBe(MAX_LEGS);
  });

  it("parses a full 12-leg SGP correctly (raised beta limit)", () => {
    const row: Record<string, string> = {
      Sport: "Soccer",
      League: "EPL",
      Match: "A vs B",
      "Combined Odds": "50",
      Sportsbook: "bet365",
      Wager: "10",
      Result: "Pending",
    };
    for (let n = 1; n <= 12; n++) {
      row[`Leg ${n} Prop`] = `Player ${n} Anytime Scorer`;
      row[`Leg ${n} Odds`] = "1.5";
    }
    const { validRows, errors } = parseSgpRows([row]);
    expect(errors).toHaveLength(0);
    expect(validRows[0].legs).toHaveLength(12);
    expect(validRows[0].legs![11].prop).toBe("Player 12 Anytime Scorer");
  });
});

describe("parseParlayRows (Parlay Responses)", () => {
  it("parses per-leg games into a parlay bet", () => {
    const { validRows, errors } = parseParlayRows([
      {
        "Combined Odds": "6.0",
        Sportsbook: "DraftKings",
        Wager: "25",
        Result: "Pending",
        "Leg 1 Sport": "Soccer",
        "Leg 1 League": "EPL",
        "Leg 1 Match": "Arsenal vs Chelsea",
        "Leg 1 Prop Type": "ML",
        "Leg 1 Prop": "Arsenal",
        "Leg 2 Sport": "Basketball",
        "Leg 2 League": "NBA",
        "Leg 2 Match": "Lakers vs Celtics",
        "Leg 2 Prop Type": "Spread",
        "Leg 2 Prop": "Lakers -3",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].legs).toHaveLength(2);
    expect(validRows[0].legs![0].sport).toBe("Soccer");
    expect(validRows[0].legs![1].sport).toBe("Basketball");
    expect(validRows[0].match).toContain("Arsenal vs Chelsea");
    expect(validRows[0].match).toContain("Lakers vs Celtics");
  });

  it("reports which leg is incomplete rather than silently dropping it", () => {
    const { errors } = parseParlayRows([
      {
        "Combined Odds": "3.0",
        Sportsbook: "bet365",
        Wager: "10",
        Result: "Win",
        "Leg 1 Sport": "Soccer",
        "Leg 1 League": "EPL",
        "Leg 1 Match": "A vs B",
        "Leg 1 Prop Type": "ML",
        "Leg 1 Prop": "A",
        "Leg 2 Sport": "Basketball",
        // Leg 2 missing League/Match/Prop Type/Prop
      },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/Leg 2/);
  });
});

describe("Prop Type is optional (no longer collected at Bet Entry, still accepted from legacy exports)", () => {
  it("parseSingleRows: imports successfully with no Prop Type column at all", () => {
    const { validRows, errors } = parseSingleRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "Arsenal vs Chelsea",
        Prop: "Arsenal ML",
        Odds: "2.0",
        Sportsbook: "bet365",
        Wager: "50",
        Result: "Win",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].prop_type).toBeNull();
    expect(validRows[0].prop).toBe("Arsenal ML");
  });

  it("parseSingleRows: still captures Prop Type when an older export includes it", () => {
    const { validRows } = parseSingleRows([
      {
        Sport: "Soccer",
        League: "EPL",
        Match: "Arsenal vs Chelsea",
        "Prop Type": "Moneyline",
        Prop: "Arsenal ML",
        Odds: "2.0",
        Sportsbook: "bet365",
        Wager: "50",
        Result: "Win",
      },
    ]);
    expect(validRows[0].prop_type).toBe("Moneyline");
  });

  it("parseSgpRows: imports legs successfully with no Leg N Prop Type columns", () => {
    const { validRows, errors } = parseSgpRows([
      {
        Sport: "Soccer",
        League: "Premier League",
        Match: "Arsenal vs Chelsea",
        "Combined Odds": "4.5",
        Sportsbook: "FanDuel",
        Wager: "50",
        Result: "Win",
        "Leg 1 Prop": "Saka Anytime Scorer",
        "Leg 1 Odds": "1.8",
        "Leg 2 Prop": "Over 2.5 Goals",
        "Leg 2 Odds": "2.0",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].legs).toHaveLength(2);
    expect(validRows[0].legs![0].prop_type).toBeNull();
    expect(validRows[0].legs![0].prop).toBe("Saka Anytime Scorer");
  });

  it("parseParlayRows: imports legs successfully with no Leg N Prop Type columns", () => {
    const { validRows, errors } = parseParlayRows([
      {
        "Combined Odds": "6.0",
        Sportsbook: "DraftKings",
        Wager: "25",
        Result: "Pending",
        "Leg 1 Sport": "Soccer",
        "Leg 1 League": "EPL",
        "Leg 1 Match": "Arsenal vs Chelsea",
        "Leg 1 Prop": "Arsenal ML",
        "Leg 2 Sport": "Basketball",
        "Leg 2 League": "NBA",
        "Leg 2 Match": "Lakers vs Celtics",
        "Leg 2 Prop": "Lakers -3",
      },
    ]);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].legs![0].prop_type).toBeNull();
    expect(validRows[0].legs![1].prop_type).toBeNull();
  });

  it("parseParlayRows: a leg with only a Prop Type but no Prop is still flagged as an error (Prop remains required)", () => {
    const { errors } = parseParlayRows([
      {
        "Combined Odds": "3.0",
        Sportsbook: "bet365",
        Wager: "10",
        Result: "Win",
        "Leg 1 Sport": "Soccer",
        "Leg 1 League": "EPL",
        "Leg 1 Match": "A vs B",
        "Leg 1 Prop Type": "Moneyline",
        // Leg 1 Prop intentionally omitted
        "Leg 2 Sport": "Basketball",
        "Leg 2 League": "NBA",
        "Leg 2 Match": "C vs D",
        "Leg 2 Prop": "C -3",
      },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/Leg 1.*Prop/);
  });
});
