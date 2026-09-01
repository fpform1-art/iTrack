import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed "Middleware" to "Proxy" (functionality is identical —
// see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, image optimization,
     * and the PWA manifest/icon/service-worker routes — none of these are
     * pages and none should ever be auth-gated (a redirected, non-JSON
     * response for /manifest.webmanifest breaks install detection, and a
     * redirected /icon breaks the favicon on every public page).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
