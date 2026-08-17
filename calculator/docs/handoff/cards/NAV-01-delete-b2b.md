# NAV-01 — Delete B2B placeholder tab and navigation item

**Severity:** LOW · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Remove the non-functional B2B tab and bottom nav item from index.html to reduce interface noise and shrink navigation surface.

## Symptom & root
The B2B tab (`index.html:248-255`) is an empty placeholder occupying 20% of the navigation bar (`index.html:275-278`), delivering zero user value (NAV_SPEC §2).

## Scope
- `index.html`
- `docs/handoff/cards/NAV-01-delete-b2b.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Trip source pills `data-source="b2b"` or trip store modified → stop (only the navigation tab is deleted).
3. Remaining tab structure or JS logic modified → stop.
4. A second bug found → do not fix it, finish this card.

## Done when
1. `#tab-b2b` and `.nav-item[data-target="tab-b2b"]` are removed from `index.html`.
2. Remaining bottom navigation items switch tabs cleanly without console errors.
3. All gates print 0.

## Gates
- `npm test` — 0 failures
- `node scripts/check-docs-budget.mjs` — prints 0
- `node ../.gemini/scripts/gate-dv.mjs` — prints 0

## Found along the way
None.
