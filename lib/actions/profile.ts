"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Currency } from "@/types/database";
import type { ActionState } from "@/lib/actions/auth";
import {
  validateCurrency,
  validateOptionalNonNegativeNumber,
  validateRequiredNonNegativeNumber,
} from "@/lib/calc/account-validation";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const displayName = String(formData.get("display_name") || "").trim();
  const currency = String(formData.get("currency") || "USD") as Currency;
  const defaultSportsbook = String(formData.get("default_sportsbook") || "").trim();
  const defaultWagerRaw = String(formData.get("default_wager") || "");
  const startingBankrollRaw = String(formData.get("starting_bankroll") || "0");

  const currencyCheck = validateCurrency(currency);
  if (!currencyCheck.valid) return { error: currencyCheck.error };

  const wagerCheck = validateOptionalNonNegativeNumber(defaultWagerRaw, "Default wager");
  if (!wagerCheck.valid) return { error: wagerCheck.error };

  const bankrollCheck = validateRequiredNonNegativeNumber(startingBankrollRaw, "Starting bankroll");
  if (!bankrollCheck.valid) return { error: bankrollCheck.error };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      currency,
      default_sportsbook: defaultSportsbook || null,
      default_wager: wagerCheck.value,
      starting_bankroll: bankrollCheck.value,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/performance");
  return { success: "Settings saved." };
}
