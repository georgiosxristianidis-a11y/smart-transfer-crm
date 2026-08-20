# TRUTH-02 — One local-date helper, no UTC anywhere

**Severity:** HIGH · **Size:** M · **Owner:** 🔵 HORSE

## Goal
A refuel at 01:00 in Crete is dated today, not yesterday. Every date in the app is the date the driver would write down.

## Symptom & root
Greece is UTC+3 in summer, so `toISOString()` shifts the date backwards for everything logged before 03:00 — the exact hours a transfer business works.
- `fuel.store.js:84` — `addFuelLog` dates every refuel via `toISOString()`.
- `fuel.store.js:133` — `getMetrics` builds "today" the same way, so a late refuel is missing from today **and** from the day it was filed under.
- `fuel.store.js:115` and `trips.store.js:75` — same in import paths.
- `app.js:80` already does it correctly by hand; that logic belongs in one place. Queue item 3.

## Scope
- `js/shared/utils.js` — add `localDate(d)` → `YYYY-MM-DD` and `localTime(d)` → `HH:MM`.
- `js/fuel.store.js`, `js/trips.store.js`, `js/app.js` — call sites only.
- `test/utils.test.js` — **new**; `test/fuel.store.test.js` — extend.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. `generateGCalLink` at `trips.store.js:163` keeps `toISOString()` — Google Calendar wants UTC. **Do not touch it.**
3. Introducing a date library → stop, escalate.
4. Shift boundaries and business-day logic → DATA-10 already owns this.
5. Second bug found → log below, do not fix.

## Done when
1. `grep -n "toISOString().split" js/` returns only `trips.store.js:163` (the calendar link).
2. A test freezes the clock at 01:30 local and asserts the stored date equals the local calendar date.
3. `getMetrics` today/week/month buckets agree with the stored dates at 01:30 and at 23:30.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
