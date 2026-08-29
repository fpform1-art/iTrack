import { describe, it, expect } from "vitest";
import {
  validateCurrency,
  validateOptionalNonNegativeNumber,
  validateRequiredNonNegativeNumber,
  validateFeedbackCategory,
  validateFeedbackMessage,
  validatePasswordStrength,
  validatePasswordsMatch,
  validateBetaAccessCode,
} from "@/lib/calc/account-validation";

describe("validateCurrency (Settings)", () => {
  it("accepts all six supported currencies", () => {
    for (const c of ["USD", "CAD", "GBP", "EUR", "AUD", "NZD"]) {
      expect(validateCurrency(c).valid).toBe(true);
    }
  });

  it("rejects an unsupported currency", () => {
    const result = validateCurrency("JPY");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Invalid currency/);
  });
});

describe("validateOptionalNonNegativeNumber (Default Wager)", () => {
  it("treats an empty string as valid/null (field is optional)", () => {
    const result = validateOptionalNonNegativeNumber("", "Default wager");
    expect(result.valid).toBe(true);
    expect(result.value).toBeNull();
  });

  it("accepts a positive number", () => {
    const result = validateOptionalNonNegativeNumber("25.50", "Default wager");
    expect(result.valid).toBe(true);
    expect(result.value).toBe(25.5);
  });

  it("rejects a negative number", () => {
    const result = validateOptionalNonNegativeNumber("-10", "Default wager");
    expect(result.valid).toBe(false);
  });

  it("rejects a non-numeric value", () => {
    const result = validateOptionalNonNegativeNumber("abc", "Default wager");
    expect(result.valid).toBe(false);
  });
});

describe("validateRequiredNonNegativeNumber (Starting Bankroll)", () => {
  it("accepts zero and positive numbers", () => {
    expect(validateRequiredNonNegativeNumber("0", "Starting bankroll").valid).toBe(true);
    expect(validateRequiredNonNegativeNumber("1000", "Starting bankroll").valid).toBe(true);
  });

  it("rejects negative numbers", () => {
    expect(validateRequiredNonNegativeNumber("-1", "Starting bankroll").valid).toBe(false);
  });
});

describe("validateFeedbackCategory (Beta Feedback)", () => {
  it("accepts bug/feature/ux/other", () => {
    for (const c of ["bug", "feature", "ux", "other"]) {
      expect(validateFeedbackCategory(c).valid).toBe(true);
    }
  });

  it("rejects an unknown category", () => {
    expect(validateFeedbackCategory("complaint").valid).toBe(false);
  });
});

describe("validateFeedbackMessage (Beta Feedback)", () => {
  it("rejects an empty or whitespace-only message", () => {
    expect(validateFeedbackMessage("").valid).toBe(false);
    expect(validateFeedbackMessage("   ").valid).toBe(false);
  });

  it("accepts a normal message", () => {
    expect(validateFeedbackMessage("The Grade page is great!").valid).toBe(true);
  });

  it("rejects a message over 4000 characters", () => {
    const long = "a".repeat(4001);
    expect(validateFeedbackMessage(long).valid).toBe(false);
  });

  it("accepts a message at exactly 4000 characters", () => {
    const max = "a".repeat(4000);
    expect(validateFeedbackMessage(max).valid).toBe(true);
  });
});

describe("validatePasswordStrength (Auth)", () => {
  it("rejects passwords under 8 characters", () => {
    expect(validatePasswordStrength("short1").valid).toBe(false);
  });

  it("accepts passwords 8 characters or longer", () => {
    expect(validatePasswordStrength("longenough").valid).toBe(true);
  });
});

describe("validatePasswordsMatch (Auth)", () => {
  it("rejects mismatched passwords", () => {
    expect(validatePasswordsMatch("password1", "password2").valid).toBe(false);
  });

  it("accepts matching passwords", () => {
    expect(validatePasswordsMatch("password1", "password1").valid).toBe(true);
  });
});

describe("validateBetaAccessCode (Auth / optional BETA_ACCESS_CODE)", () => {
  it("allows any code (including none) when no code is configured", () => {
    expect(validateBetaAccessCode(undefined, "").valid).toBe(true);
    expect(validateBetaAccessCode("", "anything").valid).toBe(true);
  });

  it("requires an exact match when a code is configured", () => {
    expect(validateBetaAccessCode("SECRET123", "SECRET123").valid).toBe(true);
    expect(validateBetaAccessCode("SECRET123", "wrong").valid).toBe(false);
    expect(validateBetaAccessCode("SECRET123", "").valid).toBe(false);
  });
});
