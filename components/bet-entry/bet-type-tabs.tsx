import clsx from "clsx";
import type { BetType } from "@/types/database";

const TABS: { value: BetType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "sgp", label: "Same Game Parlay" },
  { value: "parlay", label: "Parlay" },
];

export function BetTypeTabs({ value, onChange }: { value: BetType; onChange: (v: BetType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            "rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
            value === tab.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
