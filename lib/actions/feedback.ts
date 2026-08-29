"use server";

import { createClient } from "@/lib/supabase/server";
import type { FeedbackCategory } from "@/types/database";
import type { ActionState } from "@/lib/actions/auth";
import { validateFeedbackCategory, validateFeedbackMessage } from "@/lib/calc/account-validation";

export async function submitFeedback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const category = String(formData.get("category") || "other") as FeedbackCategory;
  const message = String(formData.get("message") || "").trim();

  const categoryCheck = validateFeedbackCategory(category);
  if (!categoryCheck.valid) return { error: categoryCheck.error };

  const messageCheck = validateFeedbackMessage(message);
  if (!messageCheck.valid) return { error: messageCheck.error };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category,
    message,
  });

  if (error) return { error: error.message };
  return { success: "Thanks — your feedback was submitted." };
}
