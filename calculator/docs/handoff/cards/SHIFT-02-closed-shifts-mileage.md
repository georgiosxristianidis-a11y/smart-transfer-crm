# SHIFT-02 — Display closed shifts mileage in UI

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟢 GEMINI

## Goal
Driver can view the history of closed shifts on the Accounting ("Учёт") tab with start/end time, duration, odometer readings, and total distance in kilometers.

## Symptom & root
- Shifts store (`js/shifts.store.js:192`) computes `getShiftDistance(id)` from `odoStart` and `odoEnd`, but closed shifts are rendered nowhere in the UI (`NEXT_SESSION.md:24`).
- Drivers who complete their day have no visual log of their daily mileage or working hours.

## Scope
- `index.html` — add closed shifts history container on tab-uchet
- `js/shifts.view.js` — render closed shifts list with distance and duration
- `css/style.css` — styling for shift log cards using design tokens
- `test/shifts.view.test.js` — tests for distance/duration formatting and history rendering
- this card

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to OWNER.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. Modifying `shifts.store.js` schema or API → stop.
4. Auto-closing shifts or editing past shifts → out of scope.
5. A second bug found → log it below, finish this card.

## Done when
1. Closed shifts render in a dedicated section on the Учёт tab, sorted newest first.
2. Each closed shift card shows: start/end time, date, duration ("H ч MM мин"), odometer range (`odoStart → odoEnd`) and distance (`+N км`).
3. If odometer was not entered, distance shows `—` without crashing.
4. Reactive updates when a shift is closed.
5. All gates pass (`node gate-dv.mjs`, `npm test`, `npm run lint`, `npm run docs:budget`).

## Gates
- `npm test` — 0 failures
- `npm run lint` — 0 errors, 0 warnings
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
