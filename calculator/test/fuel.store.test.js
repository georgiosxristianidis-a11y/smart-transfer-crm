import test from 'node:test';
import assert from 'node:assert';
import { FuelStore } from '../js/fuel.store.js';

test('FuelStore: initial state with empty storage yields empty array', () => {
  const store = new FuelStore();
  assert.deepStrictEqual(store.getAllLogsSnapshot(), []);
  assert.strictEqual(store.logs.length, 0);
});

test('FuelStore: getMetrics on empty log returns zero amounts and liters, not NaN', () => {
  const store = new FuelStore();
  const metrics = store.getMetrics();

  assert.strictEqual(metrics.todayAmount, 0);
  assert.strictEqual(metrics.todayLiters, 0);
  assert.strictEqual(metrics.weekAmount, 0);
  assert.strictEqual(metrics.weekLiters, 0);
  assert.strictEqual(metrics.monthAmount, 0);
  assert.strictEqual(metrics.monthLiters, 0);
  assert.strictEqual(Number.isNaN(metrics.todayAmount), false);
  assert.strictEqual(Number.isNaN(metrics.todayLiters), false);
  assert.strictEqual(Number.isNaN(metrics.monthAmount), false);
  assert.strictEqual(Number.isNaN(metrics.monthLiters), false);
});

test('FuelStore: adding fuel logs calculates correct metrics', () => {
  const store = new FuelStore();
  const log = store.addFuelLog(60, 32.5, 'EKO Heraklion');

  assert.strictEqual(log.amount, 60);
  assert.strictEqual(log.liters, 32.5);
  assert.strictEqual(log.station, 'EKO Heraklion');
  assert.strictEqual(store.logs.length, 1);

  const metrics = store.getMetrics();
  assert.strictEqual(metrics.todayAmount, 60);
  assert.strictEqual(metrics.todayLiters, 32.5);
  assert.strictEqual(metrics.monthAmount, 60);
  assert.strictEqual(metrics.monthLiters, 32.5);
});

test('FuelStore: deleting logs updates state and metrics', () => {
  const store = new FuelStore();
  const log = store.addFuelLog(45, 24.0, 'BP');
  assert.strictEqual(store.logs.length, 1);

  store.deleteFuelLog(log.id);
  assert.strictEqual(store.logs.length, 0);

  const metrics = store.getMetrics();
  assert.strictEqual(metrics.todayAmount, 0);
  assert.strictEqual(metrics.todayLiters, 0);
});

test('FuelStore: replaceAllLogs restores a snapshot cleanly', () => {
  const store = new FuelStore();
  const sample = [
    { id: 'f-1', date: '2026-08-20', time: '10:00', amount: 80, liters: 42.1, station: 'AVIN' }
  ];

  store.replaceAllLogs(sample);
  assert.strictEqual(store.logs.length, 1);
  assert.strictEqual(store.logs[0].amount, 80);

  store.replaceAllLogs([]);
  assert.strictEqual(store.logs.length, 0);
  assert.deepStrictEqual(store.getAllLogsSnapshot(), []);
});
