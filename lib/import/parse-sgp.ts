import type { ImportPreview, ImportRowError, ParsedImportBet, ParsedLeg } from "@/lib/import/types";
import {
  getField,
  parseDateField,
  parseLegResultField,
  parseNumberField,
  parseResultField,
  parseWhenPlacedField,
  type RawRow,
} from "@/lib/import/normalize";
import { MAX_LEGS, MIN_LEGS } from "@/lib/calc/validation";

const SPORT_ALIASES = ["sport"];
const LEAGUE_ALIASES = ["league", "competition"];
const MATCH_ALIASES = ["match", "game", "event", "teams"];
const COMBINED_ODDS_ALIASES = ["combinedodds", "odds", "totalodds"];
const SPORTSBOOK_ALIASES = ["sportsbook", "book"];
const WAGER_ALIASES = ["wager", "stake", "amount"];
const RESULT_ALIASES = ["result", "outcome", "overallresult"];
const ACTUAL_RETURN_ALIASES = ["actualreturn", "return", "payout"];
const WHEN_PLACED_ALIASES = ["whenplaced", "timing"];
const DATE_ALIASES = ["timestamp", "dateplaced", "date", "placedat"];

/** Extracts up to 6 legs from "Leg N Prop Type" / "Leg N Prop" / "Leg N Odds" / "Leg N Result" style columns. */
function extractLegs(row: RawRow, sharedGame: { sport: string; league: string; match: string }): {
  legs: ParsedLeg[];
  problems: string[];
} {
  const problems: string[] = [];
  const legs: ParsedLeg[] = [];

  for (let n = 1; n <= MAX_LEGS; n++) {
    const propType = getField(row, [`leg${n}proptype`, `leg${n}type`]);
    const prop = getField(row, [`leg${n}prop`, `leg${n}selection`, `leg${n}pick`]);
    const legOddsRaw = getField(row, [`leg${n}odds`]);
    const legResultRaw = getField(row, [`leg${n}result`]);

    if (!propType && !prop) continue; // leg N not present in this row

    if (!propType) problems.push(`Leg ${n}: missing Prop Type`);
    if (!prop) problems.push(`Leg ${n}: missing Prop`);

    const legOdds = legOddsRaw ? parseNumberField(legOddsRaw) : null;
    if (legOddsRaw && (legOdds === null || !(legOdds > 1))) {
      problems.push(`Leg ${n}: odds must be greater than 1.00 if provided`);
    }

    const legResult = parseLegResultField(legResultRaw);
    if (legResult === null) problems.push(`Leg ${n}: unrecognized result value`);

    legs.push({
      sport: sharedGame.sport,
      league: sharedGame.league,
      match: sharedGame.match,
      prop_type: propType ?? "",
      prop: prop ?? "",
      leg_odds: legOdds,
      result: legResult ?? "pending",
    });
  }

  if (legs.length < MIN_LEGS) problems.push(`An SGP needs at least ${MIN_LEGS} legs — found ${legs.length}`);

  return { legs, problems };
}

export function parseSgpRows(rows: RawRow[]): ImportPreview {
  const validRows: ParsedImportBet[] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const problems: string[] = [];

    const sport = getField(row, SPORT_ALIASES);
    const league = getField(row, LEAGUE_ALIASES);
    const match = getField(row, MATCH_ALIASES);
    const sportsbook = getField(row, SPORTSBOOK_ALIASES);
    const combinedOdds = parseNumberField(getField(row, COMBINED_ODDS_ALIASES));
    const wager = parseNumberField(getField(row, WAGER_ALIASES));
    const result = parseResultField(getField(row, RESULT_ALIASES));
    const actualReturn = parseNumberField(getField(row, ACTUAL_RETURN_ALIASES));
    const whenPlaced = parseWhenPlacedField(getField(row, WHEN_PLACED_ALIASES));
    const placedAt = parseDateField(getField(row, DATE_ALIASES)) ?? new Date().toISOString();

    if (!sport) problems.push("Missing Sport");
    if (!league) problems.push("Missing League");
    if (!match) problems.push("Missing Match");
    if (!sportsbook) problems.push("Missing Sportsbook");
    if (combinedOdds === null || !(combinedOdds > 1)) problems.push("Combined Odds must be greater than 1.00");
    if (wager === null || !(wager > 0)) problems.push("Wager must be a positive number");
    if (result === null) problems.push("Unrecognized Result value");

    const { legs, problems: legProblems } = extractLegs(row, {
      sport: sport ?? "",
      league: league ?? "",
      match: match ?? "",
    });
    problems.push(...legProblems);

    if (problems.length > 0) {
      errors.push({ row: rowNum, message: problems.join("; ") });
      return;
    }

    validRows.push({
      row: rowNum,
      bet_type: "sgp",
      when_placed: whenPlaced,
      placed_at: placedAt,
      sport: sport!,
      league: league!,
      match: match!,
      odds: combinedOdds!,
      sportsbook: sportsbook!,
      wager: wager!,
      result: result!,
      actual_return: result === "pending" ? null : actualReturn,
      legs,
    });
  });

  return { source: "SGP Responses", validRows, errors, totalRows: rows.length };
}
