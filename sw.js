/* ================================
   Service Worker — Daily Notes Link Saver (PWA)
   Offline-first, cache-first for static files,
   network-first fallback for dynamic requests.
================================ */

const CACHE_NAME = "notes-app-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* INSTALL — Pre-cache essential app shell */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ACTIVATE — Clean old caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      )
    )
  );
  self.clients.claim();
});

/* HELPER — Check if request is a static file */
function isStatic(req) {
  const url = new URL(req.url);
  return (
    url.origin === location.origin &&
    (STATIC_ASSETS.includes(url.pathname) ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg"))
  );
}

/* FETCH — Cache-first for static, network-first for dynamic */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  // Cache-first for static assets
  if (isStatic(req)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((resp) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resp.clone());
            });
            return resp;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // Network-first for all other requests
  event.respondWith(
    fetch(req)
      .then((resp) => resp)
      .catch(() => caches.match(req).then((c) => c || caches.match("/index.html")))
  );
});
