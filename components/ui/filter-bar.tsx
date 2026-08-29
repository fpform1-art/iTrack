"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import type { Bet, BetFilters } from "@/types/database";
import { distinctFilterOptions, monthKey } from "@/lib/calc/filters";

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function FilterBar({
  bets,
  filters,
  onChange,
}: {
  bets: Bet[];
  filters: BetFilters;
  onChange: (f: BetFilters) => void;
}) {
  const options = distinctFilterOptions(bets);
  const hasActiveFilters =
    filters.sportsbooks.length > 0 ||
    filters.months.length > 0 ||
    filters.sports.length > 0 ||
    filters.leagues.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect
        label="Sportsbooks"
        options={options.sportsbooks}
        selected={filters.sportsbooks}
        onChange={(v) => onChange({ ...filters, sportsbooks: v })}
      />
      <MultiSelect
        label="Months"
        options={options.months.map((m) => ({ value: m, label: monthLabel(m) }))}
        selected={filters.months}
        onChange={(v) => onChange({ ...filters, months: v })}
      />
      <MultiSelect
        label="Sports"
        options={options.sports}
        selected={filters.sports}
        onChange={(v) => onChange({ ...filters, sports: v })}
      />
      <MultiSelect
        label="Leagues"
        options={options.leagues}
        selected={filters.leagues}
        onChange={(v) => onChange({ ...filters, leagues: v })}
      />
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ ...filters, sportsbooks: [], months: [], sports: [], leagues: [] })
          }
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export { monthKey, monthLabel };
