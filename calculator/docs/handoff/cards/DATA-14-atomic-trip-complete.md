# DATA-14 — Atomic trip complete and shift binding

**Severity:** HIGH · **Size:** S · **Owner:** 🟢 GEMINI

## Goal
Marking a trip completed and binding it to the running shift happens in a single atomic store operation, eliminating race conditions on mobile interruption.

## Symptom & root
- `trips.view.js:648-656` executes two consecutive async calls: `attachToOpenShift(tId)` and `updateTripStatus(tId, 'completed')`.
- An interruption (incoming phone call, low-battery shutdown, page navigation) between the two writes leaves the trip in an inconsistent state (bound to shift but status remains pending).

## Scope
- `js/trips.store.js`
- `js/trips.view.js`
- `test/trips.store.test.js`
- this card

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate to OWNER.
2. Data schema change → stop.
3. Swipe animation or gesture refactor → out of scope.
4. Second bug found → log below, do not fix.

## Done when
1. `TripsStore.completeTrip(tripId, shiftId)` updates `status: 'completed'` and `shiftId` in a single write and notifies subscribers once. — ✅ done
2. `trips.view.js` replaces the two-step call with `this.store.completeTrip(tId, openShiftId)`. — ✅ done
3. Unit tests verify single write and atomic update. — ✅ done
4. All existing tests pass. — ✅ 98/98 passed

## Gates
- `npm test` — 0 failures (98 pass)
- `npm run lint` — 0 errors, 0 warnings
- `npm run docs:budget` — prints 0

## Found along the way
<empty>

