"use client";

import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { getTeamLogoUrl } from "@/lib/logos/team-logos";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

/**
 * Shows a team's crest if one is known, otherwise a deterministic initials
 * avatar. Never breaks the UI: a missing lookup, a 404, or any other image
 * load failure all resolve to the same fallback.
 *
 * Uses `unoptimized` on next/image deliberately — logo URLs will come from
 * whatever external source is eventually configured (see
 * lib/logos/team-logos.ts), and skipping Next's image optimizer means a
 * new logo host doesn't also require updating next.config.ts's
 * images.remotePatterns every time one is added. These are small, already
 * appropriately-sized icons, so there's little optimization to gain
 * anyway.
 */
export function TeamLogo({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const url = getTeamLogoUrl(name);
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    return <InitialsAvatar name={name} size={size} rounded="full" className={className} />;
  }

  return (
    <Image
      src={url}
      alt={`${name} logo`}
      width={size}
      height={size}
      unoptimized
      onError={() => setErrored(true)}
      className={clsx("shrink-0 rounded-full object-contain", className)}
    />
  );
}
