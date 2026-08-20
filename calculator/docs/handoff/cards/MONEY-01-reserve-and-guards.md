# MONEY-01 — A reserve is not an expense; no division by zero

**Severity:** HIGH · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
Profit stops being understated by design, and no input can make the business screen print `Infinity` or `NaN`.

## Symptom & root
- `calculator.store.js:181` — `safetyNet = netRevenue * 0.05` joins `totalExpenses` at line 183 and is subtracted from profit. A reserve is money moved, not spent. Every profit figure is 5 % of net revenue too low, permanently.
- `calculator.store.js:169-171` — `totalKm / s.oilInterval` etc. Setting an interval to 0 yields `Infinity` costs.
- `calculator.store.js:189` — `/ s.ownersCount`. Zero owners yields `Infinity` profit per owner. Queue item 20.
- `calculator.store.js:166` — magic `8.7` and `1.13`, `0.05` inline with no name.

## Scope
- `js/calculator.store.js` — maths and named constants only.
- `test/calculator.store.test.js` — extend.

Everything else is off-limits. **No UI, no new metrics.**

## STOP
1. File outside Scope → stop, escalate.
2. Real consumption from fuel logs → BIZ-01. The `8.7` stays here as a **named** default.
3. VAT rate changes → BIZ-02. `1.13` is only given a name here, not a new value.
4. Adding ROIC, EBITDA or scenarios → **out of scope by decision**, they change no decision.
5. Second bug found → log below, do not fix.

## Done when
1. `safetyNet` is reported as its own line and is **not** part of `totalExpenses`; a new `cashAfterReserve = netProfitYear - safetyNet` exists for anyone who wants the old view.
2. Every divisor is guarded: a non-positive divisor yields `0`, never `Infinity` or `NaN`.
3. A test asserts no metric is `NaN` or `Infinity` when every numeric input is `0`.
4. `8.7`, `1.13`, `0.05` are named constants with a one-line comment each.
5. The existing 50/50 split and VAT tests stay green unedited.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
