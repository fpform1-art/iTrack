import { describe, it, expect } from "vitest";
import {
  potentialReturn,
  suggestedActualReturn,
  computeProfit,
  suggestOverallResult,
  areLegsLocked,
  computeSettledTotals,
  computeFilteredPL,
  resolveSettlement,
} from "@/lib/calc/betting";
import type { Bet } from "@/types/database";

describe("potentialReturn / suggestedActualReturn / computeProfit", () => {
  it("computes potential return from wager * decimal odds", () => {
    expect(potentialReturn(100, 2.5)).toBe(250);
    expect(potentialReturn(50, 1.91)).toBe(95.5);
  });

  it("suggests actual return per result", () => {
    expect(suggestedActualReturn("won", 100, 2.1)).toBe(210);
    expect(suggestedActualReturn("lost", 100, 2.1)).toBe(0);
    expect(suggestedActualReturn("push", 100, 2.1)).toBe(100);
    expect(suggestedActualReturn("void", 100, 2.1)).toBe(100);
    expect(suggestedActualReturn("pending", 100, 2.1)).toBeNull();
  });

  it("computes profit = actual_return - wager, null while pending", () => {
    expect(computeProfit("won", 100, 210)).toBe(110);
    expect(computeProfit("lost", 100, 0)).toBe(-100);
    expect(computeProfit("push", 100, 100)).toBe(0);
    expect(computeProfit("pending", 100, null)).toBeNull();
  });
});

describe("suggestOverallResult (multi-leg suggestion)", () => {
  it("any lost leg -> lost, even with other wins", () => {
    expect(suggestOverallResult(["won", "lost", "won"])).toBe("lost");
  });

  it("pending legs with no loss -> pending", () => {
    expect(suggestOverallResult(["won", "pending"])).toBe("pending");
  });

  it("all push -> push", () => {
    expect(suggestOverallResult(["push", "push"])).toBe("push");
  });

  it("all void -> void", () => {
    expect(suggestOverallResult(["void", "void"])).toBe("void");
  });

  it("all settled, none lost, at least one won -> won", () => {
    expect(suggestOverallResult(["won", "push", "void"])).toBe("won");
    expect(suggestOverallResult(["won", "won"])).toBe("won");
  });

  it("mix of push/void with no win and no loss -> void (stake neutral)", () => {
    expect(suggestOverallResult(["push", "void"])).toBe("void");
  });
});

describe("areLegsLocked", () => {
  it("locked once overall result leaves pending", () => {
    expect(areLegsLocked("won", ["won", "won"])).toBe(true);
  });

  it("locked once any leg has a non-pending result", () => {
    expect(areLegsLocked("pending", ["won", "pending"])).toBe(true);
  });

  it("unlocked while everything is pending", () => {
    expect(areLegsLocked("pending", ["pending", "pending"])).toBe(false);
  });
});

function bet(overrides: Partial<Bet>): Pick<Bet, "result" | "wager" | "odds" | "profit"> {
  return {
    result: "pending",
    wager: 100,
    odds: 2,
    profit: null,
    ...overrides,
  };
}

describe("computeSettledTotals (bankroll / ROI / win rate)", () => {
  it("ignores pending bets for ROI and win rate", () => {
    const bets = [
      bet({ result: "won", wager: 100, odds: 2, profit: 100 }),
      bet({ result: "pending", wager: 500, odds: 3, profit: null }),
    ];
    const totals = computeSettledTotals(bets, 1000);
    expect(totals.currentBankroll).toBe(1100);
    expect(totals.roi).toBe(100); // 100 profit / 100 wagered settled
    expect(totals.winRate).toBe(100);
  });

  it("push/void do not count as wins or losses", () => {
    const bets = [
      bet({ result: "won", wager: 100, odds: 2, profit: 100 }),
      bet({ result: "lost", wager: 100, odds: 2, profit: -100 }),
      bet({ result: "push", wager: 100, odds: 2, profit: 0 }),
      bet({ result: "void", wager: 100, odds: 2, profit: 0 }),
    ];
    const totals = computeSettledTotals(bets, 0);
    expect(totals.wins).toBe(1);
    expect(totals.losses).toBe(1);
    expect(totals.pushes).toBe(1);
    expect(totals.voids).toBe(1);
    expect(totals.winRate).toBe(50); // 1 / (1+1)
    expect(totals.currentBankroll).toBe(0); // profits cancel out
  });

  it("computes current bankroll as starting + cumulative settled profit", () => {
    const bets = [
      bet({ result: "won", wager: 50, odds: 3, profit: 100 }),
      bet({ result: "lost", wager: 50, odds: 3, profit: -50 }),
    ];
    const totals = computeSettledTotals(bets, 500);
    expect(totals.currentBankroll).toBe(550);
  });
});

describe("computeFilteredPL", () => {
  it("computes filtered profit/ROI for an arbitrary subset, excluding pending", () => {
    const bets = [
      bet({ result: "won", wager: 100, profit: 50 }),
      bet({ result: "pending", wager: 200, profit: null }),
    ];
    const { filteredProfit, filteredRoi } = computeFilteredPL(bets);
    expect(filteredProfit).toBe(50);
    expect(filteredRoi).toBe(50); // 50 / 100
  });
});

describe("resolveSettlement (regression: null override must not wipe out profit)", () => {
  it("returns null/null for a pending result regardless of any override", () => {
    expect(resolveSettlement("pending", 100, 2, 500)).toEqual({ actualReturn: null, profit: null });
    expect(resolveSettlement("pending", 100, 2)).toEqual({ actualReturn: null, profit: null });
  });

  it("falls back to the suggested return when no override is given (undefined)", () => {
    const result = resolveSettlement("won", 100, 2.5);
    expect(result.actualReturn).toBe(250);
    expect(result.profit).toBe(150);
  });

  it("REGRESSION: falls back to the suggested return when override is explicitly null — this is the exact bug class from an unset form field or CSV cell being sent through as null alongside a settled result", () => {
    const result = resolveSettlement("won", 100, 2.5, null);
    expect(result.actualReturn).toBe(250);
    expect(result.profit).toBe(150);
    // Before the fix, this would have incorrectly produced { actualReturn: null, profit: null }.
  });

  it("honors a genuine numeric override, including 0", () => {
    const overridden = resolveSettlement("won", 100, 2.5, 200);
    expect(overridden.actualReturn).toBe(200);
    expect(overridden.profit).toBe(100);

    // 0 is a deliberate, meaningful override (e.g. a partial void that pays
    // nothing back) and must NOT be treated as "no override given".
    const zero = resolveSettlement("lost", 100, 2.5, 0);
    expect(zero.actualReturn).toBe(0);
    expect(zero.profit).toBe(-100);
  });

  it("computes correctly for push/void/lost with no override", () => {
    expect(resolveSettlement("push", 100, 2.5)).toEqual({ actualReturn: 100, profit: 0 });
    expect(resolveSettlement("void", 100, 2.5)).toEqual({ actualReturn: 100, profit: 0 });
    expect(resolveSettlement("lost", 100, 2.5)).toEqual({ actualReturn: 0, profit: -100 });
  });
});
