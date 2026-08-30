# CALC-01 — Calculator constants and range guards

**Severity:** MEDIUM · **Size:** M · **Owner:** 🟢 GEMINI · **Status:** ✅ DONE · **Source:** audit/13 · #20

## Goal
No metric in `getCalculations()` can return `Infinity` or `NaN`, and the three hardcoded constants live in state, not in the formula.

## Symptom & root
`seasonDays = 0` or `ownersCount = 0` renders `€∞`; corrupted state leaks through metrics. Root: `_sanitizeState()` checked type/finiteness without range bounds — `0` and negatives passed and divided.
Constants `8.7`, `1.13`, `0.05` were hardcoded in formula.

## Scope
- `js/calculator.store.js`
- `test/calculator.store.test.js`
- this card

## STOP
1. A file outside Scope needed → stop, escalate.
2. Exposing new fields in settings modal → CALC-02.
3. `SCHEMA_VERSION` bump → do not bump; fields stay additive.
4. Default outputs shift by a cent → stop.
5. Second bug found → log below, finish card.

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
