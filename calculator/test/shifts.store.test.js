import test from 'node:test';
import assert from 'node:assert';
import { ShiftsStore, SHIFT_STATUS } from '../js/shifts.store.js';
import { TripsStore } from '../js/trips.store.js';

test('ShiftsStore: openShift stores a normalised record with a local stamp', async () => {
  const store = new ShiftsStore();
  await store.ready;

  const at = new Date(2026, 7, 19, 6, 5); // 19 Aug 2026, 06:05 local
  const shift = await store.openShift({ odoStart: 142500, normTarget: 13 }, at);

  assert.strictEqual(shift.status, SHIFT_STATUS.OPEN);
  assert.strictEqual(shift.date, '2026-08-19');
  assert.strictEqual(shift.startedAt, '2026-08-19T06:05', 'local wall clock, not UTC');
  assert.strictEqual(shift.endedAt, null);
  assert.strictEqual(shift.odoStart, 142500);
  assert.strictEqual(shift.odoEnd, null);
  assert.strictEqual(shift.normTarget, 13);
  assert.strictEqual(store.getOpenShift().id, shift.id);
});

test('ShiftsStore: a second openShift throws while one is still open', async () => {
  const store = new ShiftsStore();
  await store.ready;
  const first = await store.openShift({}, new Date(2026, 7, 19, 6, 0));

  await assert.rejects(
    () => store.openShift({}, new Date(2026, 7, 19, 7, 0)),
    /is still open/
  );

  await store.closeShift(first.id, {}, new Date(2026, 7, 19, 20, 0));
  const second = await store.openShift({}, new Date(2026, 7, 19, 21, 0));
  assert.strictEqual(second.status, SHIFT_STATUS.OPEN);
  assert.strictEqual(store.shifts.length, 2);
});

test('ShiftsStore: a night shift keeps one date across midnight', async () => {
  const store = new ShiftsStore();
  await store.ready;

  const shift = await store.openShift({}, new Date(2026, 7, 19, 22, 30));
  const closed = await store.closeShift(shift.id, {}, new Date(2026, 7, 20, 3, 15));

  assert.strictEqual(closed.date, '2026-08-19', 'the shift belongs to the day it started');
  assert.strictEqual(closed.endedAt, '2026-08-20T03:15');
  assert.strictEqual(closed.status, SHIFT_STATUS.CLOSED);
});

test('ShiftsStore: closing rejects an odometer that runs backwards', async () => {
  const store = new ShiftsStore();
  await store.ready;
  const shift = await store.openShift({ odoStart: 142500 });

  await assert.rejects(() => store.closeShift(shift.id, { odoEnd: 142400 }), /below odoStart/);
  assert.strictEqual(store.getShiftById(shift.id).status, SHIFT_STATUS.OPEN, 'stays open after a rejected close');

  await store.closeShift(shift.id, { odoEnd: 142780 });
  assert.strictEqual(store.getShiftDistance(shift.id), 280);
});

test('ShiftsStore: closing twice throws, unknown id throws', async () => {
  const store = new ShiftsStore();
  await store.ready;
  const shift = await store.openShift({});
  await store.closeShift(shift.id, {});

  await assert.rejects(() => store.closeShift(shift.id, {}), /already closed/);
  await assert.rejects(() => store.closeShift('nope', {}), /unknown shift/);
});

test('ShiftsStore: garbage odometer values become null, not NaN', async () => {
  const store = new ShiftsStore();
  await store.ready;

  const shift = await store.openShift({ odoStart: 'not a number' });
  assert.strictEqual(shift.odoStart, null);

  const patched = await store.updateShift(shift.id, { odoStart: -5, normTarget: '11' });
  assert.strictEqual(patched.odoStart, null, 'a negative odometer is not a reading');
  assert.strictEqual(patched.normTarget, 11);
  assert.strictEqual(store.getShiftDistance(shift.id), null);
});

test('ShiftsStore: replaceAllShifts restores a snapshot and re-sorts newest first', async () => {
  const store = new ShiftsStore();
  await store.ready;

  await store.replaceAllShifts([
    { id: 's-1', startedAt: '2026-08-17T07:00', endedAt: '2026-08-17T19:00', status: 'closed', odoStart: 100, odoEnd: 400 },
    { id: 's-2', startedAt: '2026-08-19T06:00', status: 'open' }
  ]);

  assert.deepStrictEqual(store.shifts.map(s => s.id), ['s-2', 's-1']);
  assert.strictEqual(store.getOpenShift().id, 's-2');
  assert.strictEqual(store.getShiftsForDate('2026-08-17').length, 1);
  await assert.rejects(() => store.replaceAllShifts('nope'), /array required/);
});

test('ShiftsStore: status is inferred from endedAt when a restored row omits it', async () => {
  const store = new ShiftsStore();
  await store.ready;

  await store.replaceAllShifts([
    { id: 's-ended', startedAt: '2026-08-18T07:00', endedAt: '2026-08-18T20:00' },
    { id: 's-running', startedAt: '2026-08-19T07:00' }
  ]);

  assert.strictEqual(store.getShiftById('s-ended').status, SHIFT_STATUS.CLOSED);
  assert.strictEqual(store.getShiftById('s-running').status, SHIFT_STATUS.OPEN);
});

test('ShiftsStore + TripsStore: trips attach to a shift that survives midnight', async () => {
  const shifts = new ShiftsStore();
  const trips = new TripsStore();
  await Promise.all([shifts.ready, trips.ready]);
  await trips.replaceAllTrips([]);

  const shift = await shifts.openShift({ normTarget: 13 }, new Date(2026, 7, 19, 21, 0));

  const evening = await trips.addTrip({ clientName: 'Late one', date: '2026-08-19', time: '23:40', price: 60 });
  const afterMidnight = await trips.addTrip({ clientName: 'Night one', date: '2026-08-20', time: '01:20', price: 80 });
  const otherDay = await trips.addTrip({ clientName: 'Not mine', date: '2026-08-21', time: '10:00', price: 50 });

  await trips.assignTripToShift(evening.id, shift.id);
  await trips.assignTripToShift(afterMidnight.id, shift.id);

  const ofShift = trips.getTripsForShift(shift.id);
  assert.strictEqual(ofShift.length, 2, 'both sides of midnight belong to one shift');
  assert.deepStrictEqual(ofShift.map(t => t.clientName).sort(), ['Late one', 'Night one']);
  assert.strictEqual(trips.getTripsForShift(null).length, 0);
  assert.strictEqual(otherDay.shiftId, null);

  // Detaching is the same call with null.
  await trips.assignTripToShift(evening.id, null);
  assert.strictEqual(trips.getTripsForShift(shift.id).length, 1);
  await assert.rejects(() => trips.assignTripToShift('nope', shift.id), /unknown trip/);
});
