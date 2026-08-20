# SHIFT-01 — Close shift: what should be in the pocket

**Severity:** HIGH · **Size:** M · **Owner:** 🔵 HORSE

## Goal
At the end of the day the driver taps one button and sees a number he can verify by hand: how much cash should be in his pocket right now. He taps it for himself, and the backup leaves as a side effect.

## Symptom & root
Not a defect — a missing load-bearing screen. Everything shown today is belief: revenue, norm, profit. None of it checks against anything physical, so nothing forces a daily habit and the backup has no ritual to attach to.
The header at `app.js:97` shows revenue and trips all day, so repeating them at close earns no tap. Only the cash figure is new information.

## Scope
- `js/shifts.view.js` — **new**. Open-shift and close-shift screens.
- `js/trips.view.js` — the ⛽/close-shift entry point on Смена only.
- `index.html`, `css/style.css` — markup and styles for the two screens.
- `test/shifts.view.test.js` — **new**.

Everything else is off-limits. Depends on DATA-10 and DATA-11 being merged.

## STOP
1. File outside Scope → stop, escalate.
2. Telegram, network, backup sending → SYNC-01. This card only sets `closedAt` and `cashEnd`.
3. Tab count, start tab or fixed button positions → `CLAUDE.md:10`, stop and escalate.
4. `alert()` or `confirm()` → forbidden; queue item 19.
5. Second bug found → log below, do not fix.

## Done when
1. Expected cash = `cashStart` + cash trips + tips − cash refuels − cash port fees. Card payments excluded, shown separately.
2. It is the single hero of the screen (`CLAUDE.md:21`). The driver enters actual cash; a mismatch shows as a signed delta, never hidden or auto-corrected.
3. Closing writes `closedAt` and `cashEnd`; a shift closes exactly once.
4. Closing with an open trip warns but does not block.
5. Reopening after close offers a new shift, never reuses the closed one.

## Gates
- `npm test` · `npm run build:sw` · `npm run docs:budget` — all 0

## Found along the way
_(empty)_
