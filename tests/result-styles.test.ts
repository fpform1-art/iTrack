import { describe, it, expect } from "vitest";
import { RESULT_LABELS, RESULT_BADGE_STYLES, RESULT_CARD_STYLES } from "@/lib/ui/result-styles";
import type { BetResult } from "@/types/database";

const ALL_RESULTS: BetResult[] = ["pending", "won", "lost", "push", "void"];

describe("result-styles (centralized status styling)", () => {
  it("has a label for every possible bet result", () => {
    for (const result of ALL_RESULTS) {
      expect(RESULT_LABELS[result]).toBeTruthy();
    }
  });

  it("has a badge style for every possible bet result", () => {
    for (const result of ALL_RESULTS) {
      expect(RESULT_BADGE_STYLES[result]).toBeTruthy();
    }
  });

  it("has a whole-card style for every possible bet result", () => {
    for (const result of ALL_RESULTS) {
      expect(RESULT_CARD_STYLES[result]).toBeTruthy();
    }
  });

  it("every card style includes a dark-mode variant", () => {
    for (const result of ALL_RESULTS) {
      expect(RESULT_CARD_STYLES[result]).toMatch(/dark:/);
    }
  });

  it("every badge style includes a dark-mode variant", () => {
    for (const result of ALL_RESULTS) {
      expect(RESULT_BADGE_STYLES[result]).toMatch(/dark:/);
    }
  });

  it("won uses an emerald/green tint, distinct from lost's red tint", () => {
    expect(RESULT_CARD_STYLES.won).toMatch(/emerald/);
    expect(RESULT_CARD_STYLES.lost).toMatch(/red/);
    expect(RESULT_CARD_STYLES.won).not.toBe(RESULT_CARD_STYLES.lost);
  });

  it("pending uses an amber tint", () => {
    expect(RESULT_CARD_STYLES.pending).toMatch(/amber/);
  });

  it("push and void share the same slate/gray treatment (deliberately grouped)", () => {
    expect(RESULT_CARD_STYLES.push).toBe(RESULT_CARD_STYLES.void);
    expect(RESULT_CARD_STYLES.push).toMatch(/slate/);
  });

  it("avoids saturated casino-style colors (no raw red-500/green-500-class intensities)", () => {
    for (const result of ALL_RESULTS) {
      // The muted palette only ever uses the 50/100/200/300 (light) and
      // 800/900/950 (dark) shades — never the loud 400-600 mid-range.
      expect(RESULT_CARD_STYLES[result]).not.toMatch(/-(400|500|600)\b/);
    }
  });
});
