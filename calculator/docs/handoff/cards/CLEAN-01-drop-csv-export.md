# CLEAN-01 — Delete CSV export

**Severity:** MEDIUM · **Size:** S · **Owner:** 🔵 HORSE

## Goal
One export path instead of two. The app no longer ships a feature that is both an injection vector and a layering violation, and that no longer answers any question.

## Symptom & root
`trips.store.js:196` — `exportCSV()` builds a Blob, creates an `<a>`, appends it to `document.body` and clicks it. A store touching the DOM breaks the Store/View split stated in `CLAUDE.md:13`.
Worse, it is an injection channel: a client named `=1+1` or `@SUM(...)` becomes a live formula when the file opens in Excel, and quoting does not stop it — only a leading apostrophe or a tab does. Queue item 13.

The reason to fix rather than delete has gone: JSON backup covers restore (`backup.js`), and Telegram covers reporting (SYNC-01). CSV answers nothing that is left. Deleting is cheaper than hardening and removes the vector completely.

## Scope
- `js/trips.store.js` — remove `exportCSV`.
- `js/trips.view.js`, `index.html` — remove the button and its handler.
- `test/trips.store.test.js` — remove CSV assertions if any.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. "Let me harden it instead" → **no**. The decision is deletion; if you disagree, stop and escalate.
3. Removing JSON export or import → that is the surviving path, do not touch it.
4. Layout change beyond removing one button → stop. `CLAUDE.md:19` — layout never changes.
5. Second bug found → log below, do not fix.

## Done when
1. `grep -rn "exportCSV\|text/csv" js/ index.html` returns nothing.
2. No dead button, no dead handler, no orphaned CSS class left behind.
3. JSON export and import still work end-to-end.

## Gates
- `npm test` — 0 failures
- `npm run build:sw` — asset list regenerated if any file was added or removed
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
