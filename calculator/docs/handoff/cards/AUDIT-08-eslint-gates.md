# AUDIT-08 — ESLint into the gates

**Severity:** HIGH · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Configure flat ESLint with security plugin into automated gates (`npm run lint`, `npm run check`) with zero errors.

## Symptom & root
ESLint was installed in `package.json` but had no flat configuration and no `lint` script, never running in CI or local verification (`docs/handoff/audit/08-eslint-never-runs.md`).

## Scope
- `eslint.config.js`
- `.eslintrc.json`
- `package.json`
- `.gitignore`
- `CLAUDE.md`
- `docs/handoff/QUEUE.md`
- `docs/handoff/cards/AUDIT-08-eslint-gates.md`
- `js/`, `scripts/`, `sw.js`, `test/` (lint fixes only)

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. `npm test` red for a reason unrelated to this card → stop, open a separate card.
4. A second bug found → do not fix it. Log it below, finish this card.
5. The task outgrew one card → stop, return to 🟠 LEAD for splitting.

## Done when
`npm run check` exits with code 0 and zero warnings on a clean tree.

## Gates
- `npm run lint` — 0 errors, 0 warnings
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
