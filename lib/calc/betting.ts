import type { Bet, BetResult, LegResult } from "@/types/database";

/** Potential return if a bet at `odds` (decimal) and `wager` wins. */
export function potentialReturn(wager: number, odds: number): number {
  return round2(wager * odds);
}

/** Suggested actual_return for a settled bet, before user override. */
export function suggestedActualReturn(
  result: BetResult,
  wager: number,
  odds: number
): number | null {
  switch (result) {
    case "won":
      return round2(wager * odds);
    case "push":
    case "void":
      return round2(wager);
    case "lost":
      return 0;
    case "pending":
      return null;
  }
}

/** profit = actual_return - wager (null while pending). */
export function computeProfit(
  result: BetResult,
  wager: number,
  actualReturn: number | null
): number | null {
  if (result === "pending" || actualReturn === null) return null;
  return round2(actualReturn - wager);
}

/**
 * Resolves the (actual_return, profit) pair to persist for a settlement.
 *
 * `overrideActualReturn` is the caller's explicit value, if any — e.g. what
 * a user typed into the Actual Return field, or what a CSV row specified.
 * `null` or `undefined` here means "no deliberate override was given," and
 * always falls back to the standard suggested return for the result. Only a
 * real number (including `0`, for a bet that pays back nothing) counts as a
 * deliberate override.
 *
 * This exists because `actual_return == null` is ambiguous by itself: it's
 * both what an empty/unset form field sends AND a literal "no return"
 * value, so treating bare `null` as "explicitly zero it out" silently wipes
 * out a correctly-computed profit whenever a caller passes through an
 * unset field alongside a non-pending result — a real bug this function
 * fixes in one place for every caller (updateBet, updateLegsAndSuggestOverall,
 * commitImport).
 */
export function resolveSettlement(
  result: BetResult,
  wager: number,
  odds: number,
  overrideActualReturn?: number | null
): { actualReturn: number | null; profit: number | null } {
  if (result === "pending") return { actualReturn: null, profit: null };
  const actualReturn = overrideActualReturn ?? suggestedActualReturn(result, wager, odds);
  return { actualReturn, profit: computeProfit(result, wager, actualReturn) };
}

/**
 * Suggest an overall multi-leg (SGP/parlay) result from individual leg results.
 * The user can always override manually.
 *
 * Rules:
 * - any settled leg lost -> lost
 * - some legs still pending, none lost -> pending
 * - all legs push -> push
 * - all legs void -> void
 * - every leg settled, none lost, at least one won -> won
 *   (won/push/void combinations with no loss suggest won)
 */
export function suggestOverallResult(legResults: LegResult[]): BetResult {
  if (legResults.length === 0) return "pending";

  if (legResults.some((r) => r === "lost")) return "lost";

  const hasPending = legResults.some((r) => r === "pending");
  if (hasPending) return "pending";

  // All legs settled at this point, none lost.
  if (legResults.every((r) => r === "push")) return "push";
  if (legResults.every((r) => r === "void")) return "void";

  const hasWon = legResults.some((r) => r === "won");
  if (hasWon) return "won";

  // Mix of push/void only with no won leg — treat as void (stake-neutral).
  return "void";
}

/** Legs are locked from add/remove once grading has begun. */
export function areLegsLocked(overallResult: BetResult, legResults: LegResult[]): boolean {
  if (overallResult !== "pending") return true;
  return legResults.some((r) => r !== "pending");
}

export interface SettledTotals {
  currentBankroll: number;
  totalProfit: number;
  totalWagerSettled: number;
  roi: number; // percent
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  winRate: number; // percent, excludes push/void
  averageWager: number;
  averageOdds: number;
  biggestWin: number;
  biggestLoss: number;
}

/**
 * Compute bankroll/P&L/ROI/win-rate/etc. from a set of bets (already filtered
 * to what should count, e.g. a user's own settled + pending bets).
 *
 * currentBankroll = startingBankroll + cumulative settled profit (all settled
 * bets for the user, NOT limited by any active UI filter — see Home page).
 */
export function computeSettledTotals(
  bets: Pick<Bet, "result" | "wager" | "odds" | "profit">[],
  startingBankroll: number
): SettledTotals {
  const settled = bets.filter((b) => b.result !== "pending");

  let totalProfit = 0;
  let totalWagerSettled = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let voids = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let oddsSum = 0;
  let wagerSum = 0;

  for (const b of settled) {
    const profit = b.profit ?? 0;
    totalProfit += profit;
    totalWagerSettled += b.wager;
    oddsSum += b.odds;
    wagerSum += b.wager;

    if (b.result === "won") {
      wins++;
      if (profit > biggestWin) biggestWin = profit;
    } else if (b.result === "lost") {
      losses++;
      if (profit < biggestLoss) biggestLoss = profit;
    } else if (b.result === "push") {
      pushes++;
    } else if (b.result === "void") {
      voids++;
    }
  }

  const decided = wins + losses;
  const winRate = decided > 0 ? round2((wins / decided) * 100) : 0;
  const roi = totalWagerSettled > 0 ? round2((totalProfit / totalWagerSettled) * 100) : 0;
  const averageWager = bets.length > 0 ? round2(wagerSum / bets.length) : 0;
  const averageOdds = bets.length > 0 ? round2(oddsSum / bets.length) : 0;

  return {
    currentBankroll: round2(startingBankroll + totalProfit),
    totalProfit: round2(totalProfit),
    totalWagerSettled: round2(totalWagerSettled),
    roi,
    wins,
    losses,
    pushes,
    voids,
    winRate,
    averageWager,
    averageOdds,
    biggestWin: round2(biggestWin),
    biggestLoss: round2(biggestLoss),
  };
}

/** Filtered P/L and ROI for an arbitrary (filtered) subset of settled bets. */
export function computeFilteredPL(
  bets: Pick<Bet, "result" | "wager" | "profit">[]
): { filteredProfit: number; filteredRoi: number } {
  const settled = bets.filter((b) => b.result !== "pending");
  const profit = settled.reduce((sum, b) => sum + (b.profit ?? 0), 0);
  const wagered = settled.reduce((sum, b) => sum + b.wager, 0);
  return {
    filteredProfit: round2(profit),
    filteredRoi: wagered > 0 ? round2((profit / wagered) * 100) : 0,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
