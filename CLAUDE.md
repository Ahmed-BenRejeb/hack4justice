# CLAUDE.md - Chahed (root guide)

Chahed is a regulatory compliance platform for Tunisian MSMEs, built for Hack4Justice 2026 Challenge A. It reads the documents a business already holds, checks them against Tunisian fiscal and registry law with every conclusion tied to a cited article, verifies counterparties against the RNE, and hands a public officer a pre-qualified file plus a TEJ export that validates against the DGI's published schema.

The hackathon outcome is decided by a 3-minute pitch and a live demo. Everything in this repo serves one of the demo moments listed in docs/plan.md section 6 or a feature listed in docs/plan.md section 12, or it does not get built (D-030).

Source of truth for what we build:

- docs/plan.md (what and why, scope, roles, phases, gates)
- docs/feature-research.md (detail, evidence and design-law notes for every planned feature, including the RAG plan)
- docs/architecture.md (repository layout, pipeline, data model, API surface, provider and configuration boundaries)
- docs/design.md (visual system, motion, screen specs)
- docs/facts.md (every fact we are allowed to state on stage, with verification status)
- docs/decision-log.md (every significant decision, dated)

Read the CLAUDE.md inside a directory before working there. Local rules live locally.

## Repository map

The application is a two-process monorepo: a TypeScript front end and a Python backend, communicating over REST. Shared, non-code assets live at the repository root. Full detail: docs/architecture.md.

| Path | What it is |
|---|---|
| `web/app/` | Next.js routes: `(msme)`, `(officer)`, `(admin)` route groups, plus `api/` handlers that proxy to the backend |
| `web/components/` | React components: `ui/` shadcn/ui primitives, `msme/`, `officer/`, `shared/` |
| `web/lib/` | Front-end support: API client, formatting, and `env.ts` |
| `api/app/extraction/` | OCR and structured document extraction |
| `api/app/corpus/` | Chunking, embedding, and retrieval over the legal corpus |
| `api/app/rules/` | The deterministic rule registry and the assisted-rule escalation path |
| `api/app/counterparty/` | RNE lookup and registration-fact verification |
| `api/app/export/` | TEJ XML generation and XSD validation |
| `api/app/db/` | SQLAlchemy models and migrations |
| `api/app/providers/` | The only modules that talk to an external model service |
| `rules/` | The rule registry source: rule definitions with their verbatim legal citations, consumed by `api/app/rules` |
| `corpus/` | `sources/` the raw legal texts, `chunks/` the article-level chunks with metadata |
| `schemas/` | The DGI TEJ XSD files and the validation harness |
| `seed/` | Scripts that generate the demo dataset |
| `fixtures/` | `hero/` the five demo documents, `generated/` the background files |
| `docs/` | plan, architecture, design, facts register, decision log |
| `tests/` | Unit and integration tests, per process |

## Workflow rules

- Before starting any non-trivial task, ask clarifying questions first and propose 2-3 concrete options with tradeoffs so the user can choose. Never assume scope, never silently expand it.
- Be concise. Read only the files the task needs, do not restate what the user already knows, keep docs short.
- Before using any CLI tool, verify it is installed (`command -v`). This is a Linux machine. If a tool is missing, say so and propose the install command; do not assume and do not auto-install.
- Record every significant decision in docs/decision-log.md: date, decision, options considered, why, result. If in doubt whether it is significant, log it.
- Several people work on this repo. Never put personal or machine-specific values (absolute paths, tokens, usernames, editor config) in tracked files. Personal settings belong in `.env` and `.claude/settings.local.json`, both git-ignored.
- Phases have gates (docs/plan.md section 8). Do not start a phase until the previous gate is met. When a gate is at risk, cut from the cut list, do not slip the gate.

## Code rules

