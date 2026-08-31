import clsx from "clsx";
import type { Bet, Currency } from "@/types/database";
import { formatCurrency, formatOdds } from "@/lib/format";

const RESULT_STYLES: Record<Bet["result"], string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  push: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  void: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

const RESULT_LABELS: Record<Bet["result"], string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  push: "Push",
  void: "Void",
};

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
        RESULT_STYLES[result]
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
        bet.result === "pending"
          ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950"
          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{bet.match}</p>
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
