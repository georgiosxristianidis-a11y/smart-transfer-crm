# DATA-11 — Payment method + odometer on refuels

**Severity:** CRITICAL · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
Every trip and every refuel records whether the money was cash or card, and every refuel records the odometer. Without both, the app can never reconcile against the driver's pocket, and real fuel consumption cannot be computed.

## Symptom & root
- `trips.store.js:37` — a trip has `price` but no payment method. Cash and card are summed into one number that matches nothing physical.
- `fuel.store.js:82` — `addFuelLog` writes no `odo`, although the demo rows at `fuel.store.js:37` have one. Real l/100 km is therefore uncomputable, and `calculator.store.js:166` keeps a hardcoded 8.7.

## Scope
- `js/trips.store.js` — trip gains `payment: 'cash' | 'card'`, default `'cash'`.
- `js/fuel.store.js` — log gains `payment` (same default) and `odo: number | null`; `addFuelLog` signature extended.
- `js/shared/backup.js` — no envelope change; fields ride inside existing arrays.
- `test/trips.store.test.js`, `test/fuel.store.test.js` — extend / **new**.

Everything else is off-limits. **No UI in this card** — fields carry defaults so nothing visible changes yet.

## STOP
1. File outside Scope → stop, escalate.
2. Form inputs, buttons, any DOM → SHIFT-01.
3. Consumption or CPK maths → BIZ-01.
4. Removing the demo fuel rows → CLEAN-02.
5. Second bug found → log below, do not fix.

## Done when
1. Unknown or missing `payment` normalises to `'cash'` on load and on import — never `undefined`.
2. `odo` accepts null and rejects non-numbers (stays null).
3. Backup round-trip preserves both fields.
4. Existing tests stay green with no edits to their expectations.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
