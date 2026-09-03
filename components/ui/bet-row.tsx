import clsx from "clsx";
import type { Bet, Currency } from "@/types/database";
import { formatCurrency, formatOdds } from "@/lib/format";
import { RESULT_LABELS, RESULT_BADGE_STYLES, RESULT_CARD_STYLES } from "@/lib/ui/result-styles";
import { MatchLabel } from "@/components/ui/match-label";

const BET_TYPE_LABELS: Record<Bet["bet_type"], string> = {
  single: "Single",
  sgp: "SGP",
  parlay: "Parlay",
};

export function ResultBadge({ result }: { result: Bet["result"] }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        RESULT_BADGE_STYLES[result]
      )}
    >
      {RESULT_LABELS[result]}
    </span>
  );
}

export function BetRow({
  bet,
  currency,
  onClick,
}: {
  bet: Bet;
  currency: Currency;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        RESULT_CARD_STYLES[bet.result]
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <MatchLabel match={bet.match} />
          <span className="hidden shrink-0 text-xs text-slate-400 dark:text-slate-500 sm:inline">
            {BET_TYPE_LABELS[bet.bet_type]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {bet.sport} • {bet.league} • {bet.sportsbook} • {new Date(bet.placed_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ResultBadge result={bet.result} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatCurrency(bet.wager, currency)} @ {formatOdds(bet.odds)}
        </p>
        {bet.profit != null && (
          <p
            className={clsx(
              "text-xs font-medium",
              bet.profit > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : bet.profit < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-400"
            )}
          >
            {bet.profit > 0 ? "+" : ""}
            {formatCurrency(bet.profit, currency)}
          </p>
        )}
      </div>
    </button>
  );
}
