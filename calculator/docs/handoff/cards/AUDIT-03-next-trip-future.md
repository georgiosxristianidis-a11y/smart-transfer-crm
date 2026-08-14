# AUDIT-03 — getNextUpcomingTrip: filter by future datetime

**Severity:** HIGH · **Size:** S · **Owner:** 🔵 HORSE

## Goal
getNextUpcomingTrip() must return the first non-completed trip whose datetime >= now (local time), not simply the first non-completed trip sorted by date.

## Symptom & root
If a driver forgets to mark yesterday's transfer as completed, the hero block permanently sticks on that stale trip. Root: `trips.store.js:110-112` filters only `status !== 'completed'`, then returns `activeTrips[0]` — the oldest pending trip by sort order, regardless of whether its datetime is in the past.

## Scope
- `js/trips.store.js`
- `test/trips.store.test.js`
- `docs/handoff/cards/AUDIT-03-next-trip-future.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. HTML, CSS, or app.js changes needed → stop.
3. Data schema changes needed → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. `getNextUpcomingTrip()` returns only trips with `date+time >= now` (local timezone).
2. Past pending trips are NOT returned, even if non-completed.
3. New test cases cover the past-trip stale scenario.
4. All gates print 0.

## Gates
- `node scripts/check-docs-budget.mjs` — prints 0
- `node --test test/calculator.store.test.js test/trips.store.test.js` — 0 failures
