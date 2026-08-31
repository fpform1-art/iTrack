"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Drawer } from "@/components/bet-entry/drawer";
import { BetTypeTabs } from "@/components/bet-entry/bet-type-tabs";
import { WhenPlacedSelect } from "@/components/bet-entry/when-placed-select";
import { GamePicker, type GameSelection } from "@/components/bet-entry/game-picker";
import { LegsEditor, emptyLeg, type LegFormState } from "@/components/bet-entry/legs-editor";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/components/shell/app-data-context";
import { createBet } from "@/lib/actions/bets";
import { validateLegCount } from "@/lib/calc/validation";
import type { BetType, WhenPlaced } from "@/types/database";

export function BetEntryDrawer() {
  const { isBetDrawerOpen, closeBetDrawer, profile, refreshData } = useAppData();
  const [betType, setBetType] = useState<BetType>("single");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared fields
  const [whenPlaced, setWhenPlaced] = useState<WhenPlaced>("pregame");
  const [sportsbook, setSportsbook] = useState(profile.default_sportsbook || "");
  const [wager, setWager] = useState(profile.default_wager ? String(profile.default_wager) : "");
  const [odds, setOdds] = useState("");

  // Single
  const [game, setGame] = useState<GameSelection>({ sport: "", league: "", match: "" });
  const [prop, setProp] = useState("");

  // SGP (one shared game)
  const [sgpGame, setSgpGame] = useState<GameSelection>({ sport: "", league: "", match: "" });
  const [sgpLegs, setSgpLegs] = useState<LegFormState[]>([{ ...emptyLeg }, { ...emptyLeg }]);

  // Parlay (per-leg game)
  const [parlayLegs, setParlayLegs] = useState<LegFormState[]>([{ ...emptyLeg }, { ...emptyLeg }]);

  // This component stays mounted for the whole session (only visibility
  // toggles), so `useState(profile.default_sportsbook || "")` above only
  // ever runs once, at first mount. If the user updates their default
  // sportsbook in Settings and then opens Bet Entry, the field would still
  // show whatever was true when the app first loaded. Re-sync from the
  // current profile every time the drawer transitions from closed to open
  // (React's render-phase-adjustment pattern, not an Effect) so Settings
  // changes are picked up without needing to sign out or reload.
  const [hasSyncedDefaultsForOpen, setHasSyncedDefaultsForOpen] = useState(false);
  if (isBetDrawerOpen && !hasSyncedDefaultsForOpen) {
    setHasSyncedDefaultsForOpen(true);
    setSportsbook(profile.default_sportsbook || "");
    setWager(profile.default_wager ? String(profile.default_wager) : "");
  } else if (!isBetDrawerOpen && hasSyncedDefaultsForOpen) {
    setHasSyncedDefaultsForOpen(false);
  }

  function resetForm() {
    setBetType("single");
    setWhenPlaced("pregame");
    setSportsbook(profile.default_sportsbook || "");
    setWager(profile.default_wager ? String(profile.default_wager) : "");
    setOdds("");
    setGame({ sport: "", league: "", match: "" });
    setProp("");
    setSgpGame({ sport: "", league: "", match: "" });
    setSgpLegs([{ ...emptyLeg }, { ...emptyLeg }]);
    setParlayLegs([{ ...emptyLeg }, { ...emptyLeg }]);
    setError(null);
  }

  function handleClose() {
    closeBetDrawer();
  }

  async function handleSubmit(e: React.FormEvent, keepOpen: boolean) {
    e.preventDefault();
    setError(null);

    const wagerNum = Number(wager);
    const oddsNum = Number(odds);

    if (!sportsbook.trim()) return setError("Sportsbook is required.");
    if (!(wagerNum > 0)) return setError("Wager must be greater than 0.");
    if (!(oddsNum > 1)) return setError("Odds must be greater than 1.00.");

    setSubmitting(true);
    try {
      let result;
      if (betType === "single") {
        if (!game.sport || !game.league || !game.match) return setError("Select or enter a game.");
        if (!prop.trim()) return setError("Prop is required.");
        result = await createBet({
          bet_type: "single",
          when_placed: whenPlaced,
          sportsbook,
          wager: wagerNum,
          odds: oddsNum,
          sport: game.sport,
          league: game.league,
          match: game.match,
          prop,
        });
      } else if (betType === "sgp") {
        const check = validateLegCount(sgpLegs.length);
        if (!check.valid) return setError(check.message!);
        if (!sgpGame.sport || !sgpGame.league || !sgpGame.match) {
          return setError("Select or enter the game for this SGP.");
        }
        for (const leg of sgpLegs) {
          if (!leg.prop.trim()) return setError("Every leg needs a prop.");
        }
        result = await createBet({
          bet_type: "sgp",
          when_placed: whenPlaced,
          sportsbook,
          wager: wagerNum,
          odds: oddsNum,
          sport: sgpGame.sport,
          league: sgpGame.league,
          match: sgpGame.match,
          legs: sgpLegs.map((l) => ({
            sport: sgpGame.sport,
            league: sgpGame.league,
            match: sgpGame.match,
            prop: l.prop,
            leg_odds: l.leg_odds ? Number(l.leg_odds) : null,
          })),
        });
      } else {
        const check = validateLegCount(parlayLegs.length);
        if (!check.valid) return setError(check.message!);
        for (const leg of parlayLegs) {
          if (!leg.sport || !leg.league || !leg.match) return setError("Every leg needs a game.");
          if (!leg.prop.trim()) return setError("Every leg needs a prop.");
        }
        result = await createBet({
          bet_type: "parlay",
          when_placed: whenPlaced,
          sportsbook,
          wager: wagerNum,
          odds: oddsNum,
          legs: parlayLegs.map((l) => ({
            sport: l.sport,
            league: l.league,
            match: l.match,
            prop: l.prop,
            leg_odds: l.leg_odds ? Number(l.leg_odds) : null,
          })),
        });
      }

      if (result?.error) {
        setError(result.error);
        return;
      }

      toast.success("Bet added.");
      refreshData();
      if (keepOpen) {
        resetForm();
      } else {
        resetForm();
        closeBetDrawer();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open={isBetDrawerOpen} onClose={handleClose} title="Add a bet">
      <form className="space-y-5">
        <BetTypeTabs value={betType} onChange={setBetType} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="when-placed">When Placed</Label>
            <WhenPlacedSelect id="when-placed" value={whenPlaced} onChange={setWhenPlaced} />
          </div>
          <div>
            <Label htmlFor="sportsbook">Sportsbook</Label>
            <Input
              id="sportsbook"
              value={sportsbook}
              onChange={(e) => setSportsbook(e.target.value)}
              placeholder="bet365"
            />
          </div>
        </div>

        {betType === "single" && (
          <div className="space-y-3">
            <GamePicker idPrefix="single" value={game} onChange={setGame} />
            <div>
              <Label htmlFor="prop">Prop</Label>
              <Input
                id="prop"
                value={prop}
                onChange={(e) => setProp(e.target.value)}
                placeholder="Arsenal Moneyline"
              />
            </div>
          </div>
        )}

        {betType === "sgp" && (
          <div className="space-y-3">
            <GamePicker idPrefix="sgp" value={sgpGame} onChange={setSgpGame} />
            <LegsEditor legs={sgpLegs} onChange={setSgpLegs} perLegGame={false} />
          </div>
        )}

        {betType === "parlay" && (
          <LegsEditor legs={parlayLegs} onChange={setParlayLegs} perLegGame />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="wager">Wager</Label>
            <Input
              id="wager"
              type="number"
              step="0.01"
              min="0.01"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              placeholder="100"
            />
          </div>
          <div>
            <Label htmlFor="odds">{betType === "single" ? "Odds" : "Combined Odds"} (decimal)</Label>
            <Input
              id="odds"
              type="number"
              step="0.01"
              min="1.01"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              placeholder="2.10"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-2 pb-4">
          <Button
            type="submit"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Saving…" : "Save Bet"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
          >
            Save &amp; add another
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
