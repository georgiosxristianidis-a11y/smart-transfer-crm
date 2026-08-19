import test from 'node:test';
import assert from 'node:assert';
import { selectNormTrips, formatElapsed, formatStartTime } from '../js/shifts.view.js';

test('selectNormTrips: with an open shift, counts only that shift\'s completed trips', () => {
  const shift = { id: 'shift-1' };
  const trips = [
    { shiftId: 'shift-1', status: 'completed', date: '2026-08-19' },
    { shiftId: 'shift-1', status: 'active', date: '2026-08-19' },
    { shiftId: 'shift-2', status: 'completed', date: '2026-08-19' },
    { shiftId: null, status: 'completed', date: '2026-08-19' }
  ];

  const result = selectNormTrips(trips, shift, '2026-08-19');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].shiftId, 'shift-1');
});

test('selectNormTrips: a shift crossing midnight is not split by date', () => {
  const shift = { id: 'shift-1' };
  const trips = [
    { shiftId: 'shift-1', status: 'completed', date: '2026-08-19' }, // before midnight
    { shiftId: 'shift-1', status: 'completed', date: '2026-08-20' }  // after midnight, same shift
  ];

  const result = selectNormTrips(trips, shift, '2026-08-20');
  assert.strictEqual(result.length, 2, 'both trips belong to the running shift regardless of calendar date');
});

test('selectNormTrips: with no open shift, falls back to today by date — prior behaviour', () => {
  const trips = [
    { shiftId: null, status: 'completed', date: '2026-08-19' },
    { shiftId: null, status: 'completed', date: '2026-08-18' },
    { shiftId: null, status: 'active', date: '2026-08-19' }
  ];

  const result = selectNormTrips(trips, null, '2026-08-19');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].date, '2026-08-19');
});

test('formatElapsed: hours and minutes since a local startedAt stamp', () => {
  const startedAt = '2026-08-19T22:00';
  const now = new Date(2026, 7, 20, 0, 31); // 20 Aug 2026, 00:31 local — crosses midnight
  assert.strictEqual(formatElapsed(startedAt, now), '2 ч 31 мин');
});

test('formatElapsed: never goes negative on a clock skew', () => {
  const startedAt = '2026-08-19T22:00';
  const now = new Date(2026, 7, 19, 21, 0); // before the shift started
  assert.strictEqual(formatElapsed(startedAt, now), '0 ч 00 мин');
});

test('formatElapsed: empty or malformed input yields an empty string, not a crash', () => {
  assert.strictEqual(formatElapsed(''), '');
  assert.strictEqual(formatElapsed(null), '');
  assert.strictEqual(formatElapsed('not-a-date'), '');
});

test('formatStartTime: HH:MM out of a local startedAt stamp', () => {
  assert.strictEqual(formatStartTime('2026-08-19T22:05'), '22:05');
  assert.strictEqual(formatStartTime(''), '');
  assert.strictEqual(formatStartTime(null), '');
});
