# PROTOCOL.md — Multi-agent protocol

> Approved 2026-08-14. How agents work, not what we build.
> Product: `docs/NAV_SPEC.md` · Roles: `CLAUDE.md` · Plain-language contract (RU): `docs/RULES.md`

---

## 0. Mode

**Sequential by default, parallel only when proven safe.**

A worktree isolates an agent's context; it does not imply parallel work. Only 🟠 LEAD authorises parallel work, and only when file zones provably do not overlap. Typical safe pair: 🟢 GEMINI in `css/` ‖ 🔵 HORSE in `js/`.

> **One-file rule.** Two agents never open the same file at the same time. Not "try not to" — **never**. A card that needs both `js/` and `css/` is not parallelised; it is split into two sequential cards.

---

## 1. Card format — nine fields

One card = one file = one branch = one agent = one squashed commit.
Path: `docs/handoff/cards/<ID>-<slug>.md` · Template: `cards/_TEMPLATE.md` · Cap 2000 chars.
`docs/handoff/audit/` is a different genre: imported findings, read-only history, cap 2500. A finding becomes a work card when the queue reaches it — it is not edited in place.

| Field | Req. | Content |
|---|:---:|---|
| **Goal** | ✅ | One sentence: what changes for the user |
| **Severity** | | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` |
| **Size** | | `S` <30 min · `M` ~2 h · `L` ~day · `XL` rewrite |
| **Owner** | ✅ | 🟠 LEAD-OPUS / 🔵 HORSE (Sonnet 5) / 🟢 GEMINI 3.7 |
| **Symptom & root** | | What the user sees, and why it happens (`file:line`) |
| **Scope** | ✅ | Files that may be touched. **Everything else is off-limits** |
| **STOP** | ✅ | Conditions for immediate halt and escalation |
| **Done when** | ✅ | A checkable criterion, not "finished" |
| **Gates** | ✅ | Commands that must print `0` before the PR |

**No `STOP` and no `Scope` → the card is not started.** Their absence produces an agent that "fixed something nearby on the way" and left a branch to rot. **`Size: XL` is not a card** — back to 🟠 LEAD to split.

---

## 2. Card lifecycle

🟠 LEAD writes the card → branch off fresh master → agent works → gates print `0` → rebase → PR → squash merge → branch deleted → 🟠 LEAD updates `QUEUE.md` and `NEXT_SESSION.md`.

The card is written **before** the work starts. It is a contract, not a report.

**Brief pasted into the agent prompt** — the first three fields, copied verbatim, never paraphrased. An agent does not remember rules between sessions, so the ritual lives in the brief, not in hope:

```text
GOAL:   <one sentence: what must work afterwards>
SCOPE:  <files that may be touched>
STOP:   <what is nearby and tempting but outside this card>
START:  branch off fresh master, then grep key symbols — is the code actually there?
FINISH: gates print 0 → rebase → PR
```

---

## 3. Git

| Rule | Why |
|---|---|
| Base branch is **`master`**, not `main` | Otherwise agents miss |
| Branch named after the card: `nav-04-daily-norm` | Branch ↔ card ↔ commit link needs no docs |
| **One card — one branch — one PR — one commit** | Reverting a card = reverting one commit |
| Rebase onto `master` is **mandatory** before the PR | A stale branch cannot be merged, so it cannot rot |
| Merge by **squash**, history stays linear | Agent noise never reaches `master` |
| Commit: `type(scope): <ID> description` | `git log` reads as the list of finished cards |
| Branch deleted **immediately** after merge | A dead branch is a future rotten branch |
| **TTL: one session.** Not merged → back to 🟠 LEAD | A branch rots from scope, not from time |

---

## 4. Remote and PR

The repository is **private**: the docs carry business economics (owner shares, driver wage, taxes).

**A PR is an automated gate, not a review.** There is no second human. It exists because a machine checks what agents forget: offline broke not from bad code but because a manual step written in `CLAUDE.md` was skipped.

Anti-bureaucracy rule: gates green → merge, no comments for their own sake.

---

## 5. Not losing work

> **An agent never ends a session with untracked files.** Finishing means committing to your own branch, even mid-task (`wip: ...`). **Uncommitted means non-existent.**

This makes the TTL rule safe: a branch is deletable because everything valuable is in commits.

### Before deleting a branch or worktree

Three read-only checks. Delete **only if all three are empty**:

```bash
git log --oneline master..claude/BRANCH              # unique commits
git -C .claude/worktrees/NAME status --porcelain     # uncommitted and untracked
git -C .claude/worktrees/NAME stash list             # stashes
```

`untracked` is the dangerous one: such files exist in no branch and cannot be recovered. `git worktree remove` refuses a dirty worktree without `--force`; two commands are fatal — `git worktree remove --force` and `git clean -fd`.

*Precedent 2026-08-14: two rotten worktrees held untracked work — 13 audit cards and a 35-finding document. Rescued, then merged. This rule exists because of that.*

---

## 6. Memory sync

| File | Writer | Content |
|---|---|---|
| `cards/<ID>.md` | The card's agent | Task content. **Nobody else opens it** |
| `QUEUE.md` | 🟠 LEAD | Queue: merged / in progress / next |
| `NEXT_SESSION.md` | 🟠 LEAD on merge | State index, not a dumping ground |
| `docs/NAV_SPEC.md` | 🟠 LEAD | Product decisions by the owner |

No conflicts by construction: every file has exactly one writer.

---

## 7. Docs budget

A rule without a number and without a check does not work — proven by `npm run build:sw`, which everyone read and nobody ran. Limits live in `scripts/check-docs-budget.mjs`; the gate `npm run docs:budget` prints `0` when within budget. When a doc overflows, cut the doc — never raise the limit to fit it.

**Language:** everything machine-facing is English — code, comments, commits, `CLAUDE.md`, cards, briefs. Russian survives in one file: `docs/RULES.md`, the owner's glossary and working agreement. Chat stays Russian.

Conflicts: see `CLAUDE.md`. If 🔵 or 🟢 is unsure, they escalate to 🟠 LEAD.
