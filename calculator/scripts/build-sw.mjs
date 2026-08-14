import fs from 'node:fs';
import path from 'node:path';

// === Auto-scan local assets (never stale) ===
function collectFiles(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const rel = `${base}/${entry.name}`;
    if (entry.isDirectory()) {
      files = files.concat(collectFiles(path.join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1')), '..');

const localAssets = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  ...collectFiles(path.join(root, 'js'), './js'),
  ...collectFiles(path.join(root, 'css'), './css'),
];

// Single source of truth for Chart.js version
const CHART_VERSION = '4.4.1';

const externalAssets = [
  `https://cdn.jsdelivr.net/npm/chart.js@${CHART_VERSION}/dist/chart.umd.min.js`,
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@300;400;500;600;700&family=Unbounded:wght@400;600&display=swap'
];

const assetsToCache = [...localAssets, ...externalAssets];

// --- Patch sw.js ---
const swPath = path.join(root, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf-8').replace(/\r\n/g, '\n');

const cacheName = `unit-calc-v${Date.now()}`;

swContent = swContent.replace(
  /const CACHE_NAME = '.*?';/,
  `const CACHE_NAME = '${cacheName}';`
);

swContent = swContent.replace(
  /const ASSETS = \[[\s\S]*?\];/,
  `const ASSETS = ${JSON.stringify(assetsToCache, null, 2)};`
);

fs.writeFileSync(swPath, swContent);

console.log(`[build-sw] CACHE_NAME: ${cacheName}`);
console.log(`[build-sw] ${assetsToCache.length} assets cached`);
