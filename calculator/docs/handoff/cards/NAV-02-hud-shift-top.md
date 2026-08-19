# NAV-02 — HUD from modal to the top of the Смена screen

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Eliminate the legacy fullscreen HUD modal dialog and integrate all driver shift status (revenue, trips vs norm, next transfer focus) directly into the top of the «Смена» screen (NAV_SPEC §2).

## Symptom & root
Previously, drivers had to tap a "HUD" button to open a modal overlay (`#modal-driver-hud`) to inspect their next trip and operational shift status. Under degraded outdoor conditions (sun on screen, hurry, fatigue), modal dialogs add unnecessary interaction friction. The top of the Смена screen now acts directly as the persistent Driver HUD.

## Scope
- `index.html`
- `js/trips.view.js`
- `css/style.css`
- `docs/handoff/cards/NAV-02-hud-shift-top.md`
- `docs/handoff/QUEUE.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Changes to calculation logic or store state → stop.
3. Introducing system emojis or non-compliant colors → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. `#modal-driver-hud` and trigger buttons (`#btn-driver-hud`, `#hero-open-hud-btn`) are completely removed.
2. The top of the «Смена» screen presents key metrics (revenue, trips / norm, shift progress) and the Next Trip Hero card directly.
3. Unit tests pass with 0 failures and docs budget is within thresholds.

## Gates
- `npm test` / `node --test test/calculator.store.test.js test/trips.store.test.js test/backup.service.test.js` — 0 failures
- `node scripts/check-docs-budget.mjs` — budget in norm

## Found along the way
None.
