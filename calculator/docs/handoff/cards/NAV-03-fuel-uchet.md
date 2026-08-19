# NAV-03 — Fuel: history into Учёт, ⛽ button onto Смена

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Move fuel history and expense summary into the «Учёт» tab and add a 2-tap quick fuel button to the «Смена» screen (NAV_SPEC §2, §3).

## Symptom & root
Fuel was an isolated 4th navigation tab (`#tab-fuel`), forcing drivers to switch away from operations to log refuelling. In the field (petrol station, waiting), refuelling must take 2 taps directly from the active shift screen without visual search.

## Scope
- `index.html`
- `js/fuel.view.js`
- `css/style.css`
- `docs/handoff/cards/NAV-03-fuel-uchet.md`
- `docs/handoff/QUEUE.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Changes to calculation logic or store state schema → stop.
3. Introducing system emojis or non-compliant colors → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. `#tab-fuel` in bottom nav is replaced by `#tab-uchet` («Учёт»).
2. Quick fuel button `#btn-quick-fuel` on «Смена» opens modal `#modal-quick-fuel` allowing 1-tap presets (+€20, +€50, +€90) and custom input.
3. Fuel history and metrics render in the «Учёт» tab.
4. All gates pass with 0 failures and docs budget in norm.

## Gates
- `npm test` — 0 failures
- `node scripts/check-docs-budget.mjs` — prints 0

## Found along the way
None.
