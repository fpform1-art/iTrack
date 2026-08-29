"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateBetaAccessCode,
  validatePasswordStrength,
  validatePasswordsMatch,
} from "@/lib/calc/account-validation";

export interface ActionState {
  error?: string;
  success?: string;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function signInWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/home");
}

export async function signUpWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const accessCode = String(formData.get("accessCode") || "");

  if (!email || !password) return { error: "Email and password are required." };

  const strengthCheck = validatePasswordStrength(password);
  if (!strengthCheck.valid) return { error: strengthCheck.error };

  const matchCheck = validatePasswordsMatch(password, confirmPassword);
  if (!matchCheck.valid) return { error: matchCheck.error };

  const requiredCode = process.env.BETA_ACCESS_CODE;
  const codeCheck = validateBetaAccessCode(requiredCode, accessCode);
  if (!codeCheck.valid) return { error: codeCheck.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl()}/auth/callback` },
  });

  if (error) return { error: error.message };

  return {
    success:
      "Account created. Check your email to confirm your address, then log in.",
  };
}

export async function signInWithMagicLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl()}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: "Magic link sent — check your email." };
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password/confirm`,
  });

  if (error) return { error: error.message };
  return { success: "Password reset email sent — check your inbox." };
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const strengthCheck = validatePasswordStrength(password);
  if (!strengthCheck.valid) return { error: strengthCheck.error };

  const matchCheck = validatePasswordsMatch(password, confirmPassword);
  if (!matchCheck.valid) return { error: matchCheck.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
