# DRIVE-02 — Screen stays awake only while a trip is running

**Severity:** LOW · **Size:** S · **Owner:** 🔵 HORSE

## Goal
The screen does not sleep while the driver is on a job, and nothing keeps it awake when he is not.

## Symptom & root
Not a defect — a missing behaviour. On the way to the airport the driver glances at the card; the phone sleeps and he has to unlock it with a passenger in the car. The obvious workaround, raising the system sleep timeout, keeps the screen on all day and is the single largest battery and heat cost on a windshield.

`app.js` also never pauses the animated layers when the tab is hidden, so DRIVE-01's paused state has nobody to switch it on.

## Scope
- `js/app.js` — Wake Lock acquire and release, `visibilitychange` handling, the body state class from DRIVE-01.
- `test/app.wakelock.test.js` — **new**, API injected, no real Wake Lock.

Everything else is off-limits. Depends on DRIVE-01 being merged.

## STOP
1. File outside Scope → stop, escalate.
2. Any CSS → DRIVE-01.
3. Requesting the lock on app start or on tab switch → **only** while a trip is in progress.
4. Geolocation, sensors or any new permission prompt → stop, escalate.
5. Second bug found → log below, do not fix.

## Done when
1. The lock is requested when a trip moves to in-progress and released on completion, on cancel, and on `visibilitychange` to hidden.
2. It is re-acquired when the tab becomes visible again if a trip is still in progress — a Wake Lock is dropped by the browser on hide and does not return by itself.
3. Every call is wrapped: an unsupported or rejected API is a silent no-op, never a thrown error and never a message to the driver.
4. Hiding the tab sets the paused state class; showing it clears it.
5. A test asserts the lock is released when no trip is in progress.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
