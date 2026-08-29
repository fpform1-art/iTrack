import type { Currency, FeedbackCategory } from "@/types/database";

export const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "EUR", "AUD", "NZD"];
export const FEEDBACK_CATEGORIES: FeedbackCategory[] = ["bug", "feature", "ux", "other"];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCurrency(currency: string): ValidationResult {
  if (!CURRENCIES.includes(currency as Currency)) return { valid: false, error: "Invalid currency." };
  return { valid: true };
}

/** Parses and validates an optional non-negative number field (e.g. default wager). */
export function validateOptionalNonNegativeNumber(
  raw: string,
  fieldLabel: string
): ValidationResult & { value: number | null } {
  if (!raw.trim()) return { valid: true, value: null };
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) {
    return { valid: false, error: `${fieldLabel} must be a positive number.`, value: null };
  }
  return { valid: true, value: n };
}

/** Parses and validates a required non-negative number field (e.g. starting bankroll). */
export function validateRequiredNonNegativeNumber(
  raw: string,
  fieldLabel: string
): ValidationResult & { value: number } {
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) {
    return { valid: false, error: `${fieldLabel} must be a positive number.`, value: 0 };
  }
  return { valid: true, value: n };
}

export function validateFeedbackCategory(category: string): ValidationResult {
  if (!FEEDBACK_CATEGORIES.includes(category as FeedbackCategory)) {
    return { valid: false, error: "Invalid category." };
  }
  return { valid: true };
}

export function validateFeedbackMessage(message: string): ValidationResult {
  const trimmed = message.trim();
  if (!trimmed) return { valid: false, error: "Please enter a message." };
  if (trimmed.length > 4000) return { valid: false, error: "Message is too long." };
  return { valid: true };
}

export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordStrength(password: string): ValidationResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return { valid: true };
}

export function validatePasswordsMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) return { valid: false, error: "Passwords do not match." };
  return { valid: true };
}

export function validateBetaAccessCode(
  requiredCode: string | undefined,
  suppliedCode: string
): ValidationResult {
  if (requiredCode && requiredCode.length > 0 && suppliedCode !== requiredCode) {
    return { valid: false, error: "Invalid beta access code." };
  }
  return { valid: true };
}
