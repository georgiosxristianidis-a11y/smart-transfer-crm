# CLEAN-02 — An empty app shows empty, not invented refuels

**Severity:** HIGH · **Size:** S · **Owner:** 🔵 HORSE

## Goal
A first-run app contains zero of the owner's money. No refuel exists that the owner did not make.

## Symptom & root
`fuel.store.js:36` — when localStorage holds nothing, `loadLocalLogs()` returns two invented refuels: €50 / 26.3 L at "BP Heraklion" and €90 / 47.4 L at "Shell Airport", dated today and 2026-08-10. This is not a fixture behind a flag; it is the production fallback. On day one the owner sees €140 of fuel he never bought, and every fuel metric, every consumption figure and every future CPK is computed on top of it. Queue item 18.

It is also load-bearing in the wrong direction: clearing all refuels resurrects the demo pair on the next reload, so the data cannot be removed from the UI at all.

## Scope
- `js/fuel.store.js` — `loadLocalLogs()` fallback only.
- `test/fuel.store.test.js` — **new** or extend.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Moving the demo rows into a test fixture file is fine; **shipping them behind a flag is not** — delete them from the runtime path.
3. Empty-state copy and styling → 🟢 GEMINI, separate card.
4. The `odo` field on refuels → DATA-11.
5. Second bug found → log below, do not fix.

## Done when
1. Empty storage yields `[]`.
2. Deleting every refuel and reloading still yields `[]` — the demo pair never returns.
3. `getMetrics()` on an empty log returns zeros, not `NaN`.
4. `grep -n "BP Heraklion\|Shell Airport" js/` returns nothing.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
