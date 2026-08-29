"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BetLeg } from "@/types/database";

export function useBetLegs(betId: string | null) {
  const [legs, setLegs] = useState<BetLeg[]>([]);
  const [loading, setLoading] = useState(false);
  // Track the betId we last synced state for, so a change can be handled
  // during render (React's recommended way to "reset state when a prop
  // changes") rather than as a synchronous setState call inside an Effect.
  const [trackedBetId, setTrackedBetId] = useState<string | null>(betId);

  if (betId !== trackedBetId) {
    setTrackedBetId(betId);
    setLegs([]);
    setLoading(Boolean(betId));
  }

  useEffect(() => {
    if (!betId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("bet_legs")
      .select("*")
      .eq("bet_id", betId)
      .order("leg_order", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setLegs((data ?? []) as BetLeg[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [betId]);

  return { legs, loading, setLegs };
}
