// Minimal offline cache: cache-first for same-origin GET requests, refreshed in the background.
const CACHE = "curriculum-tracker-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./"]).catch(() => undefined)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => undefined);
      if (cached) {
        network.catch(() => undefined);
        return cached;
      }
      const res = await network;
      if (res) return res;
      // SPA fallback for navigations while offline.
      if (req.mode === "navigate") {
        const index = await cache.match("./");
        if (index) return index;
      }
      return new Response("Offline", { status: 503 });
    }),
  );
});
