# DS-01 — Contrast hierarchy in tokens (Hero ≥ 7:1)

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟢 GEMINI 3.7

## Goal
Implement a 3-tier sunlight-proof contrast token hierarchy in CSS (hero ≥ 7:1, primary, muted decor) so key numbers and statuses remain readable under harsh Cretan sunlight.

## Symptom & root
In Mediterranean sunlight glare, UI elements wash out on mobile screens. Tokens lacked an explicit Hero tier with enforced ≥7:1 ratio against high-elevation surfaces (`tokens.css:46-48`).

## Scope
- `css/tokens.css`
- `css/style.css`
- `docs/handoff/cards/DS-01-contrast-tokens.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab structure, HTML layout, or JS store logic would change → stop.
3. System emojis or toxic red colors introduced → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. `--text-hero` is defined and verified ≥ 7:1 against all surface tiers.
2. Status pill fg tokens meet sunlight contrast (≥ 7:1).
3. Existing semantic aliases remain 100% backward compatible.
4. All gates print 0.

## Gates
- `node scripts/check-docs-budget.mjs` — prints 0
- `node --test test/calculator.store.test.js test/trips.store.test.js` — 0 failures
