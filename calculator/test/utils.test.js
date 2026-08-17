import test from 'node:test';
import assert from 'node:assert';
import { localDateKey, parseLocalDate } from '../js/shared/utils.js';

test('utils: localDateKey formats local dates correctly as YYYY-MM-DD', () => {
  const d = new Date(2026, 7, 15, 14, 30); // 15 Aug 2026 14:30 local
  assert.strictEqual(localDateKey(d), '2026-08-15');

  const dSingleDigit = new Date(2026, 0, 5, 9, 5); // 5 Jan 2026 09:05 local
  assert.strictEqual(localDateKey(dSingleDigit), '2026-01-05');
});

test('utils: localDateKey does not shift back to previous day for early morning hours', () => {
  // Simulate 01:30 AM local time on August 15th
  // In UTC+3 (Crete), this is 22:30 on August 14th UTC.
  // localDateKey must return August 15th, not August 14th.
  const d = new Date(2026, 7, 15, 1, 30, 0);
  assert.strictEqual(localDateKey(d), '2026-08-15');
});

test('utils: parseLocalDate returns date at local midnight matching year, month, day', () => {
  const parsed = parseLocalDate('2026-08-01');
  assert.strictEqual(parsed.getFullYear(), 2026);
  assert.strictEqual(parsed.getMonth(), 7); // 0-indexed August
  assert.strictEqual(parsed.getDate(), 1);
  assert.strictEqual(parsed.getHours(), 0);
});

test('utils: parseLocalDate handles year-end and leap dates cleanly', () => {
  const leap = parseLocalDate('2024-02-29');
  assert.strictEqual(leap.getFullYear(), 2024);
  assert.strictEqual(leap.getMonth(), 1);
  assert.strictEqual(leap.getDate(), 29);

  const yearEnd = parseLocalDate('2026-12-31');
  assert.strictEqual(yearEnd.getFullYear(), 2026);
  assert.strictEqual(yearEnd.getMonth(), 11);
  assert.strictEqual(yearEnd.getDate(), 31);
});

test('utils: parseLocalDate graceful fallback for invalid/empty input', () => {
  const fallbackNull = parseLocalDate(null);
  assert.ok(fallbackNull instanceof Date);

  const fallbackEmpty = parseLocalDate('');
  assert.ok(fallbackEmpty instanceof Date);
});
