"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  computeProfit,
  suggestOverallResult,
  resolveSettlement,
  areLegsLocked,
} from "@/lib/calc/betting";
import type { BetResult, BetType, LegResult, WhenPlaced } from "@/types/database";

export interface ActionResult {
  error?: string;
  success?: boolean;
  betId?: string;
}

export interface NewLegInput {
  sport: string;
  league: string;
  match: string;
  /** Legacy field, no longer collected at entry — kept for backward
   * compatibility with existing data and CSV imports of old exports. */
  prop_type?: string | null;
  prop: string;
  leg_odds?: number | null;
}

export interface NewBetInput {
  bet_type: BetType;
  when_placed: WhenPlaced;
  sportsbook: string;
  wager: number;
  odds: number; // combined for sgp/parlay
  sport?: string; // required for single, and for sgp (single game)
  league?: string;
  match?: string;
  /** Legacy field, no longer collected at entry — kept for backward
   * compatibility with existing data and CSV imports of old exports. */
  prop_type?: string | null; // single only
  prop?: string; // single only
  legs?: NewLegInput[]; // sgp/parlay only
  placed_at?: string; // ISO — defaults to now
}

function validateOdds(odds: number) {
  if (!(odds > 1)) throw new Error("Odds must be greater than 1.00.");
}

