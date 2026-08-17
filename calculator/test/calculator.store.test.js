import test from 'node:test';
import assert from 'node:assert';
import { CalculatorStore } from '../js/calculator.store.js';

// Mock localStorage for the tests
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

test('CalculatorStore: Basic Revenue and VAT calculations', () => {
  const store = new CalculatorStore();
  
  // Set test scenario
  store.update({
    checkGross: 45,
    tripsPerDay: 13,
    seasonDays: 120, // Clean number for easier math
    portFeesEnabled: false // Disable to isolate VAT math
  });
  
  const calc = store.getCalculations();
  const m = calc.metrics;
  
  assert.strictEqual(m.totalTrips, 1560, 'Total trips should be 13 * 120 = 1560');
  assert.strictEqual(m.grossRevenue, 1560 * 45, 'Gross revenue should be trips * 45');
  
  // Net should have 13% VAT deducted: 45 / 1.13 = ~39.82
  const expectedNet = (45 / 1.13) * 1560;
  // Account for floating point math
  assert.ok(Math.abs(m.netRevenue - expectedNet) < 0.01, 'Net revenue should correctly deduct 13% VAT');
});

test('CalculatorStore: 50/50 Partner Distribution strictness', () => {
  const store = new CalculatorStore();
  
  store.update({
    ownersCount: 2
  });
  
  const calc = store.getCalculations();
  const m = calc.metrics;
  
  assert.strictEqual(
    m.dailyNetPerOwner,
    m.dailyNet / 2,
    'Daily net MUST be split exactly by 2'
  );
  
  assert.strictEqual(
    m.tipsCashPerOwner,
    m.totalTipsCash / 2,
    'Tips cash MUST be split exactly by 2'
  );
});

test('CalculatorStore: 33/33/33 Partner Distribution strictness', () => {
  const store = new CalculatorStore();
  
  store.update({
    ownersCount: 3
  });
  
  const calc = store.getCalculations();
  const m = calc.metrics;
  
  assert.strictEqual(
    m.dailyNetPerOwner,
    m.dailyNet / 3,
    'Daily net MUST be split exactly by 3'
  );
});

test('CalculatorStore: licence regime sets the fare floor', () => {
  const store = new CalculatorStore();

  store.update({ licenseMode: 'edx', checkGross: 45 });
  let m = store.getCalculations().metrics;
  assert.strictEqual(m.minFare, 0, 'ΕΔΧ is metered — no legal floor per ride');
  assert.strictEqual(m.fareBelowMinimum, false, 'Nothing to flag under ΕΔΧ');

  store.update({ licenseMode: 'eix' });
  m = store.getCalculations().metrics;
  assert.strictEqual(m.minFare, 82, 'ΕΙΧ contract minimum is €82');
  assert.strictEqual(m.fareBelowMinimum, true, '€45 is below the ΕΙΧ floor');

  store.update({ checkGross: 85 });
  m = store.getCalculations().metrics;
  assert.strictEqual(m.fareBelowMinimum, false, '€85 clears the ΕΙΧ floor');
});

test('CalculatorStore: the fare is flagged, never clamped', () => {
  const store = new CalculatorStore();

  store.update({ licenseMode: 'eix', checkGross: 45 });

  assert.strictEqual(
    store.getCalculations().state.checkGross,
    45,
    'The owner typed 45 — the store must not rewrite it to 82'
  );
});

test('CalculatorStore: licenseMode rejects unknown regimes', () => {
  const store = new CalculatorStore();

  store.update({ licenseMode: 'eix' });
  store.update({ licenseMode: 'uber' });

  assert.strictEqual(
    store.getCalculations().state.licenseMode,
    'eix',
    'An unknown regime would mean an unknown floor — it must be dropped'
  );

  store.update({ licenseMode: 42 });
  assert.strictEqual(store.getCalculations().state.licenseMode, 'eix', 'Non-string rejected too');
});

test('CalculatorStore: Wear and Tear Math', () => {
  const store = new CalculatorStore();
  
  store.update({
    tripsPerDay: 10,
    seasonDays: 100,
    kmPerTrip: 50,
    emptyLegRatio: 1.3,
    oilInterval: 15000,
    oilCost: 250
  });
  
  // Total trips: 1000
  // Effective KM: 50 * 1.3 = 65 km per trip
  // Total KM = 65000
  // Oil changes needed: 65000 / 15000 = 4.333
  // Total oil cost: 4.333 * 250 = 1083.33
  
  const calc = store.getCalculations();
  const oilCost = calc.metrics.totalMaintenance - ((65000 / 60000)*1200) - ((65000 / 40000)*800); // isolate oil
  
  assert.ok(Math.abs(oilCost - 1083.33) < 1, 'Oil wear cost amortized accurately');
});
