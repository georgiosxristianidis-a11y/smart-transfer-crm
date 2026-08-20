# DATA-12 — A real migration path v1 → v2

**Severity:** CRITICAL · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
A backup file exported before DATA-10/11 still imports afterwards. Raising `SCHEMA_VERSION` stops being an act that destroys every existing backup.

## Symptom & root
`schema.js:12` — `migrate()` returns the payload when `from === to` and **throws for everything else**. There is no migration path, only a placeholder. The moment `SCHEMA_VERSION` goes 1→2 (which DATA-10 and DATA-11 require), every v1 file fails with `No migration path from v1 to v2`. The safety net is cut by the first step that needs it.

## Scope
- `js/shared/schema.js` — `SCHEMA_VERSION` 1→2; real `migrate()` with a per-step table.
- `js/shared/backup.js` — no signature change; must keep validating version before touching any store.
- `test/schema.test.js` — extend with a frozen v1 fixture.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Store or DB changes → DATA-10 / DATA-11.
3. Atomicity of the import → DATA-13.
4. Editing the v1 fixture to make a test pass → **stop immediately**. The fixture is the contract.
5. Second bug found → log below, do not fix.

## Done when
1. A frozen v1 envelope fixture lives in `test/` and is never modified again.
2. `migrate(v1, 1, 2)` yields: `shifts: []`, every trip `payment:'cash'`, `shiftId:null`, `actualLanding:null`, every fuel log `payment:'cash'`, `odo:null`.
3. Future versions still throw `UnknownSchemaVersionError` before any store is touched.
4. Migration is a chain of single-step functions (`v1→v2`), not one branching function — v3 must cost one new entry.
5. Test imports the v1 fixture end-to-end and asserts trip count and total price are unchanged.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
