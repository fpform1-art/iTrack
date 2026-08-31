"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/shell/app-data-context";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatCard } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { QuickRangeTabs, isInQuickRange, type QuickRange } from "@/components/performance/quick-range";
import { BreakdownTable } from "@/components/performance/breakdown-table";
import { DailyNetBarChart, DailyNetLineChart, BankrollChart } from "@/components/performance/charts";
import { applyBetFilters } from "@/lib/calc/filters";
import { breakdownBy, dailySeries, overallMetrics } from "@/lib/calc/performance";
import { formatCurrency, formatPercent, formatOdds } from "@/lib/format";
import { EMPTY_FILTERS, type BetFilters, type BetType } from "@/types/database";

const WHEN_PLACED_LABELS: Record<string, string> = {
  pregame: "Pregame",
  live_1h: "Live — 1st Half",
  halftime: "Halftime",
  live_2h: "Live — 2nd Half",
  live: "Live",
};

export function PerformanceClient() {
  const { bets, profile } = useAppData();
  const [range, setRange] = useState<QuickRange>("all");
  const [filters, setFilters] = useState<BetFilters>(EMPTY_FILTERS);
  const [betType, setBetType] = useState<BetType | "all">("all");

  const filteredBets = useMemo(() => {
    let result = applyBetFilters(bets, filters).filter((b) => isInQuickRange(b.placed_at, range));
    if (betType !== "all") result = result.filter((b) => b.bet_type === betType);
    return result;
  }, [bets, filters, range, betType]);

  const metrics = useMemo(
    () => overallMetrics(filteredBets, profile.starting_bankroll),
    [filteredBets, profile.starting_bankroll]
  );

  const series = useMemo(
    () => dailySeries(filteredBets, profile.starting_bankroll),
    [filteredBets, profile.starting_bankroll]
  );

  const bySport = useMemo(() => breakdownBy(filteredBets, (b) => b.sport), [filteredBets]);
  const byLeague = useMemo(() => breakdownBy(filteredBets, (b) => b.league), [filteredBets]);
  const bySportsbook = useMemo(() => breakdownBy(filteredBets, (b) => b.sportsbook), [filteredBets]);
  const byBetType = useMemo(
    () => breakdownBy(filteredBets, (b) => b.bet_type.toUpperCase()),
    [filteredBets]
  );
  const byWhenPlaced = useMemo(
    () => breakdownBy(filteredBets, (b) => WHEN_PLACED_LABELS[b.when_placed] ?? b.when_placed),
    [filteredBets]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Performance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Deep analytics on your betting history.</p>
      </div>

      <QuickRangeTabs value={range} onChange={setRange} />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={betType} onChange={(e) => setBetType(e.target.value as BetType | "all")} className="w-40">
          <option value="all">All bet types</option>
          <option value="single">Single</option>
          <option value="sgp">SGP</option>
          <option value="parlay">Parlay</option>
        </Select>
        <FilterBar bets={bets} filters={filters} onChange={setFilters} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Current Bankroll" value={formatCurrency(metrics.currentBankroll, profile.currency)} />
        <StatCard
          label="Profit / Loss"
          value={`${metrics.totalProfit >= 0 ? "+" : ""}${formatCurrency(metrics.totalProfit, profile.currency)}`}
          tone={metrics.totalProfit > 0 ? "positive" : metrics.totalProfit < 0 ? "negative" : "neutral"}
        />
        <StatCard
          label="ROI"
          value={formatPercent(metrics.roi)}
          tone={metrics.roi > 0 ? "positive" : metrics.roi < 0 ? "negative" : "neutral"}
        />
        <StatCard label="Win Rate" value={formatPercent(metrics.winRate)} />
        <StatCard
          label="Record"
          value={`${metrics.wins}-${metrics.losses}`}
          hint={`${metrics.wins}-${metrics.losses}-${metrics.pushes}-${metrics.voids} (W-L-P-V)`}
        />
        <StatCard label="Average Wager" value={formatCurrency(metrics.averageWager, profile.currency)} />
        <StatCard label="Average Odds" value={formatOdds(metrics.averageOdds)} />
        <StatCard label="Biggest Win" value={formatCurrency(metrics.biggestWin, profile.currency)} tone="positive" />
        <StatCard label="Biggest Loss" value={formatCurrency(metrics.biggestLoss, profile.currency)} tone="negative" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <DailyNetBarChart data={series} currency={profile.currency} />
        <DailyNetLineChart data={series} currency={profile.currency} />
        <BankrollChart data={series} currency={profile.currency} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <BreakdownTable title="By Sport" rows={bySport} currency={profile.currency} />
        <BreakdownTable title="By League" rows={byLeague} currency={profile.currency} />
        <BreakdownTable title="By Sportsbook" rows={bySportsbook} currency={profile.currency} />
        <BreakdownTable title="By Bet Type" rows={byBetType} currency={profile.currency} />
        <BreakdownTable title="By When Placed" rows={byWhenPlaced} currency={profile.currency} />
      </div>
    </div>
  );
}
