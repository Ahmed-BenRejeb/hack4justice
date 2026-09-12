# CLAUDE.md - api/ (Python backend)

Local rules for `api/`. Read the root `CLAUDE.md` first; this file only adds what is specific to this directory.

## Stack

FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL with pgvector. Dependencies and the virtualenv are managed by `uv` (`pyproject.toml` / `uv.lock`). Python is pinned to 3.12 (`.python-version`), not the latest 3.14 release named in `docs/decision-log.md` D-010: on the day this was scaffolded, several core dependencies (psycopg, pgvector, SQLAlchemy) either had no 3.14 wheels yet or were unverified against it, and a hackathon build cannot spend time on ecosystem breakage. Revisit once those wheels catch up.

## Local setup

1. `docker compose up -d db` (repo root) starts PostgreSQL with pgvector.
2. `cp api/.env.example api/.env`, fill `DATABASE_URL` (matches the compose service: `postgresql+psycopg://chahed:chahed_dev_only@localhost:5432/chahed`).
3. `uv run alembic upgrade head` applies migrations.
4. `uv run uvicorn app.main:app --reload` runs the dev server.
5. `uv run pytest` runs the test suite. Tests need the database from step 1 running; each test recreates the schema (`tests/conftest.py`).
6. `uv run ruff check .` / `uv run ruff format .` lint and format.

## Conventions

- `app/config.py` is the only module that reads `os.environ` (root rule). It also loads `api/.env` via `python-dotenv`, so no other module needs to.
- `migrations/versions/` and `migrations/env.py`'s Alembic-generated boilerplate are excluded from ruff (see `pyproject.toml`); do not hand-format them to match the rest of the codebase.
- `app/db/models.py` mirrors `docs/architecture.md` section 4 table for table. A change to one without the other is a bug.
- New feature packages (`extraction/`, `corpus/`, `rules/`, `counterparty/`, `export/`) land only when there is real, tested logic to put in them, per the root rule against placeholder modules.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial api/ scaffold: config, db models and migration, FastAPI app, POST /documents |
