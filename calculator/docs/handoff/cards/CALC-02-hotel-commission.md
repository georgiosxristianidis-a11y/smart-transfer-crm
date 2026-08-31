# CALC-02 — Hotel Commission 10%

**Severity:** HIGH · **Size:** S · **Owner:** 🟢 GEMINI · **Status:** ✅ DONE · **Source:** economics review · #24

## Goal
The calculator models partner/hotel commission (10% per pickup) with a toggle in settings and accounts for it in expenses.

## Symptom & root
In Greek resort transfers, partner bookings take ~10% commission. Previously, the model assumed 100% direct bookings with 0% commission, overstating net margins.

## Scope
- `js/calculator.store.js`
- `js/calculator.view.js`
- `index.html`
- `test/calculator.store.test.js`
- `docs/handoff/cards/CALC-02-hotel-commission.md`
- `docs/handoff/QUEUE.md`
- `NEXT_SESSION.md`

## STOP
1. File outside Scope → stop.
2. Tab count, start tab, fixed button position changes → stop.
3. Default numbers shift when toggle is OFF → stop. Default is `hotelCommissionEnabled: false`.
4. Unrelated test fails → stop.

## Pinned literal test values (13 trips/day, 122 days, €45 fare)
- `totalTrips = 1586`, `grossRevenue = €71 370`
- Toggle OFF (default): `hotelCommissionCost = €0.00`, `netProfitYear = €20 181.64`, `dailyNetPerOwner = €82.71`
- Toggle ON (`hotelCommissionRate = 0.10`):
  - `hotelCommissionPerTrip = €4.50`
  - `hotelCommissionCost = €7 137.00`
  - `totalExpenses = €46 942.65`
  - `netProfitYear = €13 044.64`
  - `dailyNetPerOwner = €53.46`

## Done when
1. `hotelCommissionEnabled: false` & `hotelCommissionRate: 0.10` in `DEFAULT_STATE` and `NUMERIC_RANGES`.
2. `getCalculations()` computes `hotelCommissionPerTrip` & `hotelCommissionCost` in `totalExpenses`.
3. Unit tests pass with exact pinned literal figures within €0.01 tolerance.
4. Range bounds guard `hotelCommissionRate` against negatives and overflow.
5. Toggle `tog-hotel-commission` in `modal-calc-settings` bound in view.
6. All gates print 0.

## Gates
- `node .gemini/scripts/gate-dv.mjs` · `npm run lint` · `npm test` · `npm run docs:budget` · `npm run build:sw`
