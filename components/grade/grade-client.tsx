"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/shell/app-data-context";
import { FilterBar } from "@/components/ui/filter-bar";
import { BetRow } from "@/components/ui/bet-row";
import { Input, Select } from "@/components/ui/input";
import { BetDetailDrawer } from "@/components/my-bets/bet-detail-drawer";
import { applyBetFilters } from "@/lib/calc/filters";
import { EMPTY_FILTERS, type Bet, type BetFilters, type BetType } from "@/types/database";

export function GradeClient() {
  const { bets, profile } = useAppData();
  const [filters, setFilters] = useState<BetFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [betType, setBetType] = useState<BetType | "all">("all");
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  const pending = useMemo(() => {
    let result = applyBetFilters(bets, { ...filters, search }).filter((b) => b.result === "pending");
    if (betType !== "all") result = result.filter((b) => b.bet_type === betType);
    // Oldest pending first, so unfinished bets can be cleared efficiently.
    return result.sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());
  }, [bets, filters, search, betType]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Grade</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pending.length} bet{pending.length === 1 ? "" : "s"} waiting to be graded — oldest first.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={betType} onChange={(e) => setBetType(e.target.value as BetType | "all")} className="w-40">
          <option value="all">All bet types</option>
          <option value="single">Single</option>
          <option value="sgp">SGP</option>
          <option value="parlay">Parlay</option>
        </Select>
        <FilterBar bets={bets} filters={filters} onChange={setFilters} />
      </div>

      {pending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          You&apos;re all caught up — no pending bets to grade.
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((bet) => (
            <BetRow key={bet.id} bet={bet} currency={profile.currency} onClick={() => setSelectedBet(bet)} />
          ))}
        </div>
      )}

      <BetDetailDrawer bet={selectedBet} onClose={() => setSelectedBet(null)} />
    </div>
  );
}
