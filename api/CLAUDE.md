# CLAUDE.md - api/ (Python backend)

Local rules for `api/`. Read the root `CLAUDE.md` first; this file only adds what is specific to this directory.

## Stack

FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL with pgvector. Dependencies and the virtualenv are managed by `uv` (`pyproject.toml` / `uv.lock`). Python is pinned to 3.12 (`.python-version`), not the latest 3.14 release named in `docs/decision-log.md` D-010: on the day this was scaffolded, several core dependencies (psycopg, pgvector, SQLAlchemy) either had no 3.14 wheels yet or were unverified against it, and a hackathon build cannot spend time on ecosystem breakage. Revisit once those wheels catch up.

## Local setup

0. System OCR dependencies (not managed by `uv`, since they are not Python packages): `tesseract` with the `fra` and `ara` language packs, and `poppler-utils` (`pdftoppm`/`pdfinfo`, used by `pdf2image`). On Arch: `sudo pacman -S tesseract tesseract-data-fra tesseract-data-ara poppler`. Verify with `tesseract --list-langs`; `fra` and `ara` must both be listed.
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
- `app/rules/registry.py` loads rule definitions (JSON files, one per rule) from the root `rules/` directory into the `rule` table, rejecting any with an incomplete citation. There is no `POST /rules` HTTP endpoint: rule management is a seed/migration-time operation until admin auth exists, per the cut list in `docs/plan.md` section 9. Rule definition files themselves are not authored by a model: a citation only goes in `rules/` once a person has verified it against the official text and promoted it to `verified` in `docs/facts.md`.
- `app/extraction/ocr.py` extracts text: born-digital PDFs are read via their text layer (`pypdf`), scanned PDFs and images fall back to OCR (`pdf2image` + `pytesseract`, languages `fra+ara+eng`). `app/extraction/service.py` wires this into upload: it writes one `extraction` row (`field_name="full_text"`) and sets `document.status` to `"extracted"` or `"extraction_failed"`. Field-level extraction (parties, tax ids, amounts) is not built yet: it needs real hero documents to validate against (`fixtures/hero/` is still empty), per Phase 2's own gate in `docs/plan.md` section 8.

## Docker

`docker compose build api` builds the image (`api/Dockerfile`, plain `pip install uv` on `python-slim`; the `ghcr.io/astral-sh/uv` base image is unreachable from this network, denied on pull). The image also installs `tesseract-ocr`, `tesseract-ocr-fra`, `tesseract-ocr-ara` and `poppler-utils` via apt, matching the local setup requirement above. `docker compose up` runs `db` and `api` together: the `api` container runs `alembic upgrade head` before starting uvicorn, so a fresh volume self-migrates. `api`'s `DATABASE_URL` inside compose points at the `db` service hostname, not `localhost`.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial api/ scaffold: config, db models and migration, FastAPI app, POST /documents |
| 2026-09-12 | team | Added rule registry loader, GET /rules, Dockerfile and compose api service |
| 2026-09-12 | team | Added OCR/text extraction, wired into upload; added tesseract system deps to Dockerfile |
