// Envelope:
// { schemaVersion: <int>, exportedAt: <ISO string>, calcState: {...}, trips: [...], fuelLogs: [...] }
//
// exportAll → JSON string.
// importAll → validates schemaVersion first (unknown-future throws before touching any store),
//             then per-store replace is atomic (each store either fully replaces or throws).

import { SCHEMA_VERSION, migrate } from './schema.js';

export function buildEnvelope({ calculatorStore, tripsStore, fuelStore }, nowIso) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso,
    calcState: calculatorStore.getStateSnapshot(),
    trips: tripsStore.getAllTripsSnapshot(),
    fuelLogs: fuelStore.getAllLogsSnapshot()
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
  if (!migrated.calcState || typeof migrated.calcState !== 'object') {
    throw new Error('importAll: calcState must be object');
  }
  return migrated;
}

export async function importAll(json, { calculatorStore, tripsStore, fuelStore }) {
  const env = parseEnvelope(json);
  calculatorStore.replaceState(env.calcState);
  await tripsStore.replaceAllTrips(env.trips);
  fuelStore.replaceAllLogs(env.fuelLogs);
  return env;
}
