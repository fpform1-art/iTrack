import { parseMatchTeams } from "@/lib/logos/parse-match";
import { TeamLogo } from "@/components/ui/team-logo";

/** Team logos beside each team name when the stored match string parses cleanly; otherwise plain text. */
export function MatchLabel({ match, className }: { match: string; className?: string }) {
  const teams = parseMatchTeams(match);

  if (!teams) {
    return <p className={className ?? "truncate text-sm font-medium text-slate-900 dark:text-slate-100"}>{match}</p>;
  }

  return (
    <div
      className={
        className ??
        "flex min-w-0 items-center gap-1 text-sm font-medium text-slate-900 dark:text-slate-100"
      }
    >
      <span className="flex min-w-0 items-center gap-1">
        <TeamLogo name={teams.away} size={16} />
        <span className="truncate">{teams.away}</span>
      </span>
      <span className="shrink-0 text-slate-400 dark:text-slate-500">@</span>
      <span className="flex min-w-0 items-center gap-1">
        <TeamLogo name={teams.home} size={16} />
        <span className="truncate">{teams.home}</span>
      </span>
    </div>
  );
}
