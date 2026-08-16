import test from 'node:test';
import assert from 'node:assert';
import { BackupService } from '../js/shared/backup.service.js';
import { CalculatorStore } from '../js/calculator.store.js';
import { SCHEMA_VERSION } from '../js/shared/schema.js';

// Setup mock localStorage
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  clear() { this.store = {}; }
};

test('BackupService: exportBackup creates valid schema snapshot', () => {
  const mockTripsStore = {
    getAllTripsSnapshot: () => [
      { id: 'trip-1', clientName: 'Nikos', date: '2026-08-15', time: '14:00', price: 50, status: 'pending' }
    ]
  };
  const mockFuelStore = {
    getAllLogsSnapshot: () => [
      { id: 'fuel-1', date: '2026-08-15', time: '10:00', amount: 60, liters: 31.5, station: 'BP' }
    ]
  };
  const mockCalcStore = {
    getStateSnapshot: () => ({ checkGross: 55, tripsPerDay: 14 })
  };

  const backup = BackupService.exportBackup({
    tripsStore: mockTripsStore,
    fuelStore: mockFuelStore,
    calcStore: mockCalcStore
  });

  assert.strictEqual(backup.schemaVersion, SCHEMA_VERSION);
  assert.ok(backup.exportedAt);
  assert.strictEqual(backup.trips.length, 1);
  assert.strictEqual(backup.fuelLogs.length, 1);
  assert.strictEqual(backup.calcState.checkGross, 55);
});

test('BackupService: importBackup coordinates store updates correctly', async () => {
  let replacedTrips = null;
  let replacedFuel = null;
  let replacedCalc = null;

  const mockTripsStore = {
    async replaceAllTrips(trips) { replacedTrips = trips; }
  };
  const mockFuelStore = {
    replaceAllLogs(logs) { replacedFuel = logs; }
  };
  const mockCalcStore = {
    replaceState(state) { replacedCalc = state; }
  };

  const sampleBackup = {
    schemaVersion: SCHEMA_VERSION,
    trips: [{ id: 'trip-101', price: 70 }],
    fuelLogs: [{ id: 'fuel-202', amount: 80 }],
    calcState: { tripsPerDay: 15 }
  };

  const result = await BackupService.importBackup(sampleBackup, {
    tripsStore: mockTripsStore,
    fuelStore: mockFuelStore,
    calcStore: mockCalcStore
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.stats.tripsCount, 1);
  assert.strictEqual(result.stats.fuelLogsCount, 1);
  assert.deepStrictEqual(replacedTrips, [{ id: 'trip-101', price: 70 }]);
  assert.deepStrictEqual(replacedFuel, [{ id: 'fuel-202', amount: 80 }]);
  assert.strictEqual(replacedCalc.tripsPerDay, 15);
});

test('CalculatorStore: schema sanitization ignores unknown fields and enforces types', () => {
  const store = new CalculatorStore();
  
  // Try to inject unknown malicious keys and corrupted types
  store.replaceState({
    checkGross: 60,
    tripsPerDay: '15',
    unknownField: 'malicious',
    hiredDrivers: 'invalid_number'
  });

  assert.strictEqual(store.state.checkGross, 60);
  assert.strictEqual(store.state.tripsPerDay, 15);
  assert.strictEqual(store.state.unknownField, undefined, 'Unknown field should not be injected');
  assert.strictEqual(store.state.hiredDrivers, 0, 'Invalid number should retain default value');
});
