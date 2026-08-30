import test from 'node:test';
import assert from 'node:assert';
import {
  selectNormTrips,
  formatElapsed,
  formatStartTime,
  formatShiftDuration,
  formatShiftTimeRange,
  formatShiftDistance
} from '../js/shifts.view.js';

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

test('formatShiftDuration: calculates hours and minutes between start and end stamps', () => {
  assert.strictEqual(formatShiftDuration('2026-08-19T08:00', '2026-08-19T17:45'), '9 ч 45 мин');
  assert.strictEqual(formatShiftDuration('2026-08-19T22:00', '2026-08-20T04:15'), '6 ч 15 мин');
  assert.strictEqual(formatShiftDuration('2026-08-19T10:00', '2026-08-19T09:00'), '0 ч 00 мин');
  assert.strictEqual(formatShiftDuration('', '2026-08-19T17:45'), '');
  assert.strictEqual(formatShiftDuration('2026-08-19T08:00', null), '');
  assert.strictEqual(formatShiftDuration('garbage', '2026-08-19T17:45'), '');
});

test('formatShiftTimeRange: formats start and end time as HH:MM – HH:MM', () => {
  assert.strictEqual(formatShiftTimeRange('2026-08-19T08:30:00', '2026-08-19T18:00:00'), '08:30 – 18:00');
  assert.strictEqual(formatShiftTimeRange('2026-08-19T22:00', ''), 'с 22:00');
  assert.strictEqual(formatShiftTimeRange('', ''), '');
  assert.strictEqual(formatShiftTimeRange(null, null), '');
});

test('formatShiftDistance: formats non-negative distance as +N км and null as —', () => {
  assert.strictEqual(formatShiftDistance(140), '+140 км');
  assert.strictEqual(formatShiftDistance(0), '+0 км');
  assert.strictEqual(formatShiftDistance(null), '—');
  assert.strictEqual(formatShiftDistance(undefined), '—');
  assert.strictEqual(formatShiftDistance(NaN), '—');
});

test('ShiftsView: renderHistory renders closed shifts with distance and duration into DOM', async () => {
  const { ShiftsView } = await import('../js/shifts.view.js');
  const elements = {};
  const mockDoc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          textContent: '',
          innerHTML: '',
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            toggle(c, force) {
              if (force === undefined) {
                if (this.classes.has(c)) this.classes.delete(c);
                else this.classes.add(c);
              } else if (force) {
                this.classes.add(c);
              } else {
                this.classes.delete(c);
              }
            },
            contains(c) { return this.classes.has(c); }
          },
          addEventListener() {}
        };
      }
      return elements[id];
    }
  };

  const oldDoc = global.document;
  global.document = mockDoc;

  try {
    const mockStore = {
      shifts: [
        {
          id: 'shift-1',
          date: '2026-08-19',
          startedAt: '2026-08-19T08:00',
          endedAt: '2026-08-19T18:00',
          status: 'closed',
          odoStart: 1000,
          odoEnd: 1150
        }
      ],
      getOpenShift() { return null; },
      getShiftDistance(id) { return id === 'shift-1' ? 150 : null; },
      subscribe(fn) { fn(); }
    };

    const view = new ShiftsView(mockStore, {});
    const historyList = elements['shifts-history-list'];
    assert.ok(historyList.innerHTML.includes('+150 км'));
    assert.ok(historyList.innerHTML.includes('1000 → 1150 км'));
    assert.ok(historyList.innerHTML.includes('08:00 – 18:00'));
    assert.ok(historyList.innerHTML.includes('10 ч 00 мин'));

    if (view._tick) clearInterval(view._tick);
  } finally {
    global.document = oldDoc;
  }
});
