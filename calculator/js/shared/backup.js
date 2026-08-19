// Envelope:
// { schemaVersion: <int>, exportedAt: <ISO string>, calcState: {...},
//   trips: [...], fuelLogs: [...], shifts: [...] }
//
// `shifts` arrived with schemaVersion 2 (DATA-10). A v1 file is migrated on the
// way in; a v2 file that omits the key is read as an empty list, but a key of the
// wrong type is a hard error — silent drift is what backups are supposed to catch.
//
// exportAll → JSON string.
// importAll → validates schemaVersion first (unknown-future throws before touching any store),
//             then per-store replace is atomic (each store either fully replaces or throws).

import { SCHEMA_VERSION, migrate } from './schema.js';

export function buildEnvelope({ calculatorStore, tripsStore, fuelStore, shiftsStore }, nowIso) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso,
    calcState: calculatorStore.getStateSnapshot(),
    trips: tripsStore.getAllTripsSnapshot(),
    fuelLogs: fuelStore.getAllLogsSnapshot(),
    shifts: shiftsStore ? shiftsStore.getAllShiftsSnapshot() : []
  };
}

export function exportAll(stores, now = new Date()) {
  const env = buildEnvelope(stores, now.toISOString());
  return JSON.stringify(env);
}

function parseEnvelope(json) {
  let parsed;
  try {
    parsed = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    throw new Error(`importAll: invalid JSON — ${e.message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('importAll: envelope must be an object');
  }
  if (typeof parsed.schemaVersion !== 'number') {
    throw new Error('importAll: missing schemaVersion');
  }
  // migrate throws UnknownSchemaVersionError for future versions.
  const migrated = migrate(parsed, parsed.schemaVersion, SCHEMA_VERSION);
  if (!Array.isArray(migrated.trips)) throw new Error('importAll: trips must be array');
  if (!Array.isArray(migrated.fuelLogs)) throw new Error('importAll: fuelLogs must be array');
  if (migrated.shifts === undefined) migrated.shifts = [];
  if (!Array.isArray(migrated.shifts)) throw new Error('importAll: shifts must be array');
  if (!migrated.calcState || typeof migrated.calcState !== 'object') {
    throw new Error('importAll: calcState must be object');
  }
  return migrated;
}

export async function importAll(json, { calculatorStore, tripsStore, fuelStore, shiftsStore }) {
  const env = parseEnvelope(json);
  calculatorStore.replaceState(env.calcState);
  await tripsStore.replaceAllTrips(env.trips);
  fuelStore.replaceAllLogs(env.fuelLogs);
  // Shifts restore last: trips already carry `shiftId`, so a failure here leaves
  // dangling links rather than orphaned shifts pointing at trips that never landed.
  if (shiftsStore) await shiftsStore.replaceAllShifts(env.shifts);
  return env;
}
