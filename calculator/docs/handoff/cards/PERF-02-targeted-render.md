# PERF-02 — Render what changed, unsubscribe what died

**Severity:** MEDIUM · **Size:** L · **Owner:** 🔵 HORSE

## Goal
Completing a trip updates one card, not the whole list. Scroll position, focus and open dropdowns survive an update.

## Symptom & root
- `trips.view.js:420` — every notification rebuilds the entire list through `innerHTML`. At 1500 trips that is a full parse and layout on every status change, and it silently resets scroll position and any focused input.
- `trips.store.js:21` — `subscribe()` pushes into an array and returns nothing. There is no way to unsubscribe, so every view that is recreated leaves its old listener alive, still rendering into detached nodes. Same shape in `fuel.store.js:64` and `calculator.store.js:55`. Queue item 17.

## Scope
- `js/trips.store.js`, `js/fuel.store.js`, `js/calculator.store.js` — `subscribe()` returns an unsubscribe function.
- `js/trips.view.js` — keyed per-trip rendering.
- `test/trips.view.test.js` — **new**.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Introducing a framework or a virtual DOM library → **stop**. Keyed nodes and `html` from `shared/utils.js` are enough.
3. Raw `innerHTML` with user data → forbidden, `CLAUDE.md:14`.
4. Changing sort order, filters or what a card displays → this card changes how it renders, not what.
5. Second bug found → log below, do not fix.

## Done when
1. `subscribe()` returns a function; calling it stops delivery, and a test asserts a removed listener is never called again.
2. Changing one trip's status touches only that trip's DOM node — a test asserts sibling nodes are the same object references.
3. Scroll position and focus survive an update.
4. A test with 1000 trips asserts a single status change costs under 16 ms.
5. Every view exposes `destroy()` and every view calls it in the test teardown.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
