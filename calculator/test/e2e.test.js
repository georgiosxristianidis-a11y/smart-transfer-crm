import test from 'node:test';
import assert from 'node:assert';
import { TripsStore } from '../js/trips.store.js';
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
