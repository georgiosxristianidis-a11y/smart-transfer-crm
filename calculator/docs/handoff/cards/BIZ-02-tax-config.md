# BIZ-02 — Every tax number carries its source and its date

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
No tax figure appears on screen without saying where it came from and when a human last checked it.

## Symptom & root
`calculator.store.js:156` — `checkNet = s.checkGross / 1.13` is the only tax logic, and 13 % is a bare literal with no source and no date.
The plan went further: 24 % input VAT credited against 13 % output, as a settled €11.3k. Greek VAT law restricts input deduction on fuel and servicing for passenger cars, with a taxi exception depending on the regime. Not a judgement the app can make. Either way: a number the owner cannot trace is one he will act on and cannot defend.

The accountant is already a €1800 line at `calculator.store.js:35` — the source exists, unwired.

## Scope
- `js/tax.config.js` — **new**. Every rate as `{value, source, verifiedOn, note}`.
- `js/calculator.store.js` — rates from the config; no literals left.
- `js/calculator.view.js` — render `verifiedOn` beside any rate-derived figure.
- `test/tax.config.test.js` — **new**.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. **Do not invent a VAT reclaim figure.** Unconfirmed by the accountant in writing → the entry stays absent. Not zero, not estimated. Absent.
3. Consumption and CPK → BIZ-01.
4. A tax rate for another country → stop, escalate.
5. Second bug found → log below, do not fix.

## Done when
1. `grep -n "1\.13\|0\.24\|0\.13" js/*.js` returns nothing outside `tax.config.js`.
2. Every entry has a non-empty `source` and an ISO `verifiedOn`; a test fails the build if either is missing or malformed.
3. The UI shows "проверено: <date>" beside any figure a rate feeds, marked stale past 12 months.
4. Removing an entry removes the metric, rather than defaulting it to zero.

## Gates
- `npm test` · `npm run build:sw` · `npm run docs:budget` — all 0

## Found along the way
_(empty)_
