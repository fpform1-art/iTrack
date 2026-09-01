import type { BetResult, BetType, LegResult, WhenPlaced } from "@/types/database";

/** One of the three legacy Google Sheets tabs the old iTraxc tracker used. */
export type ImportSource = "Form Responses3" | "SGP Responses" | "Parlay Responses";

export const IMPORT_SOURCES: ImportSource[] = ["Form Responses3", "SGP Responses", "Parlay Responses"];

export interface ImportRowError {
  row: number; // 1-based row number in the uploaded CSV (header excluded)
  message: string;
}

export interface ParsedLeg {
  sport: string;
  league: string;
  match: string;
  /** Legacy field — no longer required at entry, kept for older exports. */
  prop_type: string | null;
  prop: string;
  leg_odds: number | null;
  result: LegResult;
}

export interface ParsedImportBet {
  row: number;
  bet_type: BetType;
  when_placed: WhenPlaced;
  placed_at: string; // ISO
  sport: string;
  league: string;
  match: string;
  odds: number;
  sportsbook: string;
  wager: number;
  result: BetResult;
  actual_return: number | null;
  // Single bets carry prop_type/prop directly; sgp/parlay carry legs.
  /** Legacy field — no longer required at entry, kept for older exports. */
  prop_type?: string | null;
  prop?: string;
  legs?: ParsedLeg[];
}

export interface ImportPreview {
  source: ImportSource;
  validRows: ParsedImportBet[];
  errors: ImportRowError[];
  totalRows: number;
}
