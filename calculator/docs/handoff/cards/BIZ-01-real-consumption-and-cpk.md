# BIZ-01 — Real litres per 100 km, real cost per km

**Severity:** MEDIUM · **Size:** M · **Owner:** 🟠 LEAD-OPUS

## Goal
The business screen stops guessing what the car drinks. It reads the refuel log the app already keeps and shows the gap between plan and reality.

## Symptom & root
`calculator.store.js:166` — `litersNeeded = (totalKm / 100) * 8.7`. The 8.7 is a guess, while `fuel.store.js` holds actual litres and euros for every refuel. The app owns the truth, ignores it, and presents the guess as a metric.
`fuel.store.js:79` compounds it: missing litres are derived from a hardcoded €1.90/L, so the log itself can hold invented litres.
Cost per km — the number answering "can I take this job for €30?" — exists nowhere.

## Scope
- `js/shared/consumption.js` — **new**. Pure functions over refuel logs and odometer readings.
- `js/calculator.store.js` — use the measured figure when data suffices; else the named default.
- `js/calculator.view.js` — one line: measured versus planned, plus CPK.
- `test/consumption.test.js` — **new**.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. ROIC, EBITDA, EBIT, Deadhead, scenario switches → **out of scope by decision**; none changes a decision the owner makes.
3. VAT and any tax figure → BIZ-02.
4. The reserve and the divisor guards → MONEY-01.
5. Second bug found → log below, do not fix.

## Done when
1. Consumption comes from consecutive refuels with odometer readings; fewer than two yields `null`, never a guess dressed as a measurement.
2. When the measurement is missing the UI says so, and never prints the default as if it were measured.
3. CPK = (fuel + maintenance) per km from actuals where available; the screen states which inputs were measured.
4. `null` propagates: no metric from missing data renders as `0`.
5. A three-refuel fixture asserts the exact litres per 100 km.

## Gates
- `npm test` · `npm run build:sw` · `npm run docs:budget` — all 0

## Found along the way
_(empty)_
