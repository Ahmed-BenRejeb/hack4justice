# Chahed

Every error a business makes costs the administration more than it costs the business.

Chahed reads the payment documents a Tunisian MSME already holds, selects the correct withholding-tax (retenue à la source) code with a citation to the exact governing article, tells the business honestly when it cannot decide instead of guessing, verifies the counterparty against the RNE, and hands a public officer a pre-qualified file plus a TEJ export validated against the DGI's published schema.

Built for Hack4Justice 2026, Challenge A.

## Why it exists

The majority of Tunisian MSMEs have no in-house accountant. They make fiscal errors out of confusion, not fraud, and each one triggers a chain of downstream work at the administration far more expensive than the original mistake. Chahed intercepts the error before it is filed, for the one case that requires real judgement rather than a form fill: choosing the correct withholding code.

Full narrative and scope boundary: `docs/plan.md`.

## Documentation

- `docs/plan.md` - what and why, scope, roles, pipeline, phases and gates, the Q&A prep
- `docs/architecture.md` - repository layout, pipeline, data model, API surface, provider and configuration boundaries
- `docs/design.md` - visual system, motion rules, screen specs
- `docs/facts.md` - every fact stated on stage, with verification status
- `docs/decision-log.md` - every significant decision, dated

Read the `CLAUDE.md` inside a directory before working there; local rules live locally.

## Repository map

```
docs/         plan, architecture, design, facts, decision log
corpus/       raw legal texts and article-level chunks
rules/        rule registry definitions with verbatim citations
schemas/      DGI TEJ XSD files and the validation harness
fixtures/     demo documents (hero/) and background files (generated/)
seed/         scripts that generate the demo dataset
web/          Next.js application (TypeScript, App Router, shadcn/ui)
api/          Python backend (FastAPI): extraction, corpus retrieval, rules, counterparty, export
```

## Getting started

The whole stack runs with Docker Compose: PostgreSQL with pgvector, the FastAPI backend (`api/`) and the Next.js front end (`web/`).

1. `cp api/.env.example api/.env` and fill `OPENROUTER_API_KEY` and `OPENROUTER_MODEL_ID`. `DATABASE_URL` is set by `docker-compose.yml`.
2. `cp web/.env.example web/.env`. `API_BASE_URL` is set by `docker-compose.yml`. Set `PUBLIC_WEB_URL` to the address a phone reaches this app at, for the capture QR code.
3. `docker compose up --build`, then open <http://localhost:3000>.
4. Businesses sign up at `/inscription`. Officer, admin and accountant accounts are created from the command line, the password prompted for: `docker compose exec api uv run python -m app.auth.create_user agent@example.tn officer` (an accountant also takes `--organisation <matricule fiscal>`, once per organisation).

To work on one side without Docker, follow the local setup in `api/CLAUDE.md` or `web/CLAUDE.md`.

## Design law

Compliance judgement is deterministic code. The model extracts facts, explains, and drafts. It never decides whether a finding exists. No finding without a citation: source, article number, verbatim text, and URL. See `docs/plan.md` section 4 and the root `CLAUDE.md`.
