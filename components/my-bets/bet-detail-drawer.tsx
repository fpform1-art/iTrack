"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Drawer } from "@/components/bet-entry/drawer";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WhenPlacedSelect } from "@/components/bet-entry/when-placed-select";
import { useBetLegs } from "@/hooks/use-bet-legs";
import { useAppData } from "@/components/shell/app-data-context";
import {
  updateBet,
  deleteBet,
  updateLegsAndSuggestOverall,
  addLeg,
  removeLeg,
  type LegUpdate,
} from "@/lib/actions/bets";
import { suggestOverallResult, areLegsLocked, suggestedActualReturn } from "@/lib/calc/betting";
import { MAX_LEGS, MIN_LEGS } from "@/lib/calc/validation";
import type { Bet, BetResult, LegResult, WhenPlaced } from "@/types/database";
import { formatCurrency } from "@/lib/format";
import { MatchLabel } from "@/components/ui/match-label";
import { LeagueLogo } from "@/components/ui/league-logo";
import { findLeagueByLabel } from "@/lib/odds/leagues";

const RESULT_OPTIONS: BetResult[] = ["pending", "won", "lost", "push", "void"];
const LEG_RESULT_LABELS: Record<LegResult, string> = {
  pending: "Pending",
  won: "W",
  lost: "L",
  push: "Push",
  void: "Void",
};

