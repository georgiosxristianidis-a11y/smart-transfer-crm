# DATA-10 — Shift as an entity (IDB v3), trips gain `shiftId`/`actualLanding`

**Severity:** HIGH · **Size:** M · **Owner:** 🟠 LEAD

## Goal
A shift becomes a stored record with its own start, end and odometer; a trip says which shift it belongs to and when the plane actually landed.

## Symptom & root
- No shift exists: `js/app.js:76-120` rebuilds "today" from `trip.date`. A night shift crossing midnight splits in two and "9 of 13" lies.
- `js/trips.store.js:39-56` — no link to a shift, no landing fact. `flight.service.js:130` honestly returns `unknown`, and nothing records what the driver saw themselves.
- `js/shared/db.js:9` — `DB_VERSION = 2`, stores `trips` + `fuel` only.

## Scope
- `js/shared/schema.js` — `SCHEMA_VERSION` 1→2, v1→v2 migration
- `js/shared/db.js` — `DB_VERSION` 3, `shifts` store
- `js/shifts.store.js` — **new**
- `js/trips.store.js` — two fields, one shared normaliser
- `js/shared/utils.js` — `localTimeKey`, `localStamp`
- `js/shared/backup.js`, `backup.service.js` — `shifts` in the envelope
- `js/app.js` — construct the store, pass to backup. **No UI**
- `test/shifts.store.test.js` — **new**; schema/backup/trips tests updated

Everything else is off-limits.

## STOP
1. A file outside Scope → escalate.
2. Any shift UI (button, screen, HUD line) → that is DATA-11.
3. Auto-opening or closing a shift by timer → this card only stores.
4. A live flight feed for `actualLanding` → out; hand-entered.
5. `npm test` red for an unrelated reason → stop.

## Done when
1. IDB opens at v3 with a `shifts` store; a v2 base upgrades without losing trips or fuel.
2. At most one shift is `open`; a second `openShift()` throws.
3. A v1 backup imports into v2: `shifts: []` appears, trips gain `shiftId: null` + `actualLanding: null`.
4. `shifts` round-trip through export → import unchanged.
5. `actualLanding` accepts `HH:MM`, stores `YYYY-MM-DDTHH:MM` on the trip's own date.

## Gates
- `npm test` — 0 failures
- `npm run lint` — 0
- `npm run docs:budget` — prints 0
