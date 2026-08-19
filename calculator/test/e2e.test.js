import test from 'node:test';
import assert from 'node:assert';
import { TripsStore } from '../js/trips.store.js';
import { ShiftsStore } from '../js/shifts.store.js';
import { selectNormTrips } from '../js/shifts.view.js';
import { FuelStore } from '../js/fuel.store.js';
import { CalculatorStore } from '../js/calculator.store.js';
import { FlightService } from '../js/shared/flight.service.js';
import { BackupService } from '../js/shared/backup.service.js';
import { SCHEMA_VERSION } from '../js/shared/schema.js';

// Setup mock localStorage if running under Node without browser DOM
if (typeof global.localStorage === 'undefined' || !global.localStorage.getItem) {
  global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
  };
}

test('E2E: Full Airport Transfer & Flight Lifecycle Flow', async () => {
  const tripsStore = new TripsStore();
  await tripsStore.ready;

  // Clear any existing state
  await tripsStore.replaceAllTrips([]);

  // Driver receives 3 transfer bookings:
  // 1. Morning Aegean flight from HER airport
  // 2. Afternoon easyJet flight to Elounda
  // 3. Evening Ryanair flight from Chania airport
  const t1 = await tripsStore.addTrip({
    clientName: 'Nikos Papadopoulos',
    flightCode: 'A3 312',
    date: '2026-08-18',
    time: '09:30',
    pickup: 'HER Airport Terminal 1',
    dropoff: 'Hersonissos Grand Hotel',
    price: 45
  });

  const t2 = await tripsStore.addTrip({
    clientName: 'John Smith, U2 4531',
    date: '2026-08-18',
    time: '14:00',
    pickup: 'Heraklion Airport',
    dropoff: 'Elounda Beach Resort',
    price: 110
  });

  const t3 = await tripsStore.addTrip({
    clientName: 'Sarah Jenkins (FR8214)',
    date: '2026-08-18',
    time: '19:45',
    pickup: 'CHQ Airport',
    dropoff: 'Platanias',
    price: 60
  });

  // Verify trips were stored in chronological order
  assert.strictEqual(tripsStore.trips.length, 3);
  assert.strictEqual(tripsStore.trips[0].id, t1.id);
  assert.strictEqual(tripsStore.trips[1].id, t2.id);
  assert.strictEqual(tripsStore.trips[2].id, t3.id);

  // Next upcoming trip check for morning
  const fixedNow = new Date('2026-08-18T08:00:00');
  const next = tripsStore.getNextUpcomingTrip(fixedNow);
  assert.ok(next);
  assert.strictEqual(next.id, t1.id);

  // Resolve flight status for next trip
  const flightInfo1 = FlightService.resolveFlightStatus(next);
  assert.ok(flightInfo1);
  assert.strictEqual(flightInfo1.flightCode, 'A3312');
  assert.strictEqual(flightInfo1.radarUrl, 'https://www.flightradar24.com/data/flights/A3312');
  assert.strictEqual(flightInfo1.isAirport, true);

  // Resolve flight info extracted from client name in trip 2
  const flightInfo2 = FlightService.resolveFlightStatus(t2);
  assert.ok(flightInfo2);
  assert.strictEqual(flightInfo2.flightCode, 'U24531');
  assert.strictEqual(flightInfo2.radarUrl, 'https://www.flightradar24.com/data/flights/U24531');

  // Resolve flight info extracted from client name in trip 3
  const flightInfo3 = FlightService.resolveFlightStatus(t3);
  assert.ok(flightInfo3);
  assert.strictEqual(flightInfo3.flightCode, 'FR8214');
  assert.strictEqual(flightInfo3.radarUrl, 'https://www.flightradar24.com/data/flights/FR8214');

  // Verify navigation URLs
  const navUrl = FlightService.getGoogleMapsNavUrl(t1.dropoff, t1.pickup);
  assert.ok(navUrl.includes('destination=Hersonissos%20Grand%20Hotel'));
  assert.ok(navUrl.includes('origin=HER%20Airport%20Terminal%201'));

  // Complete first transfer
  await tripsStore.updateTripStatus(t1.id, 'completed');
  assert.strictEqual(tripsStore.trips.find(t => t.id === t1.id).status, 'completed');

  // Next trip is now trip 2
  const nextAfterT1 = tripsStore.getNextUpcomingTrip(fixedNow);
  assert.strictEqual(nextAfterT1.id, t2.id);
});

