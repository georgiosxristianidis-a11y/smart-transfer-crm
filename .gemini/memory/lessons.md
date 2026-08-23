# .gemini/memory/lessons.md — Continuous Learning

> **Policy:** Rolling window (max 12 lessons, ≤50 lines). Format: `[Context] Error -> Verified Pattern`.
> **Rule:** Ingest before every task. Adding a lesson means merging or pruning an old one.

1. **[Timezones | AUDIT-04]** `new Date().toISOString().split('T')[0]` shifts dates to yesterday between 00:00–03:00 on Crete (UTC+3) -> always `localDateKey(d)` / `parseLocalDate(s)` from `js/shared/utils.js`.

2. **[Store/View Boundary | AUDIT-07]** `document.createElement('a')` and download logic inside `*.store.js` -> Store returns pure strings/objects; DOM, clipboard and downloads live in `*.view.js`.

3. **[Schema Integrity | AUDIT-05, DATA-01]** Bare unversioned objects written to IndexedDB -> wrap as `{ schemaVersion, timestamp, data }`, reject unknown future versions, sanitize keys against `DEFAULT_STATE`.

4. **[Service Worker | AUDIT-01]** Hand-editing `ASSETS` in `sw.js` -> generate via `scripts/build-sw.mjs`, gate with `npm run build:sw`.

5. **[XSS | AUDIT-06, AUDIT-10]** `element.innerHTML = '<div>' + val + '</div>'` -> `` html`...` `` from `js/shared/utils.js`, or `textContent`.

6. **[Master Health | Incident 17.08]** Conflict markers reaching master contaminate every later diff -> fix master on a separate `hotfix/*` branch; gated by `GIT_CONFLICT_MARKERS`.

7. **[Payload Economics | Analysis 18.08]** Dumping whole files into context instead of watching payload bytes -> surgical `offset/limit` reads, targeted grep, quiet pipelines (`--silent | tail`).

8. **[Proof-over-Trust | Analysis 18.08]** Narrative claims that "everything passes" -> DoD is the exact command, its exit code and its output, quoted in the card.

9. **[Cross-Project Contamination | Incident 23.08]** `~/.gemini/GEMINI.md` (another project's archive) declared itself highest priority and loaded everywhere — yielding tests for scripts that do not exist here and a CSP heuristic reopening `unsafe-inline`; a trace sat in `calculator.store.js:2` -> project layer always wins; portable = a principle, not portable = anything greppable. Gated by `FOREIGN_ORIGIN`.

10. **[Generated Manifests | Incident 23.08]** `build-sw.mjs` listed `./favicon.ico` while only `favicon.svg` existed — one 404 rejects the whole `cache.addAll()` and offline dies silently -> scan assets from disk and assert existence at build time; `CACHE_NAME` follows `package.json` version, not `Date.now()`.

11. **[Tool-Bound Automation | Incident 23.08]** Version auto-bump lived in a Claude-only `PostToolUse` hook, so it died the moment the executor changed -> automation belongs on the path every agent shares: `.githooks/pre-commit` via `core.hooksPath`, versioned in the repo.
