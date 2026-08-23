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

// Root-level static files are picked up by extension, never by guesswork.
// Precedent: './favicon.ico' was listed here while only favicon.svg existed —
// one 404 rejects the whole cache.addAll(), and the app silently loses offline.
const rootAssets = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isFile() && /\.(svg|ico|png|webmanifest)$/.test(e.name))
  .map((e) => `./${e.name}`);

const localAssets = [
  './',
  './index.html',
  './manifest.json',
  ...rootAssets,
  ...collectFiles(path.join(root, 'js'), './js'),
  ...collectFiles(path.join(root, 'css'), './css'),
];

// Every local asset must exist on disk, or install() fails at runtime instead of here.
const missing = localAssets
  .filter((a) => a !== './')
  .filter((a) => !fs.existsSync(path.join(root, a.slice(2))));

if (missing.length > 0) {
  console.error(`[build-sw] missing local assets: ${missing.join(', ')}`);
  process.exit(1);
}

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

// Cache name follows the package version, not the clock: the auto-bump on commit
// is what busts the cache, so a rebuild without a change produces no new cache.
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const cacheName = `unit-calc-v${pkg.version}`;

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
