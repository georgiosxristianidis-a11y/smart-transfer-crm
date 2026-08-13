const CACHE_NAME = 'unit-calc-v1786661754642';
const ASSETS = [
  "./",
  "./index.html",
  "./css/tokens.css",
  "./css/style.css",
  "./js/app.js",
  "./js/calculator.store.js",
  "./js/calculator.view.js",
  "./js/shared/utils.js",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&family=Unbounded:wght@400;600&display=swap"
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
