// iTraxc service worker — intentionally minimal.
//
// This app holds live, private betting data behind Supabase Auth + RLS, so
// this worker deliberately does NOT cache:
//   - page navigations / RSC payloads (always reflect the signed-in user's
//     current data — caching these risks showing stale or, worse, another
//     session's content)
//   - anything under /api/ (e.g. the Odds API fixture proxy)
//   - Supabase requests (cross-origin to *.supabase.co — never touched here)
//
// It only cache-first's content-hashed Next.js build assets and small,
// non-personalized branding assets (icons, manifest). Everything else is
// left completely alone and falls straight through to the network, exactly
// as if no service worker were installed at all.

const CACHE_NAME = "itraxc-static-v1";

const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//, // content-hashed JS/CSS — safe to cache indefinitely
  /^\/icons\//, // PWA icon files
  /^\/manifest\.webmanifest$/,
  /^\/icon(\?.*)?$/, // Next-generated favicon route
  /^\/apple-icon(\?.*)?$/, // Next-generated apple-touch-icon route
];

function isCacheableStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever handle same-origin GET requests for the specific static
  // asset patterns above. Everything else (navigations, RSC fetches,
  // /api/*, any cross-origin request including Supabase) is left
  // untouched — no event.respondWith() call means the browser handles it
  // as a completely normal network request.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isCacheableStaticAsset(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      // Only cache genuinely successful, basic (same-origin, non-opaque)
      // responses — never cache errors or partial responses.
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
  );
});
