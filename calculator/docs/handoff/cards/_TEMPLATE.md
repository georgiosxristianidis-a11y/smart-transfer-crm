# <ID> — <title>

**Severity:** HIGH · **Size:** M · **Owner:** 🔵 HORSE

## Goal
<one sentence: what changes for the user>

## Symptom & root
<what the user sees> / <why it happens, with `file:line` references>

## Scope
- `js/trips.store.js`
- `test/trips.store.test.js`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. `npm test` red for a reason unrelated to this card → stop, open a separate card.
4. A second bug found → do not fix it. Log it below, finish this card.
5. The task outgrew one card → stop, return to 🟠 LEAD for splitting.

## Done when
<checkable criterion>

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0
- <card-specific>

## Found along the way
<empty, or a list for new cards>
