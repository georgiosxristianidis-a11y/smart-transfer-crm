# TRUTH-01 — Delete the fabricated flight status

**Severity:** CRITICAL · **Size:** M · **Owner:** 🔵 HORSE

## Goal
The app stops claiming it knows where the plane is. The radar link stays, and one tap lets the driver tell the app what the radar said.

## Symptom & root
`flight.service.js:66` sums the character codes of the flight number and, when the sum divides by 5, renders "Задержка +25м". `flight.service.js:61` calls anything past its scheduled time "Приземлился". This is not data — a hash shown as live status, in the largest type on the screen. Queue item 5.

The radar link at `flight.service.js:27` is correct and must survive: an `https://` Flightradar24 URL is a Universal Link, so the OS opens the native app if installed, the web page if not. **Do not swap it for a `flightradar24://` scheme** — a regression with no fallback.

## Scope
- `js/shared/flight.service.js` — delete `resolveFlightStatus`; keep `extractFlightCode`, `getFlightRadarUrl`, nav builders.
- `js/trips.view.js` — badge = flight code → radar link, plus a "борт сел" button writing `actualLanding` (from DATA-10).
- `test/flight.service.test.js` — **new**.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Any live flight API, key or fetch → **stop**. This card removes a lie; it does not buy data.
3. Adding `actualLanding` to the schema → it must already exist from DATA-10. If it does not, stop.
4. The 45-minute departure offset stays a constant this season → do not parameterise it.
5. Second bug found → log below, do not fix.

## Done when
1. `grep -n "flightStatusOverride\|resolveFlightStatus" js/` returns nothing.
2. No badge ever shows a status the app did not receive from a human tap.
3. Tapping "борт сел" stores `actualLanding` and shifts the displayed departure time by the observed delta.
4. Radar link is still `https://` and opens for a trip with a flight code.

## Gates
- `npm test` · `npm run docs:budget` — both 0

## Found along the way
_(empty)_