export function BetDetailDrawer({ bet, onClose }: { bet: Bet | null; onClose: () => void }) {
  const { profile, refreshData } = useAppData();
  const { legs, loading, setLegs } = useBetLegs(bet?.id ?? null);

  const [wager, setWager] = useState("");
  const [odds, setOdds] = useState("");
  const [sportsbook, setSportsbook] = useState("");
  const [whenPlaced, setWhenPlaced] = useState<WhenPlaced>("pregame");
  const [match, setMatch] = useState("");
  const [propType, setPropType] = useState("");
  const [prop, setProp] = useState("");
  const [overallResult, setOverallResult] = useState<BetResult>("pending");
  const [actualReturn, setActualReturn] = useState("");
  // Tracks whether the user has manually typed into Actual Return for the
  // currently-loaded bet, so auto-suggestion (on Result change / leg
  // grading) knows whether it's safe to overwrite the field or whether the
  // user has already made a deliberate choice to preserve.
  const [actualReturnTouched, setActualReturnTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks which bet's fields are currently loaded into the form state, so a
  // change of `bet` can be handled during render (React's recommended
  // pattern for resetting state from a changed prop) instead of via an
  // Effect that would call setState synchronously.
  const [loadedBetId, setLoadedBetId] = useState<string | null>(null);
  // Same pattern for the single bet's synthetic leg (prop_type/prop live on
  // bet_legs, not bets, and legs load asynchronously via useBetLegs).
  const [loadedLegId, setLoadedLegId] = useState<string | null>(null);

  const isSingle = bet?.bet_type === "single";
  const isMulti = bet && !isSingle;
  const singleLeg = isSingle ? legs[0] : undefined;

  if (bet && bet.id !== loadedBetId) {
    setLoadedBetId(bet.id);
    setWager(String(bet.wager));
    setOdds(String(bet.odds));
    setSportsbook(bet.sportsbook);
    setWhenPlaced(bet.when_placed);
    setMatch(bet.match);
    setOverallResult(bet.result);
    setActualReturn(bet.actual_return != null ? String(bet.actual_return) : "");
    setActualReturnTouched(false);
    setError(null);
  } else if (!bet && loadedBetId !== null) {
    setLoadedBetId(null);
    setLoadedLegId(null);
  }

  if (singleLeg && singleLeg.id !== loadedLegId) {
    setLoadedLegId(singleLeg.id);
    setPropType(singleLeg.prop_type ?? "");
    setProp(singleLeg.prop);
  }

  if (!bet) return null;

  const legLocked = isMulti && areLegsLocked(bet.result, legs.map((l) => l.result));

  async function handleSaveDetails() {
    setSaving(true);
    setError(null);
    try {
      const result = await updateBet({
        betId: bet!.id,
        wager: Number(wager),
        odds: Number(odds),
        sportsbook,
        when_placed: whenPlaced,
        match: isSingle ? match : undefined,
        result: overallResult,
        actual_return: actualReturn !== "" ? Number(actualReturn) : null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      // prop_type/prop/match live on the synthetic bet_legs row for
      // singles, not on bets — keep them in sync so the leg (and anything
      // built on it later) doesn't go stale relative to what's shown here.
      if (isSingle && singleLeg) {
        const legResult = await updateLegsAndSuggestOverall(bet!.id, [
          { legId: singleLeg.id, match, prop_type: propType, prop },
        ]);
        if (legResult.error) {
          setError(legResult.error);
          return;
        }
      }

      toast.success("Bet updated.");
      refreshData();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this bet? This cannot be undone.")) return;
    setSaving(true);
    try {
      const result = await deleteBet(bet!.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Bet deleted.");
      refreshData();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleLegResultChange(legId: string, newResult: LegResult) {
    const updated = legs.map((l) => (l.id === legId ? { ...l, result: newResult } : l));
    setLegs(updated);
    const legUpdates: LegUpdate[] = [{ legId, result: newResult }];
    const result = await updateLegsAndSuggestOverall(bet!.id, legUpdates);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const suggested = suggestOverallResult(updated.map((l) => l.result));
    setOverallResult(suggested);
    // Mirror what the server just computed so the field doesn't sit empty
    // (or stale) and mislead the user about what will be saved if they also
    // hit "Save Changes" for other fields — unless they've already typed
    // their own value, which we never overwrite.
    if (!actualReturnTouched) {
      setActualReturn(
        suggested === "pending" ? "" : String(suggestedActualReturn(suggested, Number(wager), Number(odds)) ?? "")
      );
    }
    refreshData();
  }

  function handleOverallResultChange(newResult: BetResult) {
    setOverallResult(newResult);
    if (actualReturnTouched) return; // user already typed a deliberate value — leave it alone
    if (newResult === "pending") {
      setActualReturn("");
      return;
    }
    const suggested = suggestedActualReturn(newResult, Number(wager), Number(odds));
    setActualReturn(suggested != null ? String(suggested) : "");
  }

  async function handleAddLeg() {
    const result = await addLeg(bet!.id, {
      sport: bet!.sport,
      league: bet!.league,
      match: bet!.match,
      prop_type: "",
      prop: "",
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refreshData();
  }

  async function handleRemoveLeg(legId: string) {
    if (legs.length <= MIN_LEGS) {
      toast.error(`A multi-leg bet needs at least ${MIN_LEGS} legs.`);
      return;
    }
    const result = await removeLeg(bet!.id, legId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setLegs(legs.filter((l) => l.id !== legId));
    refreshData();
  }

  return (
    <Drawer open={Boolean(bet)} onClose={onClose} title={isSingle ? "Edit Bet" : "Edit Bet / Grade"}>
      <div className="space-y-5 pb-6">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <MatchLabel match={bet.match} />
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {bet.sport} •
            <LeagueLogo apiKey={findLeagueByLabel(bet.league)?.apiKey ?? ""} label={bet.league} size={14} />
            {bet.league} • {new Date(bet.placed_at).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-wager">Wager</Label>
            <Input id="edit-wager" type="number" step="0.01" value={wager} onChange={(e) => setWager(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-odds">{isSingle ? "Odds" : "Combined Odds"}</Label>
            <Input id="edit-odds" type="number" step="0.01" value={odds} onChange={(e) => setOdds(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-book">Sportsbook</Label>
            <Input id="edit-book" value={sportsbook} onChange={(e) => setSportsbook(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-when">When Placed</Label>
            <WhenPlacedSelect id="edit-when" value={whenPlaced} onChange={setWhenPlaced} />
          </div>
          {isSingle && (
            <div className="col-span-2">
              <Label htmlFor="edit-match">Match</Label>
              <Input id="edit-match" value={match} onChange={(e) => setMatch(e.target.value)} />
            </div>
          )}
          {isSingle && (
            <>
              <div>
                <Label htmlFor="edit-prop-type">Prop Type</Label>
                <Input id="edit-prop-type" value={propType} onChange={(e) => setPropType(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-prop">Prop</Label>
                <Input id="edit-prop" value={prop} onChange={(e) => setProp(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {isMulti && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Legs {legLocked && <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(locked)</span>}
              </h3>
              {!legLocked && legs.length < MAX_LEGS && (
                <button type="button" onClick={handleAddLeg} className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                  + Add leg
                </button>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Loading legs…</p>
            ) : (
              legs.map((leg) => (
                <div key={leg.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800 dark:text-slate-200">
                      {leg.prop_type ? `${leg.prop_type}: ${leg.prop}` : leg.prop}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">{leg.match}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={leg.result}
                      onChange={(e) => handleLegResultChange(leg.id, e.target.value as LegResult)}
                      className="w-24"
                    >
                      {(["pending", "won", "lost", "push", "void"] as LegResult[]).map((r) => (
                        <option key={r} value={r}>
                          {LEG_RESULT_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                    {!legLocked && legs.length > MIN_LEGS && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(leg.id)}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Overall Result</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-result">Result</Label>
              <Select
                id="edit-result"
                value={overallResult}
                onChange={(e) => handleOverallResultChange(e.target.value as BetResult)}
              >
                {RESULT_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-actual-return">Actual Return</Label>
              <Input
                id="edit-actual-return"
                type="number"
                step="0.01"
                value={actualReturn}
                onChange={(e) => {
                  setActualReturn(e.target.value);
                  setActualReturnTouched(true);
                }}
                placeholder={overallResult === "pending" ? "—" : "Auto-suggested, editable"}
                disabled={overallResult === "pending"}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Potential payout at these odds: {formatCurrency(Number(wager || 0) * Number(odds || 0), profile.currency)}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">{error}</div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSaveDetails} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
