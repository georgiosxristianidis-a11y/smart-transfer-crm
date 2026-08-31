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

test('CalculatorStore: CALC-01 constants in DEFAULT_STATE and used in getCalculations', () => {
  const store = new CalculatorStore();
  const s = store.getCalculations().state;

  assert.strictEqual(s.fuelConsumptionPer100km, 8.7, 'fuelConsumptionPer100km default is 8.7');
  assert.strictEqual(s.vatRate, 1.13, 'vatRate default is 1.13');
  assert.strictEqual(s.safetyNetRatio, 0.05, 'safetyNetRatio default is 0.05');

  // Verify that customizing constants alters calculations accordingly
  store.update({
    fuelConsumptionPer100km: 10.0,
    safetyNetRatio: 0.10
  });
  const m = store.getCalculations().metrics;
  // fuelCost with 10.0 l/100km:
  const totalKm = m.totalKm;
  const expectedFuel = (totalKm / 100) * 10.0 * 1.78;
  assert.ok(Math.abs(m.fuelCost - expectedFuel) < 0.01, 'Fuel cost reflects custom fuelConsumptionPer100km');
  assert.ok(Math.abs(m.safetyNet - (m.netRevenue * 0.10)) < 0.01, 'Safety net reflects custom safetyNetRatio');
});

test('CalculatorStore: CALC-01 division-by-zero guards yield finite metrics', () => {
  const store = new CalculatorStore();

  // Test zero values for divisors
  store.update({
    seasonDays: 0,
    ownersCount: 0,
    oilInterval: 0,
    clutchInterval: 0,
    tiresInterval: 0,
    vatRate: 0
  });

  const calc = store.getCalculations();
  const m = calc.metrics;

  for (const [key, value] of Object.entries(m)) {
    if (typeof value === 'number') {
      assert.ok(Number.isFinite(value), `Metric ${key} MUST be finite (got ${value})`);
      assert.ok(!Number.isNaN(value), `Metric ${key} MUST not be NaN`);
    }
  }
});

test('CalculatorStore: CALC-01 range guards clamp negatives and garbage', () => {
  const store = new CalculatorStore();

  store.update({
    seasonDays: -10,
    ownersCount: -5,
    kmPerTrip: -100,
    tripsPerDay: -3,
    fuelConsumptionPer100km: -8.7,
    oilInterval: -15000
  });

  const s = store.getCalculations().state;
  assert.strictEqual(s.seasonDays, 122, 'Negative seasonDays rejected to default');
  assert.strictEqual(s.ownersCount, 2, 'Negative ownersCount rejected to default');
  assert.strictEqual(s.kmPerTrip, 50, 'Negative kmPerTrip rejected to default');
  assert.strictEqual(s.tripsPerDay, 13, 'Negative tripsPerDay rejected to default');
  assert.strictEqual(s.fuelConsumptionPer100km, 8.7, 'Negative fuelConsumption rejected to default');
  assert.strictEqual(s.oilInterval, 15000, 'Negative oilInterval rejected to default');
});

test('CalculatorStore: CALC-01 non-finite and corrupted payload fallback', () => {
  const store = new CalculatorStore();

  store.update({
    seasonDays: NaN,
    ownersCount: Infinity,
    checkGross: 'not-a-number',
    fuelPrice: undefined,
    safetyNetRatio: null
  });

  const s = store.getCalculations().state;
  assert.strictEqual(s.seasonDays, 122, 'NaN falls back to default');
  assert.strictEqual(s.ownersCount, 2, 'Infinity falls back to default');
  assert.strictEqual(s.checkGross, 45, 'Non-numeric string falls back to default');

  const m = store.getCalculations().metrics;
  for (const [key, value] of Object.entries(m)) {
    if (typeof value === 'number') {
      assert.ok(Number.isFinite(value), `Metric ${key} MUST be finite under corrupted payload`);
    }
  }
});

test('CalculatorStore: CALC-01 input VAT 24% non-reclaimable & output VAT 13% (pinned literal values)', () => {
  const store = new CalculatorStore();
  const calc = store.getCalculations();
  const m = calc.metrics;
  const s = calc.state;

  // Default state checks
  assert.strictEqual(s.vatRate, 1.13, 'Default output VAT rate is 1.13 (13%)');
  assert.strictEqual(s.inputVatRate, 1.24, 'Default input VAT rate is 1.24 (24%)');

  // Pinned literal revenue and output VAT
  // 13 trips/day * 122 days = 1586 trips; 1586 * €45 = €71 370 gross
  assert.strictEqual(m.totalTrips, 1586, 'Pinned totalTrips: 1586');
  assert.strictEqual(m.grossRevenue, 71370, 'Pinned grossRevenue: €71 370');
  assert.ok(Math.abs(m.outputVatYear - 8210.71) < 0.01, `Output VAT (13%) pinned: ~€8 210.71 (got ${m.outputVatYear})`);

  // Pinned literal expenses and input VAT 24%
  // Fuel: 103090 km @ 8.7L/100km = 8968.83L @ €1.78/L = €15 964.52 gross -> VAT €3 089.91
  assert.ok(Math.abs(m.fuelCost - 15964.52) < 0.01, `Fuel cost pinned: €15 964.52 (got ${m.fuelCost})`);
  assert.ok(Math.abs(m.inputVatFuel - 3089.91) < 0.01, `Fuel input VAT (24%) pinned: €3 089.91 (got ${m.inputVatFuel})`);

  // Maintenance: oil €1718.17 + clutch €2061.80 + tires €2061.80 = €5841.77 gross -> VAT €1 130.66
  assert.ok(Math.abs(m.totalMaintenance - 5841.77) < 0.01, `Maintenance cost pinned: €5 841.77 (got ${m.totalMaintenance})`);
  assert.ok(Math.abs(m.inputVatMaintenance - 1130.66) < 0.01, `Maintenance input VAT (24%) pinned: €1 130.66 (got ${m.inputVatMaintenance})`);

  // Wash: €2 400 gross -> VAT €464.52
  assert.ok(Math.abs(m.inputVatWash - 464.52) < 0.01, `Wash input VAT (24%) pinned: €464.52 (got ${m.inputVatWash})`);

  // Accountant: €1 800 gross -> VAT €348.39
  assert.ok(Math.abs(m.inputVatAccountant - 348.39) < 0.01, `Accountant input VAT (24%) pinned: €348.39 (got ${m.inputVatAccountant})`);

  // Total non-refundable input VAT (24%): €3089.91 + €1130.66 + €464.52 + €348.39 = €5 033.47
  assert.ok(Math.abs(m.inputVatNonRefundable - 5033.47) < 0.01, `Total non-refundable input VAT pinned: €5 033.47 (got ${m.inputVatNonRefundable})`);

  // Profit remains intact (expenses paid gross as cash outflow)
  assert.ok(Math.abs(m.netProfitYear - 20181.64) < 0.01, `Net profit pinned: €20 181.64 (got ${m.netProfitYear})`);
  assert.ok(Math.abs(m.netProfitPerOwnerYear - 10090.82) < 0.01, `Per owner profit pinned: €10 090.82 (got ${m.netProfitPerOwnerYear})`);
});

