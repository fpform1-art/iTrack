"use client";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GamePicker } from "@/components/bet-entry/game-picker";
import { MAX_LEGS, MIN_LEGS } from "@/lib/calc/validation";

export interface LegFormState {
  sport: string;
  league: string;
  match: string;
  prop: string;
  leg_odds: string; // string in form state, parsed on submit
}

export const emptyLeg: LegFormState = {
  sport: "",
  league: "",
  match: "",
  prop: "",
  leg_odds: "",
};

export function LegsEditor({
  legs,
  onChange,
  perLegGame,
}: {
  legs: LegFormState[];
  onChange: (legs: LegFormState[]) => void;
  /** SGP shares one game across all legs, so the caller renders the GamePicker once and this stays false. Parlay = true. */
  perLegGame: boolean;
}) {
  function updateLeg(idx: number, patch: Partial<LegFormState>) {
    const next = legs.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function addLeg() {
    if (legs.length >= MAX_LEGS) return;
    onChange([...legs, { ...emptyLeg }]);
  }

  function removeLeg(idx: number) {
    if (legs.length <= MIN_LEGS) return;
    onChange(legs.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {legs.length} of {MAX_LEGS} legs
        </span>
        {legs.length < MAX_LEGS && (
          <Button type="button" variant="secondary" size="sm" onClick={addLeg}>
            + Add leg
          </Button>
        )}
      </div>

      {legs.map((leg, idx) => (
        <div key={idx} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Leg {idx + 1}
            </span>
            {legs.length > MIN_LEGS && (
              <button
                type="button"
                onClick={() => removeLeg(idx)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>

          {perLegGame && (
            <div className="mb-3">
              <GamePicker
                idPrefix={`leg-${idx}`}
                value={{ sport: leg.sport, league: leg.league, match: leg.match }}
                onChange={(v) => updateLeg(idx, v)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`leg-${idx}-prop`}>Prop</Label>
              <Input
                id={`leg-${idx}-prop`}
                value={leg.prop}
                onChange={(e) => updateLeg(idx, { prop: e.target.value })}
                placeholder="Bukayo Saka — Anytime Scorer"
              />
            </div>
            <div>
              <Label htmlFor={`leg-${idx}-odds`}>Leg Odds (optional)</Label>
              <Input
                id={`leg-${idx}-odds`}
                type="number"
                step="0.01"
                min="1.01"
                value={leg.leg_odds}
                onChange={(e) => updateLeg(idx, { leg_odds: e.target.value })}
                placeholder="1.80"
              />
            </div>
          </div>
        </div>
      ))}

      {legs.length < MAX_LEGS && (
        <Button type="button" variant="secondary" size="sm" onClick={addLeg}>
          + Add leg ({legs.length}/{MAX_LEGS})
        </Button>
      )}
    </div>
  );
}
