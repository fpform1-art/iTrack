"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/components/shell/app-data-context";
import { FilterBar } from "@/components/ui/filter-bar";
import { BetRow } from "@/components/ui/bet-row";
import { Input } from "@/components/ui/input";
import { BetDetailDrawer } from "@/components/my-bets/bet-detail-drawer";
import { applyBetFilters } from "@/lib/calc/filters";
import { EMPTY_FILTERS, type Bet, type BetFilters } from "@/types/database";
import clsx from "clsx";

type StatusTab = "all" | "pending" | "won" | "lost" | "push_void";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "push_void", label: "Push/Void" },
];

function matchesTab(bet: Bet, tab: StatusTab) {
  if (tab === "all") return true;
  if (tab === "push_void") return bet.result === "push" || bet.result === "void";
  return bet.result === tab;
}

export function MyBetsClient() {
  const { bets, profile } = useAppData();
  const [tab, setTab] = useState<StatusTab>("all");
  const [filters, setFilters] = useState<BetFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  const filtered = useMemo(() => {
    const withDropdownFilters = applyBetFilters(bets, { ...filters, search });
    return withDropdownFilters.filter((b) => matchesTab(b, tab));
  }, [bets, filters, search, tab]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()),
    [filtered]
  );

  const tabCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = { all: 0, pending: 0, won: 0, lost: 0, push_void: 0 };
    const dropdownFiltered = applyBetFilters(bets, { ...filters, search });
    for (const t of TABS) counts[t.value] = dropdownFiltered.filter((b) => matchesTab(b, t.value)).length;
    return counts;
  }, [bets, filters, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">My Bets</h1>
        <p className="text-sm text-slate-500">Every bet you&apos;ve logged, searchable and filterable.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm",
              tab === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label} <span className="text-slate-400">({tabCounts[t.value]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search team, league, sportsbook…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <FilterBar bets={bets} filters={filters} onChange={setFilters} />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          No bets match these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((bet) => (
            <BetRow key={bet.id} bet={bet} currency={profile.currency} onClick={() => setSelectedBet(bet)} />
          ))}
        </div>
      )}

      <BetDetailDrawer bet={selectedBet} onClose={() => setSelectedBet(null)} />
    </div>
  );
}