test('CalculatorStore: CALC-01 inputVatRate division-by-zero & negative bounds guard', () => {
  const store = new CalculatorStore();

  store.update({ inputVatRate: 0 });
  let calc = store.getCalculations();
  assert.strictEqual(calc.state.inputVatRate, 1.24, 'inputVatRate 0 rejected to default 1.24');
  assert.ok(Number.isFinite(calc.metrics.inputVatNonRefundable), 'inputVatNonRefundable finite');

  store.update({ inputVatRate: -1.24 });
  calc = store.getCalculations();
  assert.strictEqual(calc.state.inputVatRate, 1.24, 'Negative inputVatRate rejected to default');

  store.update({ inputVatRate: 1.13 });
  calc = store.getCalculations();
  assert.strictEqual(calc.state.inputVatRate, 1.13, 'Valid custom inputVatRate accepted');
});

test('CalculatorStore: CALC-02 hotel commission 10% toggle and profit impact (pinned literal values)', () => {
  const store = new CalculatorStore();
  
  // 1. Default scenario: toggle is OFF
  let calc = store.getCalculations();
  let m = calc.metrics;
  let s = calc.state;

  assert.strictEqual(s.hotelCommissionEnabled, false, 'Default hotelCommissionEnabled is false');
  assert.strictEqual(s.hotelCommissionRate, 0.10, 'Default hotelCommissionRate is 0.10 (10%)');
  assert.strictEqual(m.hotelCommissionPerTrip, 0, 'No commission per trip when disabled');
  assert.strictEqual(m.hotelCommissionCost, 0, 'Zero commission cost when disabled');
  assert.ok(Math.abs(m.netProfitYear - 20181.64) < 0.01, 'Net profit unchanged when commission disabled');
  assert.ok(Math.abs(m.dailyNetPerOwner - 82.71) < 0.01, 'Daily net per owner unchanged');

  // 2. Enable 10% hotel commission
  store.update({ hotelCommissionEnabled: true });
  calc = store.getCalculations();
  m = calc.metrics;

  // €45 fare * 10% = €4.50 per trip
  assert.ok(Math.abs(m.hotelCommissionPerTrip - 4.50) < 0.01, `Commission per trip pinned: €4.50 (got ${m.hotelCommissionPerTrip})`);

  // 1586 trips * €4.50 = €7 137.00 total commission
  assert.ok(Math.abs(m.hotelCommissionCost - 7137.00) < 0.01, `Total annual hotel commission pinned: €7 137.00 (got ${m.hotelCommissionCost})`);

  // Total expenses: €39 805.65 + €7 137.00 = €46 942.65
  assert.ok(Math.abs(m.totalExpenses - 46942.65) < 0.01, `Total expenses pinned: €46 942.65 (got ${m.totalExpenses})`);

  // Net profit: €59 987.29 - €46 942.65 = €13 044.64
  assert.ok(Math.abs(m.netProfitYear - 13044.64) < 0.01, `Net profit pinned: €13 044.64 (got ${m.netProfitYear})`);
  assert.ok(Math.abs(m.netProfitPerOwnerYear - 6522.32) < 0.01, `Per owner profit pinned: €6 522.32 (got ${m.netProfitPerOwnerYear})`);
  assert.ok(Math.abs(m.dailyNetPerOwner - 53.46) < 0.01, `Daily net per owner pinned: €53.46 (got ${m.dailyNetPerOwner})`);
});

test('CalculatorStore: CALC-02 hotelCommissionRate guards against negative and overflow', () => {
  const store = new CalculatorStore();

  store.update({ hotelCommissionRate: -0.10 });
  let calc = store.getCalculations();
  assert.strictEqual(calc.state.hotelCommissionRate, 0.10, 'Negative hotelCommissionRate rejected to default');

  store.update({ hotelCommissionRate: 2.5 });
  calc = store.getCalculations();
  assert.strictEqual(calc.state.hotelCommissionRate, 0.10, 'Overflow hotelCommissionRate rejected to default');

  store.update({ hotelCommissionRate: 0.15 });
  calc = store.getCalculations();
  assert.strictEqual(calc.state.hotelCommissionRate, 0.15, 'Valid 15% rate accepted');
});


