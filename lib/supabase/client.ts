import { createBrowserClient } from "@supabase/ssr";

// Uses the publishable (anon) key only — safe for the browser bundle.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
