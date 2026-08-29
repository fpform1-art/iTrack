// Centralized domain types mirroring the Supabase schema (supabase/migrations).
// Keep this the single source of truth for shapes used across the app.

export type Currency = "USD" | "CAD" | "GBP" | "EUR" | "AUD" | "NZD";

export type BetType = "single" | "sgp" | "parlay";

export type BetResult = "pending" | "won" | "lost" | "push" | "void";

export type LegResult = "pending" | "won" | "lost" | "push" | "void";

// Extensible on purpose — add values here and in the DB check constraint / enum.
export const WHEN_PLACED_OPTIONS = [
  "pregame",
  "live_1h",
  "halftime",
  "live_2h",
  "live",
] as const;
export type WhenPlaced = (typeof WHEN_PLACED_OPTIONS)[number];

export interface Profile {
  id: string; // references auth.users.id
  display_name: string | null;
  currency: Currency;
  default_sportsbook: string | null;
  default_wager: number | null;
  starting_bankroll: number;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  bet_type: BetType;
  placed_at: string; // timestamptz
  when_placed: WhenPlaced;
  sport: string;
  league: string;
  match: string;
  odds: number; // decimal odds, combined for sgp/parlay
  sportsbook: string;
  wager: number;
  result: BetResult;
  actual_return: number | null;
  profit: number | null;
  created_at: string;
  updated_at: string;
}

export interface BetLeg {
  id: string;
  bet_id: string;
  user_id: string;
  leg_order: number;
  sport: string;
  league: string;
  match: string;
  prop_type: string;
  prop: string;
  leg_odds: number | null;
  result: LegResult;
  created_at: string;
  updated_at: string;
}

export type FeedbackCategory = "bug" | "feature" | "ux" | "other";

export interface Feedback {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  message: string;
  created_at: string;
}

export interface BetWithLegs extends Bet {
  bet_legs: BetLeg[];
}

// ---- Filters shared by Home / My Bets / Performance ----
export interface BetFilters {
  sportsbooks: string[];
  months: string[]; // "YYYY-MM"
  sports: string[];
  leagues: string[];
  betTypes?: BetType[];
  status?: BetResult | "all" | "settled";
  search?: string;
}

export const EMPTY_FILTERS: BetFilters = {
  sportsbooks: [],
  months: [],
  sports: [],
  leagues: [],
  betTypes: [],
  status: "all",
  search: "",
};