test('E2E: False-Positive Filtering (Addresses, Notes, Phones)', async () => {
  const tripsStore = new TripsStore();
  await tripsStore.ready;

  await tripsStore.replaceAllTrips([]);

  // Add trips with strings that previously triggered regex false positives
  const nonFlightTrip1 = await tripsStore.addTrip({
    clientName: 'Maria, Room 1205',
    date: '2026-08-18',
    time: '11:00',
    pickup: 'Creta Maris Resort, RM 1205',
    dropoff: 'Heraklion Center',
    price: 35
  });

  const nonFlightTrip2 = await tripsStore.addTrip({
    clientName: 'Dimitris (+30 694 1234567)',
    date: '2026-08-18',
    time: '12:00',
    pickup: 'ул. 25 Августа 1234, Heraklion',
    dropoff: 'Knossos Palace',
    price: 30
  });

  const nonFlightTrip3 = await tripsStore.addTrip({
    clientName: 'Group Transfer Pax 4 Order 5432',
    date: '2026-08-18',
    time: '15:00',
    pickup: 'Rethymno Old Town',
    dropoff: 'Balos Beach',
    price: 150
  });

  // Verify that NONE of these false-positive non-flight trips produce a flightCode or flightStatus
  assert.strictEqual(FlightService.resolveFlightStatus(nonFlightTrip1), null);
  assert.strictEqual(FlightService.resolveFlightStatus(nonFlightTrip2), null);
  assert.strictEqual(FlightService.resolveFlightStatus(nonFlightTrip3), null);
});

