# DB-01 — IndexedDB singleton and versionchange handling

**Severity:** HIGH · **Size:** S · **Owner:** 🟢 GEMINI

## Goal
A single shared database instance is reused across all stores, and multi-tab version upgrades close stale connections cleanly without blocking the UI.

## Symptom & root
- `trips.store.js`, `fuel.store.js`, `shifts.store.js` each run `new DB()`, creating 3 parallel connections to `UnitCalcDB`.
- `db.js` lacks `db.onversionchange = () => db.close()`, causing schema migrations (e.g. v3 -> v4) to hang indefinitely (`onblocked`) when multiple tabs are open.

## Scope
- `js/shared/db.js`
- `js/trips.store.js`
- `js/fuel.store.js`
- `js/shifts.store.js`
- `test/schema.test.js`
- this card

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate to OWNER.
2. Modifying store data schema or store public methods → stop.
3. Adding external libraries → forbidden.
4. Second bug found → log below, do not fix.

## Done when
1. `DB` exports a singleton or shared connection promise so all stores share one `IDBDatabase` handle.
2. `db.onversionchange` closes the active connection and notifies or logs gracefully.
3. Tests verify single connection initialization and connection closure on versionchange.
4. All existing schema and store tests pass.

## Gates
- `npm test` — 0 failures
- `npm run lint` — 0 errors, 0 warnings
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
