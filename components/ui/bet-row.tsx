import clsx from "clsx";
import type { Bet, Currency } from "@/types/database";
import { formatCurrency, formatOdds } from "@/lib/format";

const RESULT_STYLES: Record<Bet["result"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  push: "bg-slate-100 text-slate-600 border-slate-200",
  void: "bg-slate-100 text-slate-500 border-slate-200",
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
          ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{bet.match}</p>
          <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
            {BET_TYPE_LABELS[bet.bet_type]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {bet.sport} • {bet.league} • {bet.sportsbook} • {new Date(bet.placed_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ResultBadge result={bet.result} />
        <p className="text-xs text-slate-500">
          {formatCurrency(bet.wager, currency)} @ {formatOdds(bet.odds)}
        </p>
        {bet.profit != null && (
          <p
            className={clsx(
              "text-xs font-medium",
              bet.profit > 0 ? "text-emerald-600" : bet.profit < 0 ? "text-red-600" : "text-slate-500"
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
