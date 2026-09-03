import type { BetResult } from "@/types/database";

export const RESULT_LABELS: Record<BetResult, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  push: "Push",
  void: "Void",
};

/** Small pill/badge treatment (background + text + border). */
export const RESULT_BADGE_STYLES: Record<BetResult, string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
  lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  push: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  void: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

/**
 * Subtle whole-card background/border/hover treatment matching a bet's
 * result — deliberately muted and professional, never saturated or
 * casino-style. Centralized here so every bet card across Home, My Bets,
 * and Grade (which all render the shared BetRow) stays visually
 * consistent, and so the palette only needs updating in one place.
 */
export const RESULT_CARD_STYLES: Record<BetResult, string> = {
  pending:
    "border-amber-200 bg-amber-50/40 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950",
  won: "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-950",
  lost: "border-red-200 bg-red-50/40 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:hover:bg-red-950",
  push: "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800",
  void: "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800",
};
