/**
 * Best-effort extraction of {away, home} team names from a bet's stored
 * `match` string.
 *
 * iTraxc doesn't store separate team-name columns on bets/bet_legs — only
 * a single free-text `match` field, since Manual Entry allows any text
 * there. This only succeeds for the "Away @ Home" format the listed-game
 * picker produces (GamePicker always writes `${away} @ ${home}`), plus a
 * couple of common manual-entry separators as a secondary heuristic.
 *
 * Returns null rather than guessing for anything else — a card with no
 * team logos is fine; a card with a logo next to the WRONG team name would
 * be worse, and this app has no way to verify a manual entry's format.
 */
export function parseMatchTeams(match: string): { away: string; home: string } | null {
  const separators = [" @ ", " vs ", " v "];

  for (const sep of separators) {
    const idx = match.indexOf(sep);
    if (idx <= 0) continue;

    const left = match.slice(0, idx).trim();
    const right = match.slice(idx + sep.length).trim();
    if (!left || !right) continue;

    // GamePicker's own format is unambiguously "away @ home". "vs"/"v" are
    // a manual-entry heuristic where the order isn't guaranteed, but
    // treating left=away/right=home consistently is fine here — this only
    // drives which side shows which logo, a display nicety, not anything
    // that affects stored data or calculations.
    return { away: left, home: right };
  }

  return null;
}
