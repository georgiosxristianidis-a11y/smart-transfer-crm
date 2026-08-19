# AUDIT-06 — CSP cleanup: no unsafe-inline or unsafe-eval in scripts

**Severity:** HIGH · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Harden Content-Security-Policy by removing `unsafe-inline` and `unsafe-eval` from script execution, removing inline scripts/event handlers from `index.html`, and introducing strict automated CSP verification.

## Symptom & root
`default-src` had `'unsafe-inline' 'unsafe-eval'` and `script-src-attr 'unsafe-inline'` without a dedicated `script-src`, making the CSP purely decorative (`docs/handoff/audit/06-csp-is-decorative.md`). `index.html` contained an inline `onclick` handler and an inline `<script>` for Service Worker registration.

## Scope
- `index.html`
- `js/app.js`
- `sw.js`
- `test/csp.test.js`
- `CLAUDE.md`
- `docs/handoff/QUEUE.md`
- `docs/handoff/cards/AUDIT-06-csp-cleanup.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Dynamic inline styles in views (`trips.view.js`) break → `style-src` retains `'unsafe-inline'`.
3. `npm test` red for a reason unrelated to this card → stop, open a separate card.
4. A second bug found → do not fix it. Log it below, finish this card.
5. The task outgrew one card → stop, return to 🟠 LEAD for splitting.

## Done when
- `index.html` meta CSP enforces `default-src 'self'`, `script-src 'self' https://cdn.jsdelivr.net`, `object-src 'none'`, `base-uri 'self'`, `connect-src 'self'`.
- No inline scripts or inline event handlers in `index.html`.
- `npm test` passes all tests including `csp.test.js`.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
<empty>
