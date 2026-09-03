import { z } from "zod";
import { WHEN_PLACED_OPTIONS } from "@/types/database";

export const MIN_LEGS = 2;
export const MAX_LEGS = 12;

const oddsSchema = z
  .number({ error: "Odds must be a number" })
  .gt(1, "Odds must be greater than 1.00");

const legSchema = z.object({
  sport: z.string().min(1, "Sport is required"),
  league: z.string().min(1, "League is required"),
  match: z.string().min(1, "Match is required"),
  prop_type: z.string().min(1, "Prop type is required"),
  prop: z.string().min(1, "Prop is required"),
  leg_odds: oddsSchema.nullable().optional(),
});

export const singleBetSchema = z.object({
  bet_type: z.literal("single"),
  when_placed: z.enum(WHEN_PLACED_OPTIONS),
  sport: z.string().min(1),
  league: z.string().min(1),
  match: z.string().min(1),
  prop_type: z.string().min(1),
  prop: z.string().min(1),
  odds: oddsSchema,
  sportsbook: z.string().min(1),
  wager: z.number().positive("Wager must be greater than 0"),
});

export const multiLegBetSchema = z.object({
  bet_type: z.enum(["sgp", "parlay"]),
  when_placed: z.enum(WHEN_PLACED_OPTIONS),
  sportsbook: z.string().min(1),
  wager: z.number().positive("Wager must be greater than 0"),
  odds: oddsSchema, // combined odds
  legs: z.array(legSchema).min(MIN_LEGS, `A multi-leg bet needs at least ${MIN_LEGS} legs`).max(
    MAX_LEGS,
    `A multi-leg bet can have at most ${MAX_LEGS} legs`
  ),
});

export type SingleBetInput = z.infer<typeof singleBetSchema>;
export type MultiLegBetInput = z.infer<typeof multiLegBetSchema>;

export function validateLegCount(count: number): { valid: boolean; message?: string } {
  if (count < MIN_LEGS) return { valid: false, message: `Add at least ${MIN_LEGS} legs.` };
  if (count > MAX_LEGS) return { valid: false, message: `A bet can have at most ${MAX_LEGS} legs.` };
  return { valid: true };
}
