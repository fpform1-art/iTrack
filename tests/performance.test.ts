import { describe, it, expect } from "vitest";
import { breakdownBy, dailySeries } from "@/lib/calc/performance";
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
    result: "won",
    actual_return: 200,
    profit: 100,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-01T12:00:00Z",
    ...overrides,
  };
}

describe("breakdownBy", () => {
  it("groups by an arbitrary key and computes profit/roi/win rate per group", () => {
    const bets = [
      mkBet({ sportsbook: "bet365", result: "won", profit: 100, wager: 100 }),
      mkBet({ sportsbook: "bet365", result: "lost", profit: -50, wager: 50 }),
      mkBet({ sportsbook: "FanDuel", result: "won", profit: 20, wager: 20 }),
    ];
    const rows = breakdownBy(bets, (b) => b.sportsbook);
    const bet365 = rows.find((r) => r.key === "bet365")!;
    expect(bet365.bets).toBe(2);
    expect(bet365.profit).toBe(50);
    expect(bet365.winRate).toBe(50);

    const fanduel = rows.find((r) => r.key === "FanDuel")!;
    expect(fanduel.profit).toBe(20);
    expect(fanduel.winRate).toBe(100);
  });

  it("excludes pending bets from profit/roi/winrate but still counts them", () => {
    const bets = [
      mkBet({ sport: "Soccer", result: "won", profit: 100, wager: 100 }),
      mkBet({ sport: "Soccer", result: "pending", profit: null, wager: 200 }),
    ];
    const rows = breakdownBy(bets, (b) => b.sport);
    expect(rows[0].bets).toBe(2);
    expect(rows[0].profit).toBe(100);
  });
});

describe("dailySeries", () => {
  it("builds a running bankroll series from settled bets only, ordered by date", () => {
    const bets = [
      mkBet({ placed_at: "2026-07-02T00:00:00Z", result: "won", profit: 50, wager: 50 }),
      mkBet({ placed_at: "2026-07-01T00:00:00Z", result: "lost", profit: -30, wager: 30 }),
      mkBet({ placed_at: "2026-07-01T00:00:00Z", result: "pending", profit: null, wager: 100 }),
    ];
    const series = dailySeries(bets, 1000);
    expect(series).toHaveLength(2);
    expect(series[0].date).toBe("2026-07-01");
    expect(series[0].net).toBe(-30);
    expect(series[0].bankroll).toBe(970);
    expect(series[1].date).toBe("2026-07-02");
    expect(series[1].net).toBe(50);
    expect(series[1].bankroll).toBe(1020);
  });

  it("aggregates multiple bets on the same day into one point", () => {
    const bets = [
      mkBet({ placed_at: "2026-07-01T08:00:00Z", result: "won", profit: 40, wager: 40 }),
      mkBet({ placed_at: "2026-07-01T18:00:00Z", result: "lost", profit: -10, wager: 10 }),
    ];
    const series = dailySeries(bets, 0);
    expect(series).toHaveLength(1);
    expect(series[0].net).toBe(30);
    expect(series[0].bankroll).toBe(30);
  });
});
