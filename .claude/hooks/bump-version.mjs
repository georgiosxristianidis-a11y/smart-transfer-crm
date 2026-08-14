#!/usr/bin/env node
/**
 * PostToolUse hook: patch-бамп version в calculator/package.json.
 *
 * Срабатывает на Write/Edit файлов исходников приложения.
 * Игнорирует: package.json (иначе рекурсия), docs/**, *.md,
 * node_modules, .lighthouseci, и всё вне calculator/.
 *
 * semver в файле: 1.0.1 → 1.0.2. Человекочитаемая форма: v1.01.
 */

import fs from 'node:fs';
import path from 'node:path';

const read = (stream) =>
  new Promise((resolve) => {
    let buf = '';
    stream.setEncoding('utf8');
    stream.on('data', (c) => (buf += c));
    stream.on('end', () => resolve(buf));
  });

const raw = await read(process.stdin);

let payload;
try {
  payload = JSON.parse(raw || '{}');
} catch {
  process.exit(0);
}

const filePath =
  payload?.tool_response?.filePath || payload?.tool_input?.file_path || '';
if (!filePath) process.exit(0);

const posix = filePath.replace(/\\/g, '/');

// Только исходники приложения.
const isSource =
  /\/calculator\/(js|css|test|scripts)\/[^/]+/.test(posix) ||
  /\/calculator\/(index\.html|sw\.js|manifest\.json|kill-sw\.html)$/.test(posix);

const isExcluded =
  /node_modules|\.lighthouseci|\/docs\/|\.md$|package(-lock)?\.json$/.test(posix);

if (!isSource || isExcluded) process.exit(0);

// Корень пакета = путь до сегмента /calculator включительно.
const marker = posix.lastIndexOf('/calculator/');
if (marker === -1) process.exit(0);
const pkgPath = path.join(posix.slice(0, marker + '/calculator'.length), 'package.json');

if (!fs.existsSync(pkgPath)) process.exit(0);

let pkg;
let text;
try {
  text = fs.readFileSync(pkgPath, 'utf8');
  pkg = JSON.parse(text);
} catch {
  process.exit(0);
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version ?? '');
if (!m) process.exit(0);

const [, major, minor, patch] = m;
const next = `${major}.${minor}.${Number(patch) + 1}`;

// Точечная замена, чтобы не переформатировать весь файл.
const updated = text.replace(
  /("version"\s*:\s*")\d+\.\d+\.\d+(")/,
  `$1${next}$2`
);
if (updated === text) process.exit(0);

fs.writeFileSync(pkgPath, updated);

// Отображаемая форма: 1.0.2 → v1.02
const display = `v${major}.${String(Number(minor) * 100 + Number(patch) + 1).padStart(2, '0')}`;

process.stdout.write(
  JSON.stringify({
    systemMessage: `version ${pkg.version} → ${next}  (${display})`,
    suppressOutput: true,
  })
);
