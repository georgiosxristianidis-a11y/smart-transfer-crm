# DATA-13 — Restore is all-or-nothing

**Severity:** CRITICAL · **Size:** M · **Owner:** 🟠 LEAD-OPUS

## Goal
A failed import leaves the database exactly as it was. Today an interrupted restore can destroy the existing data without delivering the new data — the worst outcome a backup feature can produce.

## Symptom & root
- `backup.js:6` claims "per-store replace is atomic". It is not.
- `db.js:70` — every `_getStore()` opens a **new** transaction, and `trips.store.js:182` awaits between deletes and inserts. Two hundred trips means two hundred transactions and two hundred failure points.
- `backup.js:50` replaces calc state **before** trips are written, so a mid-way throw leaves calc from the new file and trips from neither.

## Scope
- `js/shared/db.js` — `replaceAll({trips, fuelLogs, shifts})` in **one** `readwrite` transaction over all stores.
- `js/shared/backup.js` — `importAll` takes a pre-import snapshot, validates fully, then calls `replaceAll`; calc state is written **last**, after stores commit.
- `js/trips.store.js`, `js/fuel.store.js`, `js/shifts.store.js` — delegate replace to the new DB method.
- `test/backup.test.js` — extend.

Everything else is off-limits. **No UI in this card.**

## STOP
1. File outside Scope → stop, escalate.
2. Migration logic → DATA-12.
3. Telegram or any network call → SYNC-01.
4. Rewriting the DB wrapper beyond the one new method → stop, escalate.
5. Second bug found → log below, do not fix.

## Done when
1. An import failing at any point leaves trips, fuel, shifts and calc state identical to before — a test injects a throw mid-write.
2. All stores replace inside one transaction; a rejection rolls everything back.
3. The false "atomic" comment at `backup.js:6` states what the code guarantees.
4. Clean-device test: empty DB + file → trip count, total price and shift count match the source.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
