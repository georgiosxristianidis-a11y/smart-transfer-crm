# CALC-01 — Input VAT 24% (Невозвратный входной НДС)

**Severity:** HIGH · **Size:** S · **Owner:** 🟢 GEMINI · **Status:** ✅ DONE · **Source:** economics review · #23

## Goal
The calculator models non-refundable 24% input VAT on operating expenses alongside 13% output VAT on fares.

## Symptom & root
In Greek passenger transport, 24% input VAT on costs is not offset against 13% output VAT. Previously, only fare output VAT (`vatRate: 1.13`) was tracked, leaving non-deductible input VAT (~€5 033/yr) unmeasured.

## Scope
- `js/calculator.store.js`
- `js/calculator.view.js`
- `index.html`
- `test/calculator.store.test.js`
- `docs/handoff/cards/CALC-01-input-vat.md`
- `docs/handoff/QUEUE.md`
- `NEXT_SESSION.md`

## STOP
1. File outside Scope → stop.
2. Tab count, start tab, fixed button position changes → stop.
3. Converting expenses to net (inflating profit) → stop. Expenses stay gross cash outflows.
4. Default `netProfitYear` or `dailyNet` shifts → stop.

## Pinned literal test values
- `tripsPerDay = 13`, `seasonDays = 122`, `checkGross = €45`, `totalTrips = 1586`
- `grossRevenue = €71 370`
- `outputVatYear = 71370 - (1586 * 45 / 1.13) = €8 210.71`
- `fuelCost = €15 964.52` → `inputVatFuel = €3 089.91`
- `totalMaintenance = €5 841.77` → `inputVatMaintenance = €1 130.66`
- `washCost = €2 400` → `inputVatWash = €464.52`
- `accountant = €1 800` → `inputVatAccountant = €348.39`
- `inputVatNonRefundable = 3089.91 + 1130.66 + 464.52 + 348.39 = €5 033.47`

## Done when
1. `inputVatRate: 1.24` in `DEFAULT_STATE` and `NUMERIC_RANGES`.
2. `getCalculations()` exposes `outputVatYear`, `inputVatFuel`, `inputVatMaintenance`, `inputVatWash`, `inputVatAccountant`, `inputVatNonRefundable`.
3. Unit tests pass with exact pinned literal figures within €0.01.
4. Division-by-zero guards clamp invalid `inputVatRate`.
5. All gates print 0.

## Gates
- `node .gemini/scripts/gate-dv.mjs` · `npm run lint` · `npm test` · `npm run docs:budget` · `npm run build:sw`
