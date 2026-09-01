"use client";

import { useEffect } from "react";

/**
 * Registers the static-asset-only service worker (public/sw.js).
 *
 * Production-only and guarded behind feature detection so this is a no-op
 * during local development (avoids the service worker interfering with
 * Next.js Fast Refresh/HMR) and on any browser without support. Registering
 * more than once is safe — the browser no-ops if the script is unchanged.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal — the app works identically with or without the service
      // worker registered, so a failed registration is silently ignored
      // rather than surfaced to the user.
    });
  }, []);

  return null;
}
