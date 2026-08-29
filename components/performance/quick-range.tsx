"use client";

import clsx from "clsx";

export type QuickRange = "today" | "7d" | "30d" | "month" | "all";

const RANGES: { value: QuickRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "Current Month" },
  { value: "all", label: "All Time" },
];

export function QuickRangeTabs({ value, onChange }: { value: QuickRange; onChange: (v: QuickRange) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={clsx(
            "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm",
            value === r.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function isInQuickRange(isoDate: string, range: QuickRange): boolean {
  if (range === "all") return true;
  const date = new Date(isoDate);
  const now = new Date();

  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (range === "7d") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= cutoff;
  }
  if (range === "30d") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    return date >= cutoff;
  }
  if (range === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return true;
}