- Clean and modular: single-responsibility modules, small functions, explicit names, types on every exported function, a docstring on every module and exported function.
- Comments explain intent and the why wherever the code is not self-evident. No comments that restate the line below them.
- Never commit empty functions, placeholder returns, TODO stubs, or dead code. Code lands only when it is implemented and tested.
- **Design law: compliance judgement is deterministic code. The model extracts facts, explains, and drafts text. It never decides whether a finding exists.** Assisted rules are the one nuance: the model supplies a fact the document does not state, with a confidence, and the deterministic rule judges from that fact. When the model cannot establish the fact, the rule escalates a specific question to a human. It never guesses. See docs/plan.md section 4 and rules/CLAUDE.md.
- **No finding without a citation.** Every rule carries the source, article number, verbatim text, and URL of the text that grounds it. A rule without a verified citation does not enter the registry.
- **No fact on a slide or on screen that is not in docs/facts.md with status `verified`.** Article numbers are checked by a person against the official source, never recalled from memory and never taken from a model. This covers retrieved legal passages: an unverified passage is never displayed, not even with a label, and a model-drafted explanation appears only after a person approves it (D-029).
- Configuration enters each process through exactly one module: `web/lib/env.ts` for the Next.js app, `api/app/config.py` for the Python service. Neither process reads the environment anywhere else.
  - Anything that identifies a system, an account, or a vendor gets no default and no fallback: URLs, tokens, API keys, provider names, model ids. Missing means missing, and it fails loudly, naming the variable.
  - Algorithm parameters (confidence thresholds, benefit calculation constants) are not identity. They may keep a documented default in a sibling `config.ts`/`config.py`.
  - A group of related settings is all-or-nothing. A half-configured feature fails loudly, it never downgrades in silence.
  - Secrets never appear in a log line, an error message, or a CLI flag.
  - `.env` and `.env.example` carry the identical key set in the same order, for both `web/` and `api/`.
- Verify every SDK symbol against the installed package before using it. Never trust a doc snippet over the installed signature.
- The model provider is swappable. All calls route through OpenRouter. Never import a vendor or OpenRouter client outside `api/app/providers/`, and never name a model id anywhere else.

## Design rules

- docs/design.md is binding, not advisory. Tokens are defined once and consumed everywhere. No raw hex values outside the token file.
- Colour carries status and nothing else. The three status colours never appear as decoration.
- Motion explains what changed. One orchestrated moment (a file arriving in the officer queue); everything else answers a user action. The forbidden list in docs/design.md is enforced in review.
- Reduced motion is respected everywhere. Keyboard focus is always visible.

## Formatting rules (strict, apply everywhere)

- No em dashes anywhere: not in code, docs, comments, commit messages, or replies. Use a hyphen, comma, colon, or parentheses instead.
- No emojis anywhere, ever. Use text markers like `[verified]` or `[confirm]`.
- Interface copy is French. Code, identifiers, comments, docs, and commit messages are English.

## Git rules

- Commit messages follow Conventional Commits: `type(scope): summary`
  - Types: feat, fix, docs, test, chore, refactor, design
  - Scope: the directory or module touched (web, api, docs, rules, corpus, export, seed). Omit scope only for repo-wide changes.
  - Summary: imperative, lowercase, no trailing period, at most 60 characters.
- One logical change per commit. Commit regularly; never mix scaffolding, features, and docs in a single commit.
- Keep the repo clean at all times: no build artifacts, caches, `.env`, or personal files in git. Check `git status` before and after every commit.
- Branch names: `type/short-topic`, for example `feat/withholding-rule`.
- Never add AI attribution to commits: no "Co-Authored-By" trailer, no "Generated with" lines, in commit messages or PR bodies.
- Do not push or open PRs unless the user asks.

## CLAUDE.md maintenance

- Every CLAUDE.md in this repo ends with a Change Log table. Whenever you edit one, append a row: date, author, what changed. If unsure of the date, run `date +%F`.
- Keep every CLAUDE.md short. A rule that applies repo-wide belongs here and only here; subdirectory files hold only local rules.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial root guide |
| 2026-09-12 | team | Restored project guide (working copy had reverted to a generic template); updated repository map and configuration rule for the web/+api split, section refs updated for the regenerated docs |
| 2026-09-13 | team | Build rule includes plan features (D-030); feature-research added to sources of truth; facts rule covers retrieved passages and explanations (D-029) |
