const CACHE_NAME = 'unit-calc-v1787147104550';

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./js/app.js",
  "./js/calculator.store.js",
  "./js/calculator.view.js",
  "./js/fuel.store.js",
  "./js/fuel.view.js",
  "./js/shared/backup.js",
  "./js/shared/backup.service.js",
  "./js/shared/db.js",
  "./js/shared/flight.service.js",
  "./js/shared/import.service.js",
  "./js/shared/schema.js",
  "./js/shared/utils.js",
  "./js/shifts.store.js",
  "./js/shifts.view.js",
  "./js/trips.store.js",
  "./js/trips.view.js",
  "./css/style.css",
  "./css/tokens.css",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&family=Unbounded:wght@400;600&display=swap"
];

// INSTALL: cache own assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Take control immediately, don't wait for old SW to die
  self.skipWaiting();
});

// ACTIVATE: nuke ALL foreign caches aggressively
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: network-first for navigations (HTML), cache-first for static assets
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
