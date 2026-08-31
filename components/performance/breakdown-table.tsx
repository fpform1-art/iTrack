import type { BreakdownRow } from "@/lib/calc/performance";
import type { Currency } from "@/types/database";
import { formatCurrency, formatPercent } from "@/lib/format";

export function BreakdownTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: BreakdownRow[];
  currency: Currency;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 dark:text-slate-500">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Bets</th>
              <th className="pb-2 font-medium">Profit</th>
              <th className="pb-2 font-medium">ROI</th>
              <th className="pb-2 font-medium">Win %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5 pr-2 font-medium text-slate-800 dark:text-slate-200">{row.key}</td>
                <td className="py-1.5 pr-2 text-slate-500 dark:text-slate-400">{row.bets}</td>
                <td
                  className={`py-1.5 pr-2 font-medium ${
                    row.profit > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : row.profit < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {row.profit > 0 ? "+" : ""}
                  {formatCurrency(row.profit, currency)}
                </td>
                <td className="py-1.5 pr-2 text-slate-500 dark:text-slate-400">{formatPercent(row.roi)}</td>
                <td className="py-1.5 text-slate-500 dark:text-slate-400">{formatPercent(row.winRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
