import test from 'node:test';
import assert from 'node:assert';
import { exportAll, importAll } from '../js/shared/backup.js';
import { SCHEMA_VERSION, UnknownSchemaVersionError } from '../js/shared/schema.js';

// Stub stores — in-Node round-trip test doesn't need real IndexedDB/localStorage,
// only the interface backup.js relies on: get*Snapshot / replace*.
function makeStubs(seed = {}) {
  const state = { calc: seed.calc ?? {}, trips: seed.trips ?? [], logs: seed.logs ?? [] };
  return {
    state,
    calculatorStore: {
      getStateSnapshot: () => ({ ...state.calc }),
      replaceState: (next) => { state.calc = { ...state.calc, ...next }; }
    },
    tripsStore: {
      getAllTripsSnapshot: () => state.trips.map(t => ({ ...t })),
      replaceAllTrips: async (list) => { state.trips = list.map(t => ({ ...t })); }
    },
    fuelStore: {
      getAllLogsSnapshot: () => state.logs.map(l => ({ ...l })),
      replaceAllLogs: (list) => { state.logs = list.map(l => ({ ...l })); }
    }
  };
}

test('backup: envelope shape has all required keys', () => {
  const stubs = makeStubs();
  const now = new Date('2026-08-15T12:00:00.000Z');
  const json = exportAll(stubs, now);
  const env = JSON.parse(json);
  assert.deepStrictEqual(
    Object.keys(env).sort(),
    ['calcState', 'exportedAt', 'fuelLogs', 'schemaVersion', 'trips']
  );
  assert.strictEqual(env.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(env.exportedAt, '2026-08-15T12:00:00.000Z');
});

test('backup: round-trip export → wipe → import restores state byte-identically', async () => {
  const seed = {
    calc: { checkGross: 42, tripsPerDay: 11, ownersCount: 3 },
    trips: [
      { id: 'trip-a', clientName: 'Anna', date: '2026-08-20', time: '10:00', pickup: 'HER', dropoff: 'CHQ', price: 120, status: 'pending', source: 'hotel', createdAt: 1 },
      { id: 'trip-b', clientName: 'Boris', date: '2026-08-21', time: '14:30', pickup: 'HER', dropoff: 'REZ', price: 90, status: 'completed', source: 'web', createdAt: 2 }
    ],
    logs: [
      { id: 'fuel-1', date: '2026-08-15', time: '08:30', amount: 50, liters: 26.3, station: 'BP' }
    ]
  };
  const source = makeStubs(seed);
  const json = exportAll(source);

  const target = makeStubs(); // empty — represents post-Clear-Site-Data
  await importAll(json, target);

  assert.deepStrictEqual(target.state.calc, seed.calc);
  assert.deepStrictEqual(target.state.trips, seed.trips);
  assert.deepStrictEqual(target.state.logs, seed.logs);
});

test('backup: importAll rejects future schemaVersion before touching any store', async () => {
  const target = makeStubs({ calc: { checkGross: 99 } });
  const future = JSON.stringify({
    schemaVersion: SCHEMA_VERSION + 1,
    exportedAt: 'x', calcState: {}, trips: [], fuelLogs: []
  });
  await assert.rejects(() => importAll(future, target), UnknownSchemaVersionError);
  // Untouched.
  assert.strictEqual(target.state.calc.checkGross, 99);
});

test('backup: importAll rejects payload with wrong types (no schema drift)', async () => {
  const target = makeStubs();
  const bad = JSON.stringify({
    schemaVersion: SCHEMA_VERSION, exportedAt: 'x',
    calcState: {}, trips: 'not-array', fuelLogs: []
  });
  await assert.rejects(() => importAll(bad, target), /trips must be array/);
});

test('backup: importAll rejects missing schemaVersion', async () => {
  const target = makeStubs();
  const bad = JSON.stringify({ exportedAt: 'x', calcState: {}, trips: [], fuelLogs: [] });
  await assert.rejects(() => importAll(bad, target), /missing schemaVersion/);
});

test('backup: importAll rejects malformed JSON', async () => {
  const target = makeStubs();
  await assert.rejects(() => importAll('{not-json', target), /invalid JSON/);
});

// --- persistence envelopes on real stores ---
function mockLocalStorage() {
  const map = new Map();
  const ls = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear()
  };
  global.window = { localStorage: ls };
  global.localStorage = ls;
  return ls;
}

test('calculator.store: saves envelope with schemaVersion; loads envelope back', async () => {
  const ls = mockLocalStorage();
  const { CalculatorStore } = await import('../js/calculator.store.js');

  const store = new CalculatorStore();
  store.update({ checkGross: 77 });

  const raw = ls.getItem('taxi_calc_state');
  const env = JSON.parse(raw);
  assert.strictEqual(env.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(env.state.checkGross, 77);

  const reloaded = new CalculatorStore();
  assert.strictEqual(reloaded.state.checkGross, 77);
});

test('calculator.store: legacy bare-state payload still loads (v1 back-compat)', async () => {
  const ls = mockLocalStorage();
  // Simulate an old save written before the envelope existed.
  ls.setItem('taxi_calc_state', JSON.stringify({ checkGross: 55, tripsPerDay: 9 }));
  const { CalculatorStore } = await import('../js/calculator.store.js');
  const store = new CalculatorStore();
  assert.strictEqual(store.state.checkGross, 55);
  assert.strictEqual(store.state.tripsPerDay, 9);
});

test('calculator.store: unknown-future schemaVersion is rejected (defaults, no merge)', async () => {
  const ls = mockLocalStorage();
  ls.setItem('taxi_calc_state', JSON.stringify({
    schemaVersion: SCHEMA_VERSION + 99,
    state: { checkGross: 999 }
  }));
  const { CalculatorStore } = await import('../js/calculator.store.js');
  // Silence expected error output.
  const origErr = console.error; console.error = () => {};
  try {
    const store = new CalculatorStore();
    assert.notStrictEqual(store.state.checkGross, 999, 'must not merge unknown-future state');
    assert.strictEqual(store.state.checkGross, 45, 'defaults preserved');
  } finally {
    console.error = origErr;
  }
});

test('fuel.store: legacy bare-array payload still loads; next save wraps to envelope', async () => {
  const ls = mockLocalStorage();
  const legacy = [{ id: 'fuel-x', date: '2026-08-01', time: '09:00', amount: 40, liters: 21 }];
  ls.setItem('smart_transfer_fuel_logs_v1', JSON.stringify(legacy));

  const { FuelStore } = await import('../js/fuel.store.js');
  const store = new FuelStore();
  assert.strictEqual(store.logs.length, 1);
  assert.strictEqual(store.logs[0].id, 'fuel-x');

  store.saveLocalLogs();
  const env = JSON.parse(ls.getItem('smart_transfer_fuel_logs_v1'));
  assert.strictEqual(env.schemaVersion, SCHEMA_VERSION);
  assert.ok(Array.isArray(env.logs));
});

test('fuel.store: unknown-future schemaVersion is rejected (empty logs, no crash)', async () => {
  const ls = mockLocalStorage();
  ls.setItem('smart_transfer_fuel_logs_v1', JSON.stringify({
    schemaVersion: SCHEMA_VERSION + 99,
    logs: [{ id: 'fuel-poison' }]
  }));
  const { FuelStore } = await import('../js/fuel.store.js');
  const origErr = console.error; console.error = () => {};
  try {
    const store = new FuelStore();
    assert.deepStrictEqual(store.logs, []);
  } finally {
    console.error = origErr;
  }
});
