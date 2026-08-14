#!/usr/bin/env node
/**
 * Гейт бюджета системных документов.
 *
 * Правило без числа и без проверки не работает. Здесь число и проверка.
 * Печатает 0 при соблюдении бюджета, иначе — список нарушителей и код выхода 1.
 *
 * Считаются СИМВОЛЫ, не байты: кириллица в UTF-8 весит два байта,
 * а в токенах — примерно один символ на пол-токена.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** файл → максимум символов */
const BUDGET = {
  'CLAUDE.md': 2000,
  'NEXT_SESSION.md': 1500,
  'docs/handoff/QUEUE.md': 4000,
  'docs/handoff/PROTOCOL.md': 6000,
  'docs/NAV_SPEC.md': 12000,
  'docs/RULES.md': 3500,
};

/** каталог → максимум символов на каждый файл внутри */
const PER_FILE_BUDGET = {
  'docs/handoff/cards': 2000,
};

/**
 * Читаем с нормализацией переводов строк: git отдаёт CRLF в одном worktree
 * и LF в другом, а лишний \r на строку сдвигал счёт на десятки символов.
 */
const read = (abs) => fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');

const rows = [];

for (const [rel, limit] of Object.entries(BUDGET)) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  rows.push([rel, read(abs).length, limit]);
}

for (const [dir, limit] of Object.entries(PER_FILE_BUDGET)) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const name of fs.readdirSync(abs)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(abs, name);
    if (!fs.statSync(file).isFile()) continue;
    rows.push([`${dir}/${name}`, read(file).length, limit]);
  }
}

const over = rows.filter(([, size, limit]) => size > limit);

/** Cyrillic tokenises at ~2 chars/token, Latin + markup at ~3.5. */
const estimateTokens = (text) => {
  const cyr = (text.match(/[Ѐ-ӿ]/g) || []).length;
  return Math.round(cyr / 2 + (text.length - cyr) / 3.5);
};

if (over.length === 0) {
  const total = rows.reduce((sum, [, size]) => sum + size, 0);
  const tokens = rows.reduce((sum, [rel]) => {
    const abs = path.join(root, rel);
    return sum + (fs.existsSync(abs) ? estimateTokens(read(abs)) : 0);
  }, 0);
  console.log(`docs budget OK — ${rows.length} файлов, ${total} символов (~${tokens} токенов)`);
  console.log(0);
  process.exit(0);
}

console.error('ПРЕВЫШЕН БЮДЖЕТ ДОКУМЕНТОВ:\n');
for (const [rel, size, limit] of over) {
  console.error(`  ${rel} — ${size} симв, лимит ${limit} (лишних ${size - limit})`);
}
console.error('\nСократить или перенести содержание в карточку. Лимит — не пожелание.');
process.exit(1);
