# PERF-04 — Pause shifts timer when screen is off or tab hidden

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟢 GEMINI

## Goal
The shifts elapsed-time interval pauses when the app is backgrounded or the screen is locked, preventing battery drain under high ambient heat.

## Symptom & root
- `shifts.view.js:46` sets `setInterval(() => this.render(), 60000)` unconditionally.
- When the driver locks their phone on the sun-exposed dashboard, the timer keeps waking up the CPU every minute in the background.

## Scope
- `js/shifts.view.js`
- `test/shifts.view.test.js`
- this card

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate to OWNER.
2. Changing tab layout, DOM structure, or CSS → stop.
3. Modifying `shifts.store.js` → stop.
4. Second bug found → log below, do not fix.

## Done when
1. `document.addEventListener('visibilitychange')` stops the timer when `document.visibilityState === 'hidden'`.
2. When the tab becomes `'visible'`, `render()` runs immediately and the timer resumes.
3. `destroy()` cleans up the timer and event listener.
4. Unit tests verify pause on hidden, immediate render on visible, and clean teardown.

## Gates
- `npm test` — 0 failures
- `npm run lint` — 0 errors, 0 warnings
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
