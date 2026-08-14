import test from 'node:test';
import assert from 'node:assert';
import { TripsStore } from '../js/trips.store.js';

test('TripsStore: CRUD and sorting', async () => {
  const store = new TripsStore();
  
  // Wait for initial load to finish (which is mocked out in node)
  await new Promise(r => setTimeout(r, 10));

  const trip1 = await store.addTrip({
    clientName: 'Alice',
    date: '2026-08-15',
    time: '14:00',
    price: 50
  });

  const trip2 = await store.addTrip({
    clientName: 'Bob',
    date: '2026-08-14',
    time: '09:00',
    price: 100
  });

  assert.strictEqual(store.trips.length, 2);
  // Should sort by date/time, so Bob (Aug 14) is before Alice (Aug 15)
  assert.strictEqual(store.trips[0].clientName, 'Bob');
  
  await store.updateTripStatus(trip2.id, 'completed');
  assert.strictEqual(store.trips[0].status, 'completed');

  await store.deleteTrip(trip1.id);
  assert.strictEqual(store.trips.length, 1);
});

test('TripsStore: Analytics', async () => {
  const store = new TripsStore();
  await new Promise(r => setTimeout(r, 10));

  await store.addTrip({ date: '2026-08-14', time: '10:00', price: 100, status: 'completed' });
  await store.addTrip({ date: '2026-08-14', time: '11:00', price: 50, status: 'pending' });
  await store.addTrip({ date: '2026-07-10', time: '10:00', price: 200, status: 'completed' });

  // 7 is August (0-indexed)
  const augRev = store.getCompletedRevenueForMonth(2026, 7);
  assert.strictEqual(augRev, 100, 'Only completed trips in August should count');

  const julRev = store.getCompletedRevenueForMonth(2026, 6);
  assert.strictEqual(julRev, 200);
});

test('TripsStore: GCal Link generation', async () => {
  const store = new TripsStore();
  const trip = {
    clientName: 'John & Jane',
    date: '2026-08-14',
    time: '15:30',
    pickup: 'HER Airport',
    dropoff: 'Elounda',
    price: 120
  };

  const link = store.generateGCalLink(trip);
  assert.ok(link.includes('John%20%26%20Jane'), 'Encodes ampersand');
  assert.ok(link.includes('HER%20Airport'), 'Encodes location');
  // ISO conversion in Node might use local timezone which is unpredictable in tests
  // But we can check for the base URL
  assert.ok(link.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
});

test('FlightService: Code extraction & Status resolving', async () => {
  const { FlightService } = await import('../js/shared/flight.service.js');
  
  // Test code parsing
  assert.strictEqual(FlightService.extractFlightCode('John Doe, U2 4531'), 'U24531');
  assert.strictEqual(FlightService.extractFlightCode('Flight A3 312 VIP'), 'A3312');
  assert.strictEqual(FlightService.extractFlightCode('FR8214 from London'), 'FR8214');
  assert.strictEqual(FlightService.extractFlightCode('No flight here'), null);

  // Test radar URL
  const radarUrl = FlightService.getFlightRadarUrl('U2 4531');
  assert.strictEqual(radarUrl, 'https://www.flightradar24.com/data/flights/U24531');

  // Test status resolver
  const tripWithFlight = {
    clientName: 'Alex, LH 1234',
    date: '2026-08-14',
    time: '18:00',
    pickup: 'HER Airport',
    dropoff: 'Chersonissos',
    price: 45
  };
  const statusRes = FlightService.resolveFlightStatus(tripWithFlight);
  assert.ok(statusRes !== null);
  assert.strictEqual(statusRes.flightCode, 'LH1234');
  assert.ok(['landed', 'ontime', 'delayed', 'scheduled'].includes(statusRes.status));

  // Test Navigation URL generator
  const navUrl = FlightService.getGoogleMapsNavUrl('Elounda Resort', 'HER Airport');
  assert.ok(navUrl.includes('destination=Elounda%20Resort'));
  assert.ok(navUrl.includes('origin=HER%20Airport'));
});

test('TripsStore: getNextUpcomingTrip', async () => {
  const store = new TripsStore();
  await new Promise(r => setTimeout(r, 10));

  // Use a fixed "now" so tests are deterministic regardless of real clock
  const refNow = new Date('2026-08-15T12:00:00');

  // Both trips are in the future relative to refNow
  const t1 = await store.addTrip({ date: '2026-08-15', time: '13:00', clientName: 'First' });
  const t2 = await store.addTrip({ date: '2026-08-15', time: '14:00', clientName: 'Second' });

  assert.strictEqual(store.getNextUpcomingTrip(refNow).id, t1.id, 'Returns earliest future trip');

  // Complete t1 — t2 becomes next
  await store.updateTripStatus(t1.id, 'completed');
  assert.strictEqual(store.getNextUpcomingTrip(refNow).id, t2.id, 'Returns next after completion');

  // Complete t2 — nothing left
  await store.updateTripStatus(t2.id, 'completed');
  assert.strictEqual(store.getNextUpcomingTrip(refNow), null, 'Returns null when all done');
});

test('TripsStore: getNextUpcomingTrip — past pending trips are excluded', async () => {
  const store = new TripsStore();
  await new Promise(r => setTimeout(r, 10));

  // Yesterday's trip left pending (driver forgot to mark it)
  const past = await store.addTrip({ date: '2026-08-14', time: '10:00', clientName: 'Stale' });
  // Today's upcoming trip
  const future = await store.addTrip({ date: '2026-08-15', time: '15:00', clientName: 'Upcoming' });

  const refNow = new Date('2026-08-15T12:00:00');

  // Must NOT return the stale past trip even though it is pending
  const next = store.getNextUpcomingTrip(refNow);
  assert.strictEqual(next.id, future.id, 'Past pending trip must not be returned');
  assert.notStrictEqual(next.id, past.id, 'Stale trip must be excluded');
});

test('TripsStore: schedule conflicts detection (<45 mins)', async () => {
  const store = new TripsStore();
  await new Promise(r => setTimeout(r, 10));

  // t1 at 10:00 and t2 at 10:30 (30 mins apart -> conflict!)
  const t1 = await store.addTrip({ date: '2026-08-14', time: '10:00', clientName: 'Trip 1' });
  const t2 = await store.addTrip({ date: '2026-08-14', time: '10:30', clientName: 'Trip 2' });
  // t3 at 12:00 (90 mins apart -> no conflict)
  const t3 = await store.addTrip({ date: '2026-08-14', time: '12:00', clientName: 'Trip 3' });

  const conflicts = store.getConflicts();
  assert.ok(conflicts.has(t1.id), 'Trip 1 has conflict');
  assert.ok(conflicts.has(t2.id), 'Trip 2 has conflict');
  assert.ok(!conflicts.has(t3.id), 'Trip 3 has no conflict');
});

test('FuelStore: Logging and metrics calculation', async () => {
  const { FuelStore } = await import('../js/fuel.store.js');
  const fuelStore = new FuelStore();

  const log1 = fuelStore.addFuelLog(50, 26.3, 'Shell');
  assert.strictEqual(log1.amount, 50);
  assert.strictEqual(log1.liters, 26.3);

  const metrics = fuelStore.getMetrics();
  assert.ok(metrics.todayAmount >= 50);
  assert.ok(metrics.monthAmount >= 50);
});


