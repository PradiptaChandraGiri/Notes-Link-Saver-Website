const CACHE_NAME = "notes-app-shell-v1";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add icons
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install → Precache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate → Clear Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
        )
      )
  );
  self.clients.claim();
});

// Helper → Check if it's a static asset
function isStaticRequest(req) {
  const url = new URL(req.url);

  return (
    url.origin === location.origin &&
    (url.pathname === "/" ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.startsWith("/icons/"))
  );
}

// Fetch → Cache-first for static assets, network-first for others
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  // Cache-first strategy for static assets
  if (isStaticRequest(req)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((resp) => {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, respClone);
            });
            return resp;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // Network-first strategy for all other GETs (e.g., Firebase)
  event.respondWith(
    fetch(req)
      .then((resp) => resp)
      .catch(() =>
        caches
          .match(req)
          .then((cached) => cached || caches.match("/index.html"))
      )
  );
});
