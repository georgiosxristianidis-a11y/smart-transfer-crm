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
