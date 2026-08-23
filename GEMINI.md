# GEMINI.md — Smart Transfer (project layer)

**This file outranks `~/.gemini/GEMINI.md`.** The global archive is portable
*experience*; this file is the *law of this repository*. On any conflict — down to
a single hex value, a CSP directive or a file name — the project layer wins and the
global line is discarded without discussion.

Read next, in order: `calculator/CLAUDE.md` (map) · `calculator/docs/handoff/PROTOCOL.md`
(process) · `calculator/docs/handoff/QUEUE.md` (what to do) · `calculator/NEXT_SESSION.md`
(state) · `.gemini/rules/gemini-horse-protocol.md` (execution discipline) ·
`.gemini/memory/lessons.md` (scars).

---

## 1. Where you are

`C:\PROJECTS\TAXI` — Smart Transfer, an offline-first PWA for a two-owner minivan
transfer business on Crete. Vanilla ESM, no framework, no build step, IndexedDB,
strict CSP. **Not** athlete-pro, not FIT-ELITE, not Work-Tracker. Before writing a
single line, confirm the path you are editing starts with `C:\PROJECTS\TAXI`.

## 2. Roles — one executor

| Role | Who | Owns |
|---|---|---|
| OWNER | the human | Decisions: money rates, data schema, queue order, product laws |
| GEMINI | you | 100% of execution: cards, code, tests, gates, PRs, docs |

There is no second model in the loop. The safety net that used to be a Sonnet audit
is now machine-side: gates, pinned-number tests, and the Import Firewall below.
Escalate to OWNER — do not decide — when a card would change: tab count, start tab,
fixed button positions, data schema, a tax or commission rate, or the CSP.

## 3. Import Firewall

Experience travels between projects. Code does not.

**Portable:** a principle, a heuristic, a lesson about why something hurt.
**Not portable:** anything you could paste into `grep` — file names, function names,
module names, npm packages, script names, hex values, agent names, API calls.

The test is one question: *can this be grepped?* If yes, it belongs to the project it
came from, and importing it here is a hallucination with a plausible accent.

Enforced by `FOREIGN_ORIGIN` in `.gemini/scripts/gate-dv.mjs`, which fails the commit on
`athlete`, `athlete pro`, `workout`, `phase-verify`, `Integrity.check`,
`codebase_investigator` — symbols that exist nowhere in this repository. Design
vocabulary is deliberately **not** in that list: glassmorphism, view transitions and
spring easing are native words here, and a gate that cries at native words is a gate
someone will switch off. Those conflicts are settled by the table below, not by grep.
When a new foreign symbol slips through, add it in the same commit that removes it.

Specific global lines that are **void here**:

| Global archive says | This project says |
|---|---|
| CSP may allow `script-src-attr: 'unsafe-inline'` | Strict CSP, no inline anything (AUDIT-06, merged) |
| Motion as a default good (spring physics everywhere) | Windshield mode: the driving screen does not animate (DRIVE-01). Elsewhere motion is allowed and already used |
| Explicit SVG hex, avoid `currentColor` | Colors only from `css/tokens.css`, zero hex in JS |
| `Integrity.check()`, `Workout`, `phase-verify.js` | Do not exist. Calling them is fabrication |

## 4. Non-negotiables

- Store/View split: `*.store.js` pure logic and zero DOM; `*.view.js` owns DOM, events, charts.
- No raw `innerHTML`. Use `` html`...` `` or `textContent` from `js/shared/utils.js`.
- Dates only via `localDateKey()` / `parseLocalDate()`. Crete is UTC+3; `toISOString()` lies.
- No new npm dependencies. Ever. Solve it with native ESM or an existing module.
- No placeholders: `// ... existing code`, `// TODO: implement` and friends fail the gate.
- Never hand-edit `ASSETS` or `CACHE_NAME` in `sw.js` — run `npm run build:sw`.
- Card = file = branch = agent = one squashed commit. No `STOP` and no `Scope` → do not start.
- Never end a session with uncommitted work. Uncommitted means non-existent.

## 5. Money is different

`CALC-*` cards touch rates that no gate can smell: a wrong VAT line inflates profit
silently and passes every test. Therefore, for any card that changes a rate, a share
or a tax: **the test with the literal number is written and committed before the
implementation**, and the number comes from OWNER in the card, not from your memory
of how VAT works elsewhere.

## 6. Gates — "done" is a hypothesis until a gate prints 0

Run from `calculator/`:

```bash
node ../.gemini/scripts/gate-dv.mjs && npm run lint && npm test && npm run docs:budget && npm run build:sw
```

Report the exact command, the exit code and the output. A narrative claim that
"everything passes" is not evidence and is rejected on sight.

## 7. Session ritual

START — `git status`, confirm the repo path, read `NEXT_SESSION.md` and
`.gemini/memory/lessons.md`, branch off fresh `master`, grep the symbols the card
names and verify they physically exist.
FINISH — gates print 0, commit to the card branch, rebase, PR, then update
`QUEUE.md` and `NEXT_SESSION.md`.
