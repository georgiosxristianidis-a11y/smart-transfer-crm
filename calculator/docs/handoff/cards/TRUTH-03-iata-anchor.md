# TRUTH-03 — A flight number must start with a real airline

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE

## Goal
A house number or a hotel room stops being displayed as a flight. A flight badge appears only when there is actually a flight.

## Symptom & root
`flight.service.js:13` matches `\b([A-Z0-9]{2})\s?([0-9]{3,4})\b` against free text. That pattern accepts almost anything with two characters and three digits: `"Софокли 12 345"` becomes flight `S12345`; a phone fragment becomes a flight; a room number becomes a flight. The regex then hands a fake code to the radar link, and the driver taps through to a 404 on the way to the airport.

## Scope
- `js/shared/flight.service.js` — `extractFlightCode` only.
- `test/flight.service.test.js` — extend.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Any network lookup to validate the code → stop. This is a local allow-list.
3. Editing `getFlightRadarUrl` → out of scope, it is correct.
4. Making the list configurable in the UI → stop, escalate.
5. Second bug found → log below, do not fix.

## Done when
1. A module-level allow-list of IATA prefixes actually serving HER and CHQ — at minimum `A3 OA GQ U2 EJU FR RK W6 W4 LH EW DE X3 SQ TK PC BA EZY TO HV VY D8 DY SK LO OS LX AZ`.
2. A prefix outside the list returns `null`, no badge, no link.
3. Tests cover: a real code matches; `"Софокли 12 345"` returns null; a 10-digit phone returns null; lowercase input still matches.
4. The list carries a one-line comment saying it is a Crete-season list, not a world list.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
