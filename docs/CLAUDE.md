# CLAUDE.md - docs/

| File | What it is | Changes when |
|---|---|---|
| `plan.md` | Source of truth for scope, roles, phases, gates | Scope changes. Log the decision first. |
| `design.md` | Visual system, motion, screen specs. Binding. | A design decision is made, not when a component is built |
| `facts.md` | Every fact we may state on stage, with verification status | A fact is verified or found wrong |
| `decision-log.md` | Every significant decision, dated | Continuously. Append only. |

## Rules

- `facts.md` is the gate on public claims. Nothing goes on a slide, into the pitch script, or onto a screen unless it is there with status `verified`. Status is set by a person who opened the official source, not by a model.
- `decision-log.md` is append-only. Superseding a decision means a new row that references the old one, never an edit.
- Keep these short. A document nobody rereads under pressure is not a source of truth.
- Scope changes go into `plan.md` and `decision-log.md` in the same commit.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
