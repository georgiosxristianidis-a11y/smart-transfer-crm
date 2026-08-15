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

test('schema: migrate throws for gaps in downgrade path (no back-migration)', () => {
  // from < to but no registered path yet — must throw, not silently pass through.
  if (SCHEMA_VERSION === 1) return; // no earlier version to test with
  assert.throws(() => migrate({}, 1, SCHEMA_VERSION), /No migration path/);
});