test('E2E: Backup Export, State Wipe, and Complete Restore Pipeline', async () => {
  const tripsStore = new TripsStore();
  const fuelStore = new FuelStore();
  const calcStore = new CalculatorStore();
  await tripsStore.ready;

  // Populate data
  await tripsStore.replaceAllTrips([
    { id: 'trip-e2e-1', clientName: 'George', flightCode: 'LH1234', date: '2026-08-18', time: '10:00', price: 80, status: 'completed' },
    { id: 'trip-e2e-2', clientName: 'Anna', flightCode: 'BA632', date: '2026-08-18', time: '16:00', price: 95, status: 'pending' }
  ]);

  fuelStore.replaceAllLogs([
    { id: 'fuel-e2e-1', date: '2026-08-18', time: '08:30', amount: 70, liters: 38.2, station: 'EKO' }
  ]);

  calcStore.replaceState({
    checkGross: 65,
    tripsPerDay: 12,
    licenseMode: 'eix'
  });

  // 1. Export backup snapshot
  const backup = BackupService.exportBackup({ tripsStore, fuelStore, calcStore });
  assert.strictEqual(backup.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(backup.trips.length, 2);
  assert.strictEqual(backup.fuelLogs.length, 1);
  assert.strictEqual(backup.calcState.licenseMode, 'eix');

  // 2. Clear all stores
  await tripsStore.replaceAllTrips([]);
  fuelStore.replaceAllLogs([]);
  calcStore.replaceState({ checkGross: 45, tripsPerDay: 8, licenseMode: 'edx' });

  assert.strictEqual(tripsStore.trips.length, 0);
  assert.strictEqual(fuelStore.logs.length, 0);
  assert.strictEqual(calcStore.state.licenseMode, 'edx');

  // 3. Import and restore state
  const restoreRes = await BackupService.importBackup(backup, { tripsStore, fuelStore, calcStore });
  assert.strictEqual(restoreRes.success, true);
  assert.strictEqual(restoreRes.stats.tripsCount, 2);
  assert.strictEqual(restoreRes.stats.fuelLogsCount, 1);

  // 4. Verify all data restored accurately
  assert.strictEqual(tripsStore.trips.length, 2);
  assert.strictEqual(tripsStore.trips[0].clientName, 'George');
  assert.strictEqual(tripsStore.trips[0].flightCode, 'LH1234');
  assert.strictEqual(fuelStore.logs.length, 1);
  assert.strictEqual(fuelStore.logs[0].amount, 70);
  assert.strictEqual(calcStore.state.licenseMode, 'eix');
  assert.strictEqual(calcStore.state.checkGross, 65);
});

test('E2E: Shift open -> trip -> close, norm survives midnight', async () => {
  const tripsStore = new TripsStore();
  const shiftsStore = new ShiftsStore();
  await tripsStore.ready;
  await shiftsStore.ready;
  await tripsStore.replaceAllTrips([]);
  await shiftsStore.replaceAllShifts([]);

  // Driver opens a shift at 22:00 with the odometer, norm pinned at open.
  const shift = await shiftsStore.openShift(
    { odoStart: 142500, normTarget: 13 },
    new Date(2026, 7, 19, 22, 0)
  );
  assert.strictEqual(shiftsStore.getOpenShift().id, shift.id);

  // Two trips land either side of midnight, both belong to the same shift.
  const t1 = await tripsStore.addTrip({
    clientName: 'Late Night Guest',
    date: '2026-08-19',
    time: '23:30',
    pickup: 'Airport',
    dropoff: 'Hotel A',
    price: 40,
    status: 'completed',
    shiftId: shift.id
  });
  const t2 = await tripsStore.addTrip({
    clientName: 'After Midnight Guest',
    date: '2026-08-20',
    time: '00:30',
    pickup: 'Airport',
    dropoff: 'Hotel B',
    price: 50,
    status: 'completed',
    shiftId: shift.id
  });
  assert.strictEqual(t1.shiftId, shift.id);
  assert.strictEqual(t2.shiftId, shift.id);

  // The norm is read at 00:31 local — the shift is still open, no reset.
  const openShift = shiftsStore.getOpenShift();
  const normTrips = selectNormTrips(tripsStore.trips, openShift, '2026-08-20');
  assert.strictEqual(normTrips.length, 2, 'both trips count toward the running shift, midnight or not');

  // Driver closes the shift with the finishing odometer.
  const closed = await shiftsStore.closeShift(shift.id, { odoEnd: 142780 }, new Date(2026, 7, 20, 3, 0));
  assert.strictEqual(closed.status, 'closed');
  assert.strictEqual(shiftsStore.getShiftDistance(shift.id), 280);
  assert.strictEqual(shiftsStore.getOpenShift(), null);

  // A trip created after the shift closes gets no shiftId — a shift never gates a trip.
  const t3 = await tripsStore.addTrip({
    clientName: 'No Shift Guest',
    date: '2026-08-20',
    time: '04:00',
    pickup: 'Airport',
    dropoff: 'Hotel C',
    price: 30,
    status: 'completed',
    shiftId: shiftsStore.getOpenShift() ? shiftsStore.getOpenShift().id : null
  });
  assert.strictEqual(t3.shiftId, null);
});

test('E2E: trips imported before the shift still count once the driver completes them', async () => {
  const tripsStore = new TripsStore();
  const shiftsStore = new ShiftsStore();
  await tripsStore.ready;
  await shiftsStore.ready;
  await tripsStore.replaceAllTrips([]);
  await shiftsStore.replaceAllShifts([]);

  // The hotel list arrives the night before: no shift exists yet, so no shiftId.
  const a = await tripsStore.addTrip({
    clientName: 'Hotel List Guest A', date: '2026-08-20', time: '09:00',
    pickup: 'Hotel', dropoff: 'HER Airport', price: 45
  });
  const b = await tripsStore.addTrip({
    clientName: 'Hotel List Guest B', date: '2026-08-20', time: '11:00',
    pickup: 'Hotel', dropoff: 'HER Airport', price: 55
  });
  assert.strictEqual(a.shiftId, null);
  assert.strictEqual(b.shiftId, null);

  // Morning: the driver opens the shift.
  const shift = await shiftsStore.openShift({ normTarget: 13 }, new Date(2026, 7, 20, 8, 0));

  // The norm is empty before anything is completed — and does not count
  // yesterday's pending list as work already done.
  assert.strictEqual(selectNormTrips(tripsStore.trips, shift, '2026-08-20').length, 0);

  // The driver finishes the first trip: it binds to the running shift on completion.
  await tripsStore.assignTripToShift(a.id, shift.id);
  await tripsStore.updateTripStatus(a.id, 'completed');

  const counted = selectNormTrips(tripsStore.trips, shift, '2026-08-20');
  assert.strictEqual(counted.length, 1, 'a trip typed in before the shift still counts toward it');
  assert.strictEqual(counted[0].id, a.id);

  // The untouched one stays out of the count until it is actually done.
  assert.strictEqual(tripsStore.trips.find(t => t.id === b.id).shiftId, null);
});
