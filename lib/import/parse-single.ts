import type { ImportPreview, ImportRowError, ParsedImportBet } from "@/lib/import/types";
import {
  getField,
  parseDateField,
  parseNumberField,
  parseResultField,
  parseWhenPlacedField,
  type RawRow,
} from "@/lib/import/normalize";

const SPORT_ALIASES = ["sport"];
const LEAGUE_ALIASES = ["league", "competition"];
const MATCH_ALIASES = ["match", "game", "event", "teams"];
const PROP_TYPE_ALIASES = ["proptype", "bettype", "market"];
const PROP_ALIASES = ["prop", "selection", "pick"];
const ODDS_ALIASES = ["odds", "decimalodds"];
const SPORTSBOOK_ALIASES = ["sportsbook", "book"];
const WAGER_ALIASES = ["wager", "stake", "amount"];
const RESULT_ALIASES = ["result", "outcome"];
const ACTUAL_RETURN_ALIASES = ["actualreturn", "return", "payout"];
const WHEN_PLACED_ALIASES = ["whenplaced", "timing"];
const DATE_ALIASES = ["timestamp", "whenplaced", "dateplaced", "date", "placedat"];

export function parseSingleRows(rows: RawRow[]): ImportPreview {
  const validRows: ParsedImportBet[] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const problems: string[] = [];

    const sport = getField(row, SPORT_ALIASES);
    const league = getField(row, LEAGUE_ALIASES);
    const match = getField(row, MATCH_ALIASES);
    const propType = getField(row, PROP_TYPE_ALIASES);
    const prop = getField(row, PROP_ALIASES);
    const sportsbook = getField(row, SPORTSBOOK_ALIASES);
    const odds = parseNumberField(getField(row, ODDS_ALIASES));
    const wager = parseNumberField(getField(row, WAGER_ALIASES));
    const result = parseResultField(getField(row, RESULT_ALIASES));
    const actualReturn = parseNumberField(getField(row, ACTUAL_RETURN_ALIASES));
    const whenPlaced = parseWhenPlacedField(getField(row, WHEN_PLACED_ALIASES));
    const placedAt = parseDateField(getField(row, DATE_ALIASES)) ?? new Date().toISOString();

    if (!sport) problems.push("Missing Sport");
    if (!league) problems.push("Missing League");
    if (!match) problems.push("Missing Match");
    if (!propType) problems.push("Missing Prop Type");
    if (!prop) problems.push("Missing Prop");
    if (!sportsbook) problems.push("Missing Sportsbook");
    if (odds === null || !(odds > 1)) problems.push("Odds must be a number greater than 1.00");
    if (wager === null || !(wager > 0)) problems.push("Wager must be a positive number");
    if (result === null) problems.push("Unrecognized Result value");

    if (problems.length > 0) {
      errors.push({ row: rowNum, message: problems.join("; ") });
      return;
    }

    validRows.push({
      row: rowNum,
      bet_type: "single",
      when_placed: whenPlaced,
      placed_at: placedAt,
      sport: sport!,
      league: league!,
      match: match!,
      odds: odds!,
      sportsbook: sportsbook!,
      wager: wager!,
      result: result!,
      actual_return: result === "pending" ? null : actualReturn,
      prop_type: propType!,
      prop: prop!,
    });
  });

  return { source: "Form Responses3", validRows, errors, totalRows: rows.length };
}
