"use client";

import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { getLeagueLogoUrl } from "@/lib/logos/league-logos";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

/**
 * Shows a league/competition logo if one is known, otherwise a
 * deterministic initials avatar. Same never-break-the-UI guarantee as
 * TeamLogo — see that component for the full rationale (including why
 * `unoptimized` is used deliberately here too).
 */
export function LeagueLogo({
  apiKey,
  label,
  size = 16,
  className,
}: {
  /** The Odds API sport_key from lib/odds/leagues.ts (e.g. "soccer_epl") — also the lookup key here. */
  apiKey: string;
  /** Display label, used for the fallback initials and alt text. */
  label: string;
  size?: number;
  className?: string;
}) {
  const url = getLeagueLogoUrl(apiKey);
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    return <InitialsAvatar name={label} size={size} rounded="md" className={className} />;
  }

  return (
    <Image
      src={url}
      alt={`${label} logo`}
      width={size}
      height={size}
      unoptimized
      onError={() => setErrored(true)}
      className={clsx("shrink-0 rounded-md object-contain", className)}
    />
  );
}
