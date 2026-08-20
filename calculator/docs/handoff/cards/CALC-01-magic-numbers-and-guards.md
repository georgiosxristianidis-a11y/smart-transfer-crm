# CALC-01 — Calculator constants and range guards

**Severity:** MEDIUM · **Size:** M · **Owner:** 🔵 HORSE · **Source:** audit/13 · #20

## Goal
No metric in `getCalculations()` can return `Infinity` or `NaN`, and the three hardcoded constants live in state, not in the formula.

## Symptom & root
`seasonDays = 0` or `ownersCount = 0` renders `€∞`; a corrupted `taxi_calc_state` leaks through every metric. Root: `_sanitizeState()` (`calculator.store.js:71-91`) checks type and finiteness but not range — `0` and negatives pass, then divide at lines 169-171, 187, 189-190, 193.
Fuel use `8.7` (166), VAT `1.13` (155), safety net `0.05` (181) are inlined: the van's key unit-economics parameter and a legally set tax rate change only by release.

## Scope
- `js/calculator.store.js`
- `test/calculator.store.test.js`
- this card

Everything else is off-limits — no view, HTML or CSS.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tempted to expose the new fields in the settings modal → **do not**. That is CALC-02.
3. `SCHEMA_VERSION` bump looks needed → stop, escalate. New fields stay additive: an old payload merges over `DEFAULT_STATE` unchanged.
4. Default outputs shift by a cent → the constants are wrong, stop.
5. A second bug found → log below, finish this card.

## Done when
1. `fuelConsumptionPer100km: 8.7`, `vatRate: 1.13`, `safetyNetRatio: 0.05` are in `DEFAULT_STATE` and used by `getCalculations()`.
2. A per-field range table clamps every numeric field in `_sanitizeState()`; out-of-range and non-finite values fall back to the default.
3. Every divisor (`seasonDays`, `ownersCount`, the three intervals) has a minimum above zero.
4. Tests cover `seasonDays = 0`, `ownersCount = 0`, `oilInterval = 0`, negatives and a corrupted localStorage payload — all metrics finite.
5. Existing tests (VAT 13%, 50/50 and 33/33/33 split, wear) pass unchanged.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