/** Creates a bet (and its legs for sgp/parlay) owned by the current session user. */
export async function createBet(input: NewBetInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  try {
    if (!(input.wager > 0)) throw new Error("Wager must be greater than 0.");
    validateOdds(input.odds);

    if (input.bet_type === "single") {
      if (!input.sport || !input.league || !input.match || !input.prop) {
        throw new Error("All single-bet fields are required.");
      }
    } else {
      const legCount = input.legs?.length ?? 0;
      if (legCount < 2 || legCount > 6) {
        throw new Error("A multi-leg bet needs between 2 and 6 legs.");
      }
      for (const leg of input.legs!) {
        if (!leg.sport || !leg.league || !leg.match || !leg.prop) {
          throw new Error("All leg fields are required.");
        }
        if (leg.leg_odds != null) validateOdds(leg.leg_odds);
      }
      if (input.bet_type === "sgp" && (!input.sport || !input.league || !input.match)) {
        throw new Error("SGP requires a sport, league, and match.");
      }
    }

    // user_id is NEVER taken from the client — always the session's user id.
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .insert({
        user_id: user.id,
        bet_type: input.bet_type,
        placed_at: input.placed_at ?? new Date().toISOString(),
        when_placed: input.when_placed,
        sport: input.bet_type === "single" ? input.sport! : input.sport || input.legs![0].sport,
        league: input.bet_type === "single" ? input.league! : input.league || input.legs![0].league,
        match: input.bet_type === "single" ? input.match! : input.match || input.legs![0].match,
        odds: input.odds,
        sportsbook: input.sportsbook,
        wager: input.wager,
        result: "pending",
      })
      .select("*")
      .single();

    if (betError || !bet) throw new Error(betError?.message || "Failed to create bet.");

    if (input.bet_type !== "single" && input.legs) {
      const legRows = input.legs.map((leg, idx) => ({
        bet_id: bet.id,
        user_id: user.id,
        leg_order: idx + 1,
        sport: leg.sport,
        league: leg.league,
        match: leg.match,
        prop_type: leg.prop_type ?? null,
        prop: leg.prop,
        leg_odds: leg.leg_odds ?? null,
        result: "pending" as LegResult,
      }));

      const { error: legsError } = await supabase.from("bet_legs").insert(legRows);
      if (legsError) {
        // Roll back the parent bet so we don't leave an orphaned/legless multi-bet.
        await supabase.from("bets").delete().eq("id", bet.id);
        throw new Error(legsError.message);
      }
    } else if (input.bet_type === "single") {
      // Store prop details for singles as a synthetic single leg-less bet —
      // prop/prop_type live only conceptually here; for singles we keep them
      // out of bet_legs (schema has no columns on bets for prop fields, so we
      // fold prop into `match` display via a single leg row for consistency
      // and easy editing). prop_type is legacy/optional — no longer
      // collected at entry, kept for backward compatibility.
      const { error: legError } = await supabase.from("bet_legs").insert({
        bet_id: bet.id,
        user_id: user.id,
        leg_order: 1,
        sport: input.sport!,
        league: input.league!,
        match: input.match!,
        prop_type: input.prop_type ?? null,
        prop: input.prop!,
        leg_odds: input.odds,
        result: "pending" as LegResult,
      });
      if (legError) {
        await supabase.from("bets").delete().eq("id", bet.id);
        throw new Error(legError.message);
      }
    }

    revalidatePath("/home");
    revalidatePath("/my-bets");
    revalidatePath("/grade");
    revalidatePath("/performance");

    return { success: true, betId: bet.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create bet." };
  }
}

export interface UpdateBetInput {
  betId: string;
  wager?: number;
  odds?: number;
  sportsbook?: string;
  when_placed?: WhenPlaced;
  sport?: string;
  league?: string;
  match?: string;
  result?: BetResult;
  actual_return?: number | null;
}

/** Edit bet-level fields. Ownership is enforced by RLS (auth.uid() = user_id). */
export async function updateBet(input: UpdateBetInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  try {
    if (input.odds != null) validateOdds(input.odds);
    if (input.wager != null && !(input.wager > 0)) throw new Error("Wager must be greater than 0.");

    const patch: Record<string, unknown> = {};
    if (input.wager != null) patch.wager = input.wager;
    if (input.odds != null) patch.odds = input.odds;
    if (input.sportsbook != null) patch.sportsbook = input.sportsbook;
    if (input.when_placed != null) patch.when_placed = input.when_placed;
    if (input.sport != null) patch.sport = input.sport;
    if (input.league != null) patch.league = input.league;
    if (input.match != null) patch.match = input.match;

    if (input.result != null) {
      const wager = input.wager ?? (await getWager(supabase, input.betId));
      const odds = input.odds ?? (await getOdds(supabase, input.betId));
      const { actualReturn, profit } = resolveSettlement(input.result, wager, odds, input.actual_return);
      patch.result = input.result;
      patch.actual_return = actualReturn;
      patch.profit = profit;
    } else if (input.actual_return !== undefined) {
      const wager = input.wager ?? (await getWager(supabase, input.betId));
      const result = await getResult(supabase, input.betId);
      patch.actual_return = input.actual_return;
      patch.profit = computeProfit(result, wager, input.actual_return);
    }

    const { error } = await supabase.from("bets").update(patch).eq("id", input.betId);
    if (error) throw new Error(error.message);

    revalidatePath("/home");
    revalidatePath("/my-bets");
    revalidatePath("/grade");
    revalidatePath("/performance");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update bet." };
  }
}

export async function deleteBet(betId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase.from("bets").delete().eq("id", betId);
  if (error) return { error: error.message };

  revalidatePath("/home");
  revalidatePath("/my-bets");
  revalidatePath("/grade");
  revalidatePath("/performance");
  return { success: true };
}

export interface LegUpdate {
  legId: string;
  result?: LegResult;
  sport?: string;
  league?: string;
  match?: string;
  prop_type?: string;
  prop?: string;
  leg_odds?: number | null;
}

/**
 * Grade or edit one or more legs of a bet, then recompute + persist the
 * suggested overall result/return/profit (still overridable by the caller
 * via updateBet afterwards).
 */
export async function updateLegsAndSuggestOverall(
  betId: string,
  legUpdates: LegUpdate[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  try {
    for (const lu of legUpdates) {
      if (lu.leg_odds != null) validateOdds(lu.leg_odds);
      const patch: Record<string, unknown> = {};
      if (lu.result != null) patch.result = lu.result;
      if (lu.sport != null) patch.sport = lu.sport;
      if (lu.league != null) patch.league = lu.league;
      if (lu.match != null) patch.match = lu.match;
      if (lu.prop_type != null) patch.prop_type = lu.prop_type;
      if (lu.prop != null) patch.prop = lu.prop;
      if (lu.leg_odds !== undefined) patch.leg_odds = lu.leg_odds;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from("bet_legs").update(patch).eq("id", lu.legId);
        if (error) throw new Error(error.message);
      }
    }

    const { data: legs, error: legsError } = await supabase
      .from("bet_legs")
      .select("result")
      .eq("bet_id", betId);
    if (legsError) throw new Error(legsError.message);

    const legResults = (legs ?? []).map((l) => l.result as LegResult);
    const isSingleBetInternalLeg = legResults.length === 1;

    if (!isSingleBetInternalLeg) {
      const suggested = suggestOverallResult(legResults);
      const wager = await getWager(supabase, betId);
      const odds = await getOdds(supabase, betId);
      const { actualReturn, profit } = resolveSettlement(suggested, wager, odds);

      const { error: betUpdateError } = await supabase
        .from("bets")
        .update({ result: suggested, actual_return: actualReturn, profit })
        .eq("id", betId);
      if (betUpdateError) throw new Error(betUpdateError.message);
    }

    revalidatePath("/home");
    revalidatePath("/my-bets");
    revalidatePath("/grade");
    revalidatePath("/performance");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to grade bet." };
  }
}

/**
 * Add a leg to a still-pending multi-leg bet (blocked once grading has begun
 * — enforced here in addition to the UI, since server actions are the real
 * trust boundary).
 */
export async function addLeg(betId: string, leg: NewLegInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  try {
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .select("result")
      .eq("id", betId)
      .single();
    if (betError || !bet) throw new Error("Bet not found.");

    const { data: legs, error: legsError } = await supabase
      .from("bet_legs")
      .select("id, result")
      .eq("bet_id", betId);
    if (legsError) throw new Error(legsError.message);

    const legResults = (legs ?? []).map((l) => l.result as LegResult);
    if (areLegsLocked(bet.result as BetResult, legResults)) {
      throw new Error("Legs are locked once grading has begun.");
    }
    if (legResults.length >= 6) throw new Error("A bet can have at most 6 legs.");
    if (leg.leg_odds != null) validateOdds(leg.leg_odds);

    const { error } = await supabase.from("bet_legs").insert({
      bet_id: betId,
      user_id: user.id,
      leg_order: legResults.length + 1,
      sport: leg.sport,
      league: leg.league,
      match: leg.match,
      prop_type: leg.prop_type ?? null,
      prop: leg.prop,
      leg_odds: leg.leg_odds ?? null,
      result: "pending" as LegResult,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/my-bets");
    revalidatePath("/grade");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add leg." };
  }
}

export async function removeLeg(betId: string, legId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  try {
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .select("result")
      .eq("id", betId)
      .single();
    if (betError || !bet) throw new Error("Bet not found.");

    const { data: legs, error: legsError } = await supabase
      .from("bet_legs")
      .select("id, result")
      .eq("bet_id", betId);
    if (legsError) throw new Error(legsError.message);

    const legResults = (legs ?? []).map((l) => l.result as LegResult);
    if (areLegsLocked(bet.result as BetResult, legResults)) {
      throw new Error("Legs are locked once grading has begun.");
    }
    if (legResults.length <= 2) throw new Error("A multi-leg bet needs at least 2 legs.");

    const { error } = await supabase.from("bet_legs").delete().eq("id", legId);
    if (error) throw new Error(error.message);

    revalidatePath("/my-bets");
    revalidatePath("/grade");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove leg." };
  }
}

// ---- small helpers ----
async function getWager(supabase: Awaited<ReturnType<typeof createClient>>, betId: string) {
  const { data } = await supabase.from("bets").select("wager").eq("id", betId).single();
  return data?.wager ?? 0;
}
async function getOdds(supabase: Awaited<ReturnType<typeof createClient>>, betId: string) {
  const { data } = await supabase.from("bets").select("odds").eq("id", betId).single();
  return data?.odds ?? 1.01;
}
async function getResult(supabase: Awaited<ReturnType<typeof createClient>>, betId: string) {
  const { data } = await supabase.from("bets").select("result").eq("id", betId).single();
  return (data?.result ?? "pending") as BetResult;
}
