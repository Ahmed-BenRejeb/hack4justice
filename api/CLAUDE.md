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
- `app/providers/embeddings.py` is the sole embeddings provider (D-012, now resolved rather than assumed): local `sentence-transformers`, model `paraphrase-multilingual-MiniLM-L12-v2`, 384 dimensions, matching `EMBEDDING_DIMENSIONS_DEFAULT`. `torch` is CPU-only, pinned via `[tool.uv.sources]` in `pyproject.toml` to `https://download.pytorch.org/whl/cpu` (the default PyPI `torch` wheel pulls ~2GB of CUDA/nvidia packages even with no GPU; do not remove that source override). OpenRouter's own `/api/v1/embeddings` endpoint was verified live and does work, but the default stays local per the team's choice, recorded in `docs/decision-log.md` D-018.
- `app/corpus/chunking.py` splits a legal source text into one chunk per `Article N` heading, generic and content-agnostic. `app/corpus/service.py` embeds and stores those chunks. `app/corpus/retrieval.py` does a pgvector cosine-similarity search over stored chunks (`Column.cosine_distance`, no vector index yet: not needed until the corpus is larger than a demo dataset). All three are tested against synthetic fixture text; `corpus/sources/` itself is still empty, so nothing real is indexed yet.
- `app/rules/engine.py` is the deterministic dispatcher: given a `Rule` and a facts dict, it imports `rule.logic_ref`, calls it, and expects back a `Decision(code=...)` or an `Abstention(missing_fact=...)` (anything else raises `TypeError`). It records the `Finding` and its `Citation`. No real rule logic module exists yet, only the test fixture at `tests/fixtures/rule_logic.py`; a real one lands under `app/rules/` once a rule has a `verified` citation.
- `app/api/v1/officer.py` implements the queue and decisions. The queue's current definition (`document.status == "extracted"` with no `officer_decision` yet) is a placeholder for "pre-qualified": there are no findings to qualify against yet (rule content is still empty), so this is closer to "has been through extraction" than the real qualification the pipeline will produce once rules exist. Revisit once `app/rules/engine.py` is wired into upload.
- `app/export/xsd.py` validates an XML document against an XSD schema, and knows nothing about the TEJ format itself: `schemas/` has no real DGI schema yet, only the test fixture schema in `tests/test_xsd.py`. TEJ XML *generation* is not built: guessing the DGI's actual element/namespace structure without the real schema would be fabricating an external contract, which the root CLAUDE.md rules against.

## Docker

`docker compose build api` builds the image (`api/Dockerfile`, plain `pip install uv` on `python-slim`; the `ghcr.io/astral-sh/uv` base image is unreachable from this network, denied on pull). The image also installs `tesseract-ocr`, `tesseract-ocr-fra`, `tesseract-ocr-ara` and `poppler-utils` via apt, matching the local setup requirement above, and pre-downloads the local embedding model during build (`RUN uv run python -c "from app.providers.embeddings import _model; _model()"`) so the container never needs Hugging Face access at runtime, only at build time. `docker compose up` runs `db` and `api` together: the `api` container runs `alembic upgrade head` before starting uvicorn, so a fresh volume self-migrates. `api`'s `DATABASE_URL` inside compose points at the `db` service hostname, not `localhost`.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial api/ scaffold: config, db models and migration, FastAPI app, POST /documents |
| 2026-09-12 | team | Added rule registry loader, GET /rules, Dockerfile and compose api service |
| 2026-09-12 | team | Added OCR/text extraction, wired into upload; added tesseract system deps to Dockerfile |
| 2026-09-12 | team | Added local embeddings, corpus chunking/indexing/retrieval; pinned torch to CPU wheels |
| 2026-09-12 | team | Added rule evaluation engine, officer queue/decisions, generic XSD validation harness |
