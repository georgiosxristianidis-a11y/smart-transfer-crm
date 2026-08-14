import fs from 'node:fs';
import path from 'node:path';

// Files to cache in the Service Worker
const assetsToCache = [
  './',
  './index.html',
  './css/tokens.css',
  './css/style.css',
  './js/app.js',
  './js/calculator.store.js',
  './js/calculator.view.js',
  './js/trips.store.js',
  './js/trips.view.js',
  './js/shared/utils.js',
  './js/shared/db.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&family=Unbounded:wght@400;600&display=swap'
];

const swPath = path.resolve('sw.js');
let swContent = fs.readFileSync(swPath, 'utf-8');

// Generate a cache name with a timestamp
const cacheName = `unit-calc-v${Date.now()}`;

// Replace ASSETS array and CACHE_NAME dynamically
swContent = swContent.replace(
  /const CACHE_NAME = '.*?';/,
  `const CACHE_NAME = '${cacheName}';`
);

swContent = swContent.replace(
  /const ASSETS = \[([\s\S]*?)\];/,
  `const ASSETS = ${JSON.stringify(assetsToCache, null, 2)};`
);

fs.writeFileSync(swPath, swContent);

console.log(`Service Worker updated with CACHE_NAME: ${cacheName}`);
