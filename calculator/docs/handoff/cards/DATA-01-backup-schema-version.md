# DATA-01 — Schema version stamps + JSON backup module

**Severity:** HIGH (P0) · **Size:** M · **Owner:** 🟠 LEAD-OPUS

## Goal
Each persisted store carries `schemaVersion`; one module serialises full app state to JSON and restores it. After Clear-Site-Data, import rebuilds trips + fuel + calc byte-identically.

## Symptom & root
- `calculator.store.js:69-80` — `{...defaults, ...JSON.parse(saved)}` no version; renamed fields silently mix.
- `fuel.store.js:5` — version only in key name, not payload.
- `trips.store.js:141` — `exportCSV()` drops fuel + calc. CSV is not backup.

## Scope
- `js/shared/backup.js` — **new**. `exportAll()`, `importAll(json)`.
- `js/shared/schema.js` — **new**. `SCHEMA_VERSION` + `migrate(payload, from, to)` (identity v1→v1; throws on future).
- `js/calculator.store.js` — stamp on save; reject unknown-future on load.
- `js/trips.store.js` — add `getAllTripsSnapshot()`/`replaceAllTrips(list)`. Existing methods unchanged.
- `js/fuel.store.js` — same; wrap `{schemaVersion, logs}`; still read legacy bare array.
- `test/backup.test.js`, `test/schema.test.js` — **new**.

Everything else off-limits. **No UI in this card.**

## STOP
1. File outside Scope → split card.
2. `DB_VERSION` bump → DATA-03.
3. `navigator.storage.persist()` → DATA-04.
4. `crypto.randomUUID()` swap → DATA-05.
5. UI wiring → DATA-02.
6. Existing `npm test` breaks → stop.
7. Second bug → log below, don't fix.

## Done when
1. Envelope `{schemaVersion:1, exportedAt, calcState, trips, fuelLogs}` documented atop `backup.js`.
2. `importAll` validates version first; unknown-future throws; per-store replace is all-or-nothing.
3. Calc load rejects unknown-future (defaults, no merge).
4. Fuel on disk = envelope; legacy bare array still reads (one-shot upgrade on next save).
5. Round-trip test deterministic (no `Date.now()` in assertions).

## Gates
- `npm test` — 0 (incl. new `backup.test.js`, `schema.test.js`)
- `node scripts/check-docs-budget.mjs` — 0
