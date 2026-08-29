import { createClient } from "@/lib/supabase/server";
import type { Bet, BetLeg, Profile } from "@/types/database";

/** Fetch the signed-in user's profile. Assumes middleware already enforced auth. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return null;
  return data as Profile;
}

/**
 * Fetch all of the signed-in user's bets (RLS-scoped — the query can only
 * ever return rows owned by auth.uid()). Home/My Bets/Performance then
 * filter this client-side, per the "load once, filter fast" requirement.
 */
export async function getAllBets(): Promise<Bet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .order("placed_at", { ascending: false });

  if (error) throw new Error(`Failed to load bets: ${error.message}`);
  return (data ?? []) as Bet[];
}

export async function getBetWithLegs(betId: string): Promise<{ bet: Bet; legs: BetLeg[] } | null> {
  const supabase = await createClient();
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("*")
    .eq("id", betId)
    .single();

  if (betError || !bet) return null;

  const { data: legs, error: legsError } = await supabase
    .from("bet_legs")
    .select("*")
    .eq("bet_id", betId)
    .order("leg_order", { ascending: true });

  if (legsError) throw new Error(`Failed to load legs: ${legsError.message}`);

  return { bet: bet as Bet, legs: (legs ?? []) as BetLeg[] };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
