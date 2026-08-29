import type { BetResult, LegResult, WhenPlaced } from "@/types/database";
import { WHEN_PLACED_OPTIONS } from "@/types/database";

export type RawRow = Record<string, string>;

/** Case/whitespace/punctuation-insensitive header lookup, tolerant of the
 * old sheet's exact column naming, which we don't fully control. */
export function getField(row: RawRow, aliases: string[]): string | undefined {
  const normalizedRow = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    normalizedRow.set(normalizeHeader(key), value);
  }
  for (const alias of aliases) {
    const value = normalizedRow.get(normalizeHeader(alias));
    if (value !== undefined && value.trim() !== "") return value.trim();
  }
  return undefined;
}

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseNumberField(value: string | undefined): number | null {
  if (value === undefined) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

const RESULT_ALIASES: Record<string, BetResult> = {
  win: "won",
  won: "won",
  w: "won",
  loss: "lost",
  lost: "lost",
  l: "lost",
  push: "push",
  p: "push",
  void: "void",
  v: "void",
  cancelled: "void",
  canceled: "void",
  pending: "pending",
  open: "pending",
  "": "pending",
};

export function parseResultField(value: string | undefined): BetResult | null {
  if (value === undefined) return "pending";
  const key = value.trim().toLowerCase();
  const result = RESULT_ALIASES[key];
  return result ?? null;
}

export function parseLegResultField(value: string | undefined): LegResult | null {
  return parseResultField(value) as LegResult | null;
}

const WHEN_PLACED_ALIASES: Record<string, WhenPlaced> = {
  pregame: "pregame",
  pre: "pregame",
  "pre-game": "pregame",
  "live1h": "live_1h",
  "live 1h": "live_1h",
  "1sthalf": "live_1h",
  halftime: "halftime",
  ht: "halftime",
  "live2h": "live_2h",
  "live 2h": "live_2h",
  "2ndhalf": "live_2h",
  live: "live",
  "": "pregame",
};

export function parseWhenPlacedField(value: string | undefined): WhenPlaced {
  if (value === undefined) return "pregame";
  const key = value.trim().toLowerCase();
  const mapped = WHEN_PLACED_ALIASES[key];
  if (mapped) return mapped;
  // Fall back to a direct match against the canonical enum values.
  const direct = WHEN_PLACED_OPTIONS.find((o) => o === key.replace(/\s+/g, "_"));
  return direct ?? "pregame";
}

/** Accepts common date formats from Sheets/Apps Script timestamp exports. */
export function parseDateField(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
