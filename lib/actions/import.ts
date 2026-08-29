"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveSettlement } from "@/lib/calc/betting";
import type { ParsedImportBet } from "@/lib/import/types";
import type { LegResult } from "@/types/database";

export interface CommitImportResult {
  error?: string;
  imported?: number;
  failed?: { row: number; message: string }[];
}

/**
 * Insert previously-validated rows (from the client-side CSV preview) into
 * the CURRENT session user's account only — user_id is never taken from the
 * uploaded file or the client payload.
 */
export async function commitImport(rows: ParsedImportBet[]): Promise<CommitImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  if (rows.length === 0) return { error: "Nothing to import." };
  if (rows.length > 2000) {
    return { error: "Please import in batches of 2000 rows or fewer." };
  }

  let imported = 0;
  const failed: { row: number; message: string }[] = [];

  for (const row of rows) {
    try {
      const { actualReturn, profit } = resolveSettlement(row.result, row.wager, row.odds, row.actual_return);

      const { data: bet, error: betError } = await supabase
        .from("bets")
        .insert({
          user_id: user.id,
          bet_type: row.bet_type,
          placed_at: row.placed_at,
          when_placed: row.when_placed,
          sport: row.sport,
          league: row.league,
          match: row.match,
          odds: row.odds,
          sportsbook: row.sportsbook,
          wager: row.wager,
          result: row.result,
          actual_return: actualReturn,
          profit,
        })
        .select("id")
        .single();

      if (betError || !bet) throw new Error(betError?.message || "Insert failed");

      if (row.bet_type === "single") {
        const { error: legError } = await supabase.from("bet_legs").insert({
          bet_id: bet.id,
          user_id: user.id,
          leg_order: 1,
          sport: row.sport,
          league: row.league,
          match: row.match,
          prop_type: row.prop_type ?? "",
          prop: row.prop ?? "",
          leg_odds: row.odds,
          result: row.result as LegResult,
        });
        if (legError) {
          await supabase.from("bets").delete().eq("id", bet.id);
          throw new Error(legError.message);
        }
      } else if (row.legs && row.legs.length > 0) {
        const legRows = row.legs.map((leg, idx) => ({
          bet_id: bet.id,
          user_id: user.id,
          leg_order: idx + 1,
          sport: leg.sport,
          league: leg.league,
          match: leg.match,
          prop_type: leg.prop_type,
          prop: leg.prop,
          leg_odds: leg.leg_odds,
          result: leg.result,
        }));
        const { error: legsError } = await supabase.from("bet_legs").insert(legRows);
        if (legsError) {
          await supabase.from("bets").delete().eq("id", bet.id);
          throw new Error(legsError.message);
        }
      }

      imported++;
    } catch (e) {
      failed.push({ row: row.row, message: e instanceof Error ? e.message : "Failed to import this row." });
    }
  }

  revalidatePath("/home");
  revalidatePath("/my-bets");
  revalidatePath("/grade");
  revalidatePath("/performance");

  return { imported, failed };
}
