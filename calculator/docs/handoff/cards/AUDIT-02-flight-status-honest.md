# AUDIT-02 — Flight status: stop passing a simulation off as live data

**Severity:** CRITICAL · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
Remove fake hash-based status simulation and fake Sync button. Implement strict IATA carrier whitelist and honest unknown status with direct Flightradar24 link.

## Symptom & root
`flight.service.js` used a modulo-5 hash on flight code string to mark every 5th flight as "delayed +25m" and used `diffMins < -15` to mark flights as landed. `trips.view.js` showed a fake "Sync" button that spun for 800ms and alerted that the flight was synced.

## Scope
- `js/shared/flight.service.js`
- `js/trips.view.js`
- `css/tokens.css`
- `css/style.css`
- `test/trips.store.test.js`
- `docs/handoff/cards/AUDIT-02-flight-status-honest.md`

## Done when
1. ✅ `flight.service.js` has no hash/simulation and returns honest `status: 'unknown'`, `label: 'Flightradar24'` without external override.
2. ✅ `KNOWN_IATA_CODES` whitelist matches real airlines and rejects non-flight false positives (`Room 1205`, `+30 694 1234`, `ул. 25 Августа 1234`).
3. ✅ Fake "Sync" button and fake alert removed from UI.
4. ✅ Flight radar links lead directly to Flightradar24 (`rel="noopener noreferrer"`).
5. ✅ All test suites pass (0 failures).
