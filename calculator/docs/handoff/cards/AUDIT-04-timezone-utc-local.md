# AUDIT-04 — Timezone: UTC vs Local Date (Crete UTC+3)

**Severity:** HIGH · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Ensure all date creation and parsing uses Crete local timezone (UTC+3) via `localDateKey` / `parseLocalDate` to prevent midnight date-shift bugs.

## Symptom & root
- `new Date().toISOString().split('T')[0]` shifted dates back to yesterday between 00:00–03:00 local time in `fuel.store.js:37,84,115,133` and `backup.service.js:34`.
- Empty/invalid dates in `trips.store.js:246` threw unhandled `RangeError` during GCal link generation.

## Scope
- `js/shared/utils.js`
- `js/fuel.store.js`
- `js/trips.store.js`
- `js/shared/backup.service.js`
- `test/utils.test.js`
- `test/trips.store.test.js`

## STOP
1. A file outside Scope is needed → stop.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. `npm test` red for an unrelated reason → stop.
4. Second bug found → do not fix, log below.

## Done when
1. Zero `toISOString().split('T')[0]` calls remain across `js/`.
2. GCal link generator gracefully handles empty/invalid dates.
3. Machine DV gate and unit tests pass with 0 failures.

## Gates
- `node C:\PROJECTS\TAXI\.gemini\scripts\gate-dv.mjs` — 0 violations
- `node C:\PROJECTS\TAXI\calculator\test\utils.test.js` — 5/5 pass
- `node C:\PROJECTS\TAXI\calculator\test\trips.store.test.js` — 9/9 pass
- `node scripts/check-docs-budget.mjs` — 0 errors

## Found along the way
- None.
