const CACHE_NAME = 'taxi-crm-v1';
const SCOPE_PREFIX = 'taxi-crm-';

const ASSETS = [
  "./",
  "./index.html",
  "./css/tokens.css",
  "./css/style.css",
  "./js/app.js",
  "./js/calculator.store.js",
  "./js/calculator.view.js",
  "./js/trips.store.js",
  "./js/trips.view.js",
  "./js/shared/utils.js",
  "./js/shared/db.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
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
          .filter((key) => key !== CACHE_NAME) // delete everything that isn't ours
          .map((key) => {
            console.log('[SW taxi-crm] Deleting foreign cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim()) // claim all open tabs immediately
  );
});

// FETCH: cache-first, network fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
