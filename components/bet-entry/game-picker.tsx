"use client";

import { useEffect, useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { LEAGUE_CONFIG, SPORTS, leaguesForSport, findLeague, supportsListedFixtures } from "@/lib/odds/leagues";
import type { OddsApiEvent } from "@/lib/odds/client";
import {
  addDaysToDateKey,
  dayLabel,
  filterEventsByLocalDate,
  todayLocalDateKey,
} from "@/lib/odds/date-filter";
import { parseMatchTeams } from "@/lib/logos/parse-match";
import { TeamLogo } from "@/components/ui/team-logo";
import { LeagueLogo } from "@/components/ui/league-logo";

export interface GameSelection {
  sport: string;
  league: string;
  match: string;
}

export function GamePicker({
  value,
  onChange,
  idPrefix,
}: {
  value: GameSelection;
  onChange: (v: GameSelection) => void;
  idPrefix: string;
}) {
  const [mode, setMode] = useState<"listed" | "manual">("manual");
  const [leagueKey, setLeagueKey] = useState<string>(LEAGUE_CONFIG[0]?.apiKey ?? "");
  const [events, setEvents] = useState<OddsApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Sticky across league/sport switches within this picker instance — only
  // resets if the user explicitly navigates days. Filtering by day never
  // triggers a new fetch: it's applied client-side to whatever fixtures are
  // already cached in `events` for the current league.
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalDateKey());

  useEffect(() => {
    if (mode !== "listed") return;
    let cancelled = false;

    async function run() {
      // Deferred via microtask so the loading/notice resets aren't
      // synchronous calls within the effect body itself.
      await Promise.resolve();
      if (cancelled) return;

      const league = findLeague(leagueKey);
      if (league && !supportsListedFixtures(league)) {
        // Don't spend an API call (or even a request) on a league we
        // already know isn't available for listed fixtures — go straight
        // to the Manual Entry notice.
        setEvents([]);
        setNotice("Listed fixtures aren't available for this league yet — use Manual Entry.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotice(null);
      try {
        const r = await fetch(`/api/fixtures?league=${encodeURIComponent(leagueKey)}`);
        const data = await r.json();
        if (cancelled) return;
        if (data.configured === false) {
          setNotice(data.message || "Odds API is not configured. Use Manual Entry.");
          setEvents([]);
        } else if (data.error) {
          setNotice(data.error);
          setEvents([]);
        } else {
          setEvents(data.events ?? []);
        }
      } catch {
        if (!cancelled) setNotice("Couldn't load fixtures. Try Manual Entry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // Deliberately NOT depending on selectedDate — switching days must not
    // re-fetch; see filterEventsByLocalDate below for the client-side pass.
  }, [mode, leagueKey]);

  const eventsForSelectedDay = filterEventsByLocalDate(events, selectedDate);

  function handleEventSelect(eventId: string) {
    const ev = eventsForSelectedDay.find((e) => e.id === eventId);
    if (!ev) return;
    const league = LEAGUE_CONFIG.find((l) => l.apiKey === leagueKey);
    onChange({
      sport: league?.sport ?? "",
      league: league?.label ?? "",
      match: `${ev.away_team} @ ${ev.home_team}`,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex gap-2 text-xs">
        <ModeButton active={mode === "listed"} onClick={() => setMode("listed")}>
          Listed game
        </ModeButton>
        <ModeButton active={mode === "manual"} onClick={() => setMode("manual")}>
          Manual entry
        </ModeButton>
      </div>

      {mode === "listed" ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`${idPrefix}-league`}>League</Label>
            <div className="flex items-center gap-2">
              <LeagueLogo
                apiKey={leagueKey}
                label={findLeague(leagueKey)?.label ?? leagueKey}
                size={20}
              />
              <Select
                id={`${idPrefix}-league`}
                value={leagueKey}
                onChange={(e) => {
                  setLeagueKey(e.target.value);
                }}
              >
                {SPORTS.map((sport) => (
                  <optgroup key={sport} label={sport}>
                    {leaguesForSport(sport).map((l) => (
                      <option key={l.apiKey} value={l.apiKey}>
                        {l.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Day</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDaysToDateKey(d, -1))}
                aria-label="Previous day"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ‹
              </button>
              <span className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {dayLabel(selectedDate)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDaysToDateKey(d, 1))}
                aria-label="Next day"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ›
              </button>
              {selectedDate !== todayLocalDateKey() && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayLocalDateKey())}
                  className="shrink-0 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`${idPrefix}-event`}>Match</Label>
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Loading fixtures…</p>
            ) : notice ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">{notice}</p>
            ) : eventsForSelectedDay.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No games scheduled for this day.</p>
            ) : (
              <Select
                id={`${idPrefix}-event`}
                defaultValue=""
                onChange={(e) => handleEventSelect(e.target.value)}
              >
                <option value="" disabled>
                  Select a match…
                </option>
                {eventsForSelectedDay.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.away_team} @ {ev.home_team} — {new Date(ev.commence_time).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </option>
                ))}
              </Select>
            )}
          </div>
          {value.match && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="mb-1 block">Selected:</span>
              {(() => {
                const teams = parseMatchTeams(value.match);
                if (!teams) {
                  return <span className="font-medium text-slate-700 dark:text-slate-200">{value.match}</span>;
                }
                return (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <TeamLogo name={teams.away} size={18} />
                      {teams.away}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">@</span>
                    <span className="flex items-center gap-1.5">
                      <TeamLogo name={teams.home} size={18} />
                      {teams.home}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${idPrefix}-sport`}>Sport</Label>
            <Input
              id={`${idPrefix}-sport`}
              value={value.sport}
              onChange={(e) => onChange({ ...value, sport: e.target.value })}
              placeholder="Soccer"
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-league-manual`}>League</Label>
            <Input
              id={`${idPrefix}-league-manual`}
              value={value.league}
              onChange={(e) => onChange({ ...value, league: e.target.value })}
              placeholder="Premier League"
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-match`}>Match</Label>
            <Input
              id={`${idPrefix}-match`}
              value={value.match}
              onChange={(e) => onChange({ ...value, match: e.target.value })}
              placeholder="Arsenal @ Chelsea"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 font-medium ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
