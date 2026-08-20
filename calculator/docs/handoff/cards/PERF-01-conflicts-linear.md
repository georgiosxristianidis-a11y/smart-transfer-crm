# PERF-01 — Conflict detection in one pass

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Adding a trip in October stays instant. Conflict detection stops being the slowest thing in the app.

## Symptom & root
`trips.store.js:96` — `getConflicts()` is a nested loop over every active trip, and it allocates two `Date` objects inside the inner body. At 1500 trips that is roughly 1.1 million iterations and 2.2 million allocations, and it runs on every render. This — not event replay, not database size — is what will freeze the phone late in the season.

The fix is available for free: `this.trips` is already sorted by date and time (`trips.store.js:52`, `trips.store.js:88`). A sorted list only needs a forward window that stops as soon as the gap exceeds 45 minutes.

## Scope
- `js/trips.store.js` — `getConflicts()` only.
- `test/trips.store.test.js` — extend.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Changing what counts as a conflict — the 45-minute rule and the "completed trips excluded" rule stay exactly as they are.
3. Caching or memoising results → stop, escalate. Make the function cheap, do not add state.
4. Touching the render path → PERF-02.
5. Second bug found → log below, do not fix.

## Done when
1. One forward pass with a sliding window; the inner loop breaks as soon as the gap is 45 minutes or more.
2. Timestamps are computed once per trip, not once per comparison.
3. A test asserts the new result set is identical to the old one on a fixture with same-day, cross-day and boundary-exactly-45-minute cases.
4. A test with 2000 trips completes in under 50 ms.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
