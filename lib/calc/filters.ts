import type { Bet, BetFilters } from "@/types/database";

/** "YYYY-MM" for a bet's placed_at, used by the month multi-select filter. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/**
 * Apply Home/My Bets/Performance multi-select filters to an in-memory list of
 * bets. Empty arrays mean "all" for that dimension (matches everything).
 * This runs entirely client-side once the page's bets are loaded, so
 * checkbox/select interactions don't trigger new network requests.
 */
export function applyBetFilters(bets: Bet[], filters: BetFilters): Bet[] {
  const {
    sportsbooks,
    months,
    sports,
    leagues,
    betTypes = [],
    status = "all",
    search = "",
  } = filters;

  const q = search.trim().toLowerCase();

  return bets.filter((b) => {
    if (sportsbooks.length > 0 && !sportsbooks.includes(b.sportsbook)) return false;
    if (months.length > 0 && !months.includes(monthKey(b.placed_at))) return false;
    if (sports.length > 0 && !sports.includes(b.sport)) return false;
    if (leagues.length > 0 && !leagues.includes(b.league)) return false;
    if (betTypes.length > 0 && !betTypes.includes(b.bet_type)) return false;

    if (status === "settled" && b.result === "pending") return false;
    if (status !== "all" && status !== "settled" && b.result !== status) return false;

    if (q) {
      const haystack = `${b.match} ${b.sport} ${b.league} ${b.sportsbook}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

/** Distinct option lists for building the multi-select controls from loaded bets. */
export function distinctFilterOptions(bets: Bet[]) {
  const sportsbooks = new Set<string>();
  const months = new Set<string>();
  const sports = new Set<string>();
  const leagues = new Set<string>();

  for (const b of bets) {
    sportsbooks.add(b.sportsbook);
    months.add(monthKey(b.placed_at));
    sports.add(b.sport);
    leagues.add(b.league);
  }

  return {
    sportsbooks: [...sportsbooks].sort(),
    months: [...months].sort().reverse(),
    sports: [...sports].sort(),
    leagues: [...leagues].sort(),
  };
}
