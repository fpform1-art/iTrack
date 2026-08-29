import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEventsForLeague, isOddsApiConfigured } from "@/lib/odds/client";
import { findLeague } from "@/lib/odds/leagues";

export async function GET(request: Request) {
  // Require an authenticated session even though this data isn't
  // user-specific, to avoid an open proxy to the upstream API.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isOddsApiConfigured()) {
    return NextResponse.json(
      { configured: false, events: [], message: "Odds API is not configured. Use Manual Entry." },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(request.url);
  const leagueKey = searchParams.get("league");
  if (!leagueKey || !findLeague(leagueKey)) {
    return NextResponse.json({ error: "Unknown or missing league key." }, { status: 400 });
  }

  try {
    const events = await getEventsForLeague(leagueKey);
    return NextResponse.json({ configured: true, events });
  } catch (e) {
    return NextResponse.json(
      { configured: true, events: [], error: e instanceof Error ? e.message : "Fetch failed." },
      { status: 200 }
    );
  }
}
