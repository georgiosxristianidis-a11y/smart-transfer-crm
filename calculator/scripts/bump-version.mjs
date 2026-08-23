#!/usr/bin/env node
/**
 * Auto-bump the patch version when application sources are committed.
 *
 * Tool-agnostic on purpose: this used to be a Claude Code PostToolUse hook, so it
 * stopped existing the moment another agent did the typing. Git is the only thing
 * every agent goes through, so the bump lives in the pre-commit hook.
 *
 * Bumping also re-runs build:sw, because CACHE_NAME follows the package version:
 * a shipped source change that does not bust the cache is an offline-stale build.
 *
 * Usage: node scripts/bump-version.mjs --staged
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

if (!process.argv.includes('--staged')) {
  console.error('bump-version: expected --staged');
  process.exit(2);
}

const git = (args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean);

const isSource = (f) =>
  /^calculator\/(js|css|test|scripts)\/.+/.test(f) ||
  /^calculator\/(index\.html|sw\.js|manifest\.json|kill-sw\.html)$/.test(f);

const isExcluded = (f) =>
  /node_modules|\.lighthouseci|\/docs\/|\.md$|package(-lock)?\.json$/.test(f);

const touched = staged.filter((f) => isSource(f) && !isExcluded(f));
if (touched.length === 0) process.exit(0);

const pkgPath = path.join(root, 'package.json');
const text = fs.readFileSync(pkgPath, 'utf8');
const m = /"version"\s*:\s*"(\d+)\.(\d+)\.(\d+)"/.exec(text);
if (!m) {
  console.error('bump-version: no semver version in package.json');
  process.exit(1);
}

const [, major, minor, patch] = m;
const current = `${major}.${minor}.${patch}`;
const next = `${major}.${minor}.${Number(patch) + 1}`;

// Point replacement, so the file is not reformatted by a JSON round-trip.
fs.writeFileSync(
  pkgPath,
  text.replace(/("version"\s*:\s*")\d+\.\d+\.\d+(")/, `$1${next}$2`)
);

execFileSync(process.execPath, [path.join(root, 'scripts', 'build-sw.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

git(['add', '--', 'calculator/package.json', 'calculator/sw.js']);

console.log(`[bump-version] ${current} -> ${next} (${touched.length} source file(s))`);
