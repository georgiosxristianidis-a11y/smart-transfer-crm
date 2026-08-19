# DATA-11 — Shift UI: open, close, norm by shift

**Severity:** HIGH · **Size:** M · **Owner:** 🔵 HORSE

## Goal
Driver opens a shift and closes it with the odometer; "9 из 13" counts the shift's trips, not a date.

## Symptom & root
- `js/app.js:15-17` — `ShiftsStore` built "no UI yet": nothing creates a shift, `shiftId` always `null`.
- `js/app.js:81-99` — norm from `t.date === todayStr`: a night shift splits at midnight and the bar lies.
- `getShiftDistance()`/`assignTripToShift()` have no callers.

## Scope
- `index.html` — shift bar above `#shift-norm-container` + modals
- `js/shifts.view.js` **new** · `js/app.js` norm · `js/trips.view.js` binding
- `css/style.css` (tokens) · `test/shifts.view.test.js` **new** · `test/e2e.test.js`

Everything else is off-limits.

## Behaviour
1. No shift → **Открыть смену**; asks odometer (optional), `normTarget` from `tripsPerDay`.
2. Open → start time, hours elapsed, **Закрыть смену**; asks `odoEnd`, error inline.
3. A trip binds on **completion** (and on create, if a shift runs), else `null`. The hotel list predates any shift: binding on create alone holds the norm at 0.
4. Norm counts the shift's completed trips; no shift → by date, as now.

## STOP
1. File outside Scope → escalate.
2. Schema or store API change → new DATA card.
3. Auto-open/close by timer or first trip → forbidden.
4. Shift history, editing a closed shift, reports → out.
5. Tab count, start tab, nav position → stop.
6. `alert`/`confirm` → use the existing modal pattern.

## Done when
1. Open creates one `open` shift; reload keeps it; a second open is unreachable.
2. `odoEnd < odoStart` → error, shift stays open.
3. A trip added before the shift and completed during it counts toward the norm.
4. Shift 22:00, trips 23:30 + 00:30 → "2 из N" at 00:31; no midnight reset.
5. No shift → counters unchanged.
6. `Сегодня €` reads `Смена €` while a shift runs — the number is shift money.

## Gates
`npm test` 0 · `npm run lint` 0 · `npm run docs:budget` 0
