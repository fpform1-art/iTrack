"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/shell/app-data-context";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatCard } from "@/components/ui/card";
import { BetRow } from "@/components/ui/bet-row";
import { applyBetFilters } from "@/lib/calc/filters";
import { computeSettledTotals, computeFilteredPL } from "@/lib/calc/betting";
import { formatCurrency, formatPercent } from "@/lib/format";
import { EMPTY_FILTERS, type BetFilters } from "@/types/database";

export function HomeClient() {
  const { bets, profile } = useAppData();
  const [filters, setFilters] = useState<BetFilters>(EMPTY_FILTERS);

  const hasActiveFilters =
    filters.sportsbooks.length > 0 ||
    filters.months.length > 0 ||
    filters.sports.length > 0 ||
    filters.leagues.length > 0;

  const filteredBets = useMemo(() => applyBetFilters(bets, filters), [bets, filters]);

  // Current Bankroll always reflects ALL of the user's settled bets, never
  // narrowed by the active filter — filters only affect the "Filtered P/L"
  // and "Filtered ROI" figures below, per the Home page spec.
  const trueTotals = useMemo(
    () => computeSettledTotals(bets, profile.starting_bankroll),
    [bets, profile.starting_bankroll]
  );

  const { filteredProfit, filteredRoi } = useMemo(
    () => computeFilteredPL(filteredBets),
    [filteredBets]
  );

  const sortedActivity = useMemo(
    () =>
      [...filteredBets].sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()),
    [filteredBets]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Home</h1>
        <p className="text-sm text-slate-500">Your bankroll and recent activity at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Current Bankroll"
          value={formatCurrency(trueTotals.currentBankroll, profile.currency)}
          hint="All settled bets"
        />
        <StatCard
          label={hasActiveFilters ? "Filtered P/L" : "Profit / Loss"}
          value={`${filteredProfit >= 0 ? "+" : ""}${formatCurrency(filteredProfit, profile.currency)}`}
          tone={filteredProfit > 0 ? "positive" : filteredProfit < 0 ? "negative" : "neutral"}
          hint={hasActiveFilters ? "Matches active filters" : "All time"}
        />
        <StatCard
          label={hasActiveFilters ? "Filtered ROI" : "ROI"}
          value={formatPercent(filteredRoi)}
          tone={filteredRoi > 0 ? "positive" : filteredRoi < 0 ? "negative" : "neutral"}
        />
      </div>

      <FilterBar bets={bets} filters={filters} onChange={setFilters} />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-700">
          Activity {hasActiveFilters && <span className="text-slate-400">({sortedActivity.length})</span>}
        </h2>
        {sortedActivity.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
            No bets match these filters yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedActivity.slice(0, 25).map((bet) => (
              <BetRow key={bet.id} bet={bet} currency={profile.currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
