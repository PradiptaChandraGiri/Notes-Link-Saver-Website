const CACHE_NAME = 'notes-app-shell-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // add other static assets (icons, images, CSS) you want cached here
];

// Install - precache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate - cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
    ))
  );
  self.clients.claim();
});

// Helper - is asset
function isStaticRequest(req) {
  const url = new URL(req.url);
  return url.origin === location.origin && (
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.startsWith('/icons/')
  );
}

// Fetch - network-first for dynamic (API) requests, cache-first for static
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  // For same-origin static assets: cache-first
  if (isStaticRequest(req)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        // update cache opportunistically
        caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
        return resp;
      }).catch(() => caches.match('/index.html')))
    );
    return;
  }

  // For other GETs (including network resources): network-first then fallback to cache
  event.respondWith(
    fetch(req).then(resp => {
      return resp;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
  );
});
