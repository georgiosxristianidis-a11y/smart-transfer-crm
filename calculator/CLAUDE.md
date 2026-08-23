# CLAUDE.md — Smart Transfer

Product `docs/NAV_SPEC.md` · process `docs/handoff/PROTOCOL.md` · queue `docs/handoff/QUEUE.md` · state `NEXT_SESSION.md` · executor law `../GEMINI.md`

## Agents
- **OWNER** (human) — decisions: money rates, data schema, queue order, product laws.
- **GEMINI** — 100% of execution: cards, code, tests, gates, PRs, docs. Rules: root `GEMINI.md`.

Escalate to OWNER before changing: tab count, start tab, fixed button positions, data schema, any rate, the CSP, dependencies.

## Code
- Store/View split: `*.store.js` = logic, zero DOM. `*.view.js` = DOM, events, charts.
- No raw `innerHTML` — use `html` from `shared/utils.js`. CSP is strict.
- Colors and fonts only from `css/tokens.css`. No hex in JS.

## Product laws (full text in NAV_SPEC)
1. Tab = a user question. Three tabs: Смена · Учёт · Бизнес. 4th slot intentionally empty.
2. Content changes, layout never.
3. Always start on Смена.
4. Air = spacing, not paleness. Key numbers ≥7:1. One hero per screen.
5. No hidden gestures for frequent actions.
6. Progress in trips, not euros.
7. No feature without an owner in the budget.

Conflicts: readability > beauty · predictability > dev convenience · budget > usefulness.

## Work
Card = file = branch = agent = one squashed commit. Fields `STOP` and `Границы файлов` are mandatory. TTL one session. Base branch `master`, rebase before PR, delete branch after merge. **Never end a session with untracked files.**

## Gates — "done" is a hypothesis until a gate prints 0
- `npm run lint` — ESLint + security rules (0 errors, 0 warnings)
- `npm run check` — full gate (`lint` && `test`)
- `npm test` — unit math (50/50 split, VAT 13%)
- `npm run docs:budget` — system docs size limits
- `node ../.gemini/scripts/gate-dv.mjs` — DV gate: Store/View, innerHTML, hex, lazy code, foreign symbols
- `npm run build:sw` — never hand-edit `ASSETS` or `CACHE_NAME` in `sw.js`; the pre-commit hook bumps the version and regenerates it


