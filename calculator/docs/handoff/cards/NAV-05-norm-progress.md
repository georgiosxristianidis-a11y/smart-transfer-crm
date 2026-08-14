# NAV-05 — "9 of 13" norm progress on Смена

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE + 🟢 GEMINI

## Goal
Show daily trip progress against the planned norm ("9 из 13") on the Смена screen and header so the driver focuses on plan execution.

## Symptom & root
The header only displayed bare completed trips ("0") disconnected from the planned daily norm (`tripsPerDay` in `CalculatorStore`), breaking the closed loop between plan and shift execution (`NAV_SPEC §3`).

## Scope
- `index.html`
- `js/app.js`
- `css/style.css`
- `docs/handoff/cards/NAV-05-norm-progress.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Calculation logic changes in stores → stop.
3. System emojis or toxic colors introduced → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. Header "Поездок" displays `${completed} / ${norm}` dynamically from `CalculatorStore.state.tripsPerDay`.
2. Progress indicator on Смена reflects today's completed trip ratio in real time.
3. All gates print 0.

## Gates
- `node scripts/check-docs-budget.mjs` — prints 0
- `node --test test/calculator.store.test.js test/trips.store.test.js` — 0 failures
