# INFRA-02 — `npm run lint` is red on the import parser

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟠 LEAD

## Goal
The lint gate prints 0 again, and the WhatsApp parser stops building a regular expression out of parsed text.

## Symptom & root
`npm run lint` — 8 errors, 2 warnings, all in `js/shared/import.service.js`, all shipped by `65484d7`. The gate was green before that commit, so it has been red since; a gate nobody can pass is a gate nobody reads.

- 8 × `no-useless-escape` — `\-`, `\.`, `\(`, `\)` inside character classes at `156`, `253`, `283`, `291`, `426`. Harmless today, noise forever.
- `278` `security/detect-non-literal-regexp` — `new RegExp(...${flightCode})` built from parsed text. `extractFlightCode` only ever returns `[A-Z0-9]`, so nothing can be injected today; the guarantee lives in a different file and nothing enforces it.
- `301` `security/detect-unsafe-regex` — the price pattern trips the star-height check. The parser chews text pasted from WhatsApp, so backtracking is the user's problem, not a theoretical one.

## Scope
- `js/shared/import.service.js`
- `test/import.service.test.js`

Everything else is off-limits.

## STOP
1. A file outside Scope → escalate.
2. Parser behaviour changes (a line that parsed before must parse the same) → stop.
3. Disabling a rule instead of fixing the code → stop. `eslint-disable` is not a fix.
4. Rewriting the parser → out; this card removes lint debt, nothing more.

## Done when
1. `npm run lint` prints 0 errors and 0 warnings.
2. No `new RegExp` built from parsed text remains in the file.
3. The price pattern parses the same inputs as before, proven by a test.
4. Existing import tests pass untouched; new cases cover the rewritten spots.

## Gates
- `npm run lint` — 0
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0
