/**
 * Persisted-payload schema version and the migration ladder.
 *
 * v1 — trips + fuelLogs + calcState.
 * v2 — adds `shifts` to the envelope; every trip carries `shiftId` and `actualLanding`.
 *
 * A version is bumped only when a stored shape changes. Migrations run forward,
 * one step at a time; there is no back-migration, an unknown future version throws
 * before any store is touched.
 */
export const SCHEMA_VERSION = 2;

export class UnknownSchemaVersionError extends Error {
  constructor(from) {
    super(`Unknown schemaVersion ${from} (current ${SCHEMA_VERSION}). Refusing to load.`);
    this.name = 'UnknownSchemaVersionError';
    this.from = from;
  }
}

/**
 * from-version → step that returns the payload at from+1.
 * Steps are pure: they build a new object and never mutate the input.
 */
const MIGRATIONS = {
  // v1 → v2: the shift entity appears. Old trips belong to no shift and have
  // no recorded landing; spread last so an already-migrated value survives.
  1: (payload) => ({
    ...payload,
    schemaVersion: 2,
    shifts: Array.isArray(payload.shifts) ? payload.shifts : [],
    trips: Array.isArray(payload.trips)
      ? payload.trips.map(t => ({ shiftId: null, actualLanding: null, ...t }))
      : payload.trips
  })
};

export function migrate(payload, from, to = SCHEMA_VERSION) {
  if (from === to) return payload;
  if (from > to) throw new UnknownSchemaVersionError(from);

  let current = payload;
  for (let v = from; v < to; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration path from v${v} to v${v + 1}`);
    current = step(current);
  }
  return current;
}
