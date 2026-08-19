import test from 'node:test';
import assert from 'node:assert';
import { SCHEMA_VERSION, migrate, UnknownSchemaVersionError } from '../js/shared/schema.js';

test('schema: SCHEMA_VERSION is a positive integer', () => {
  assert.strictEqual(typeof SCHEMA_VERSION, 'number');
  assert.ok(SCHEMA_VERSION >= 1);
  assert.strictEqual(SCHEMA_VERSION, Math.trunc(SCHEMA_VERSION));
});

test('schema: migrate identity when from === to returns payload unchanged', () => {
  const payload = { schemaVersion: SCHEMA_VERSION, foo: 1 };
  const out = migrate(payload, SCHEMA_VERSION, SCHEMA_VERSION);
  assert.strictEqual(out, payload);
});

test('schema: migrate throws UnknownSchemaVersionError for future versions', () => {
  assert.throws(
    () => migrate({}, SCHEMA_VERSION + 1, SCHEMA_VERSION),
    UnknownSchemaVersionError
  );
});

test('schema: migrate throws when a step in the ladder is missing', () => {
  // v0 was never a thing — an unregistered step must throw, not pass through.
  assert.throws(() => migrate({}, 0, SCHEMA_VERSION), /No migration path from v0/);
});

test('schema: v1 → v2 adds shifts and stamps every trip with the new fields', () => {
  const v1 = {
    schemaVersion: 1,
    trips: [
      { id: 'a', clientName: 'Anna', date: '2026-08-20' },
      { id: 'b', clientName: 'Boris', date: '2026-08-21', shiftId: 's-9', actualLanding: '2026-08-21T14:05' }
    ],
    fuelLogs: [],
    calcState: {}
  };
  const out = migrate(v1, 1, 2);

  assert.strictEqual(out.schemaVersion, 2);
  assert.deepStrictEqual(out.shifts, []);
  assert.strictEqual(out.trips[0].shiftId, null);
  assert.strictEqual(out.trips[0].actualLanding, null);
  assert.strictEqual(out.trips[1].shiftId, 's-9', 'an existing value is not overwritten');
  assert.strictEqual(out.trips[1].actualLanding, '2026-08-21T14:05');
  assert.strictEqual(v1.trips[0].shiftId, undefined, 'the input payload is not mutated');
});
