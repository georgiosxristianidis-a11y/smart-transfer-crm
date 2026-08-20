# SYNC-01 — Telegram: one request, report and file together

**Severity:** HIGH · **Size:** M · **Owner:** 🟠 LEAD-OPUS

## Goal
Closing a shift puts the backup file and the summary into a private Telegram chat in one request. The phone stops being the only copy.

## Symptom & root
Not a defect — a missing off-device copy. One work Android is a single point of failure, and the export button (`backup.service.js:28`) asks the driver to decide, at 23:45, to protect data. He will not.

Threat model, decided: only the two owners touch the phone. Therefore **no encryption, no per-device bots, no outbox, no backoff** — one send per shift is nowhere near the 20/min limit. A stolen token cannot read chat history: the Bot API has no such method.

## Scope
- `js/shared/telegram.service.js` — **new**. `sendShiftBackup(file, caption)`.
- `js/shifts.store.js` — set `backupSentAt`.
- `js/shifts.view.js`, `index.html` — token/chat-id settings, unsent marker, resend button.
- `test/telegram.service.test.js` — **new**, transport injected, no network.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. `parse_mode` → **never set it**. A client named `[тут](http://evil)` becomes a live link in the chat. Plain text only.
3. Per-trip sending, an outbox, retry loops → **out of scope by decision**.
4. The token living anywhere but the owner's settings field → stop.
5. Second bug found → log below, do not fix.

## Done when
1. One `sendDocument` carries the JSON file and the summary in `caption` — report and data can never be separated.
2. Failure shows on the shift as "not sent" with manual resend; one automatic retry, then stop.
3. `backupSentAt` is written only on a confirmed HTTP 200.
4. Filename `st_YYYYMMDD_<trips>.json`; the last backup message is pinned, replacing the previous.
5. No token reaches a log or an error message shown to the user.

## Gates
- `npm test` · `npm run build:sw` · `npm run docs:budget` — all 0

## Found along the way
_(empty)_
