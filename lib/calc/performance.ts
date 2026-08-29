import type { Bet } from "@/types/database";
import { computeSettledTotals, round2 } from "@/lib/calc/betting";

export interface BreakdownRow {
  key: string;
  bets: number;
  profit: number;
  roi: number;
  winRate: number;
}

/** Group settled bets by an arbitrary key (sport/league/sportsbook/bet_type/when_placed). */
export function breakdownBy(bets: Bet[], keyFn: (b: Bet) => string): BreakdownRow[] {
  const groups = new Map<string, Bet[]>();
  for (const b of bets) {
    const key = keyFn(b);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }

  const rows: BreakdownRow[] = [];
  for (const [key, groupBets] of groups) {
    const settled = groupBets.filter((b) => b.result !== "pending");
    const profit = round2(settled.reduce((sum, b) => sum + (b.profit ?? 0), 0));
    const wagered = settled.reduce((sum, b) => sum + b.wager, 0);
    const roi = wagered > 0 ? round2((profit / wagered) * 100) : 0;
    const wins = settled.filter((b) => b.result === "won").length;
    const losses = settled.filter((b) => b.result === "lost").length;
    const decided = wins + losses;
    const winRate = decided > 0 ? round2((wins / decided) * 100) : 0;

    rows.push({ key, bets: groupBets.length, profit, roi, winRate });
  }

  return rows.sort((a, b) => b.profit - a.profit);
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  net: number;
  bankroll: number;
}

/**
 * Daily net profit and running bankroll series for charts, built from
 * settled bets ordered by placed_at. `startingBankroll` anchors the series;
 * running bankroll only ever reflects the full history (never the active
 * filter), consistent with the Home page's Current Bankroll definition —
 * callers pass whichever bet set they want charted.
 */
export function dailySeries(bets: Bet[], startingBankroll: number): DailyPoint[] {
  const settled = bets
    .filter((b) => b.result !== "pending")
    .slice()
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());

  const byDate = new Map<string, number>();
  for (const b of settled) {
    const date = b.placed_at.slice(0, 10);
    byDate.set(date, round2((byDate.get(date) ?? 0) + (b.profit ?? 0)));
  }

  const dates = [...byDate.keys()].sort();
  let running = startingBankroll;
  const points: DailyPoint[] = [];
  for (const date of dates) {
    const net = byDate.get(date)!;
    running = round2(running + net);
    points.push({ date, net, bankroll: running });
  }
  return points;
}

export function overallMetrics(bets: Bet[], startingBankroll: number) {
  return computeSettledTotals(bets, startingBankroll);
}
