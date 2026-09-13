# Architecture

Technical specification of the system described in `docs/plan.md`. This document is binding for module boundaries, the data model, and the configuration policy; implementation choices not covered here follow the code rules in the root `CLAUDE.md`.

## 1. Repository layout

```
/                       shared, non-code assets
  docs/                 plan, architecture, design, facts, decision-log
  corpus/
    sources/             raw legal texts (withholding code list, governing articles)
    chunks/               article-level chunks with metadata, ready for embedding
  rules/                 rule registry definitions with verbatim citations (language-agnostic: JSON/YAML, consumed by api/app/rules)
  schemas/                DGI TEJ XSD files and the validation harness
  fixtures/
    hero/                 the demo documents (article 62 case and companions)
    generated/             background files for the demo dataset
  seed/                  scripts that generate the demo dataset

web/                    Next.js application (TypeScript, App Router)
  app/
    (msme)/              MSME owner/accountant routes
    (officer)/            officer routes
    (admin)/               admin routes
    api/                    thin route handlers that proxy to the api/ backend; no business logic here
  components/
    ui/                   shadcn/ui primitives (registry components, themed via tokens)
    msme/                 MSME-facing composite components
    officer/               officer-facing composite components
    shared/                 cross-role components
  lib/
    api-client.ts          typed client for the Python backend
    format.ts               display formatting (dates, currency, TND)
    env.ts                  the only module in web/ that reads process.env

api/                    Python backend (FastAPI, latest stable release)
  app/
    main.py               app factory, router registration
    extraction/           OCR and structured field extraction from uploaded documents
    corpus/               chunking, embedding, retrieval over the legal corpus
    rules/                 deterministic rule registry, assisted-rule escalation path
    counterparty/          RNE lookup and registration-fact verification
    export/                 TEJ XML generation and XSD validation
    db/                    SQLAlchemy models, Alembic migrations
    providers/
      openrouter.py          the only module that imports an OpenRouter client or names a model id
      embeddings.py           the only module that produces retrieval embeddings (see D-012)
    config.py               the only module in api/ that reads os.environ
  tests/
```

Rationale for the split and the two-module configuration reading: `docs/decision-log.md` D-010, D-014.

## 2. Roles

Three roles, matching the route groups in `web/app/`:

- **MSME owner / accountant** - uploads the payment file, sees extraction results and the proposed code with its citation, sees abstentions with the specific missing fact named.
- **Officer** - works the queue of pre-qualified files, sees what has already been verified automatically, validates or flags. Never edits a file's content directly (only validates, flags, or requests more information from the MSME).
- **Admin** - manages the rule registry, the corpus, and demo/pilot configuration. Not a compliance-decision role.

## 3. Pipeline

```
1. Upload (web, MSME role)
      |
      v
2. OCR + structured extraction (api/app/extraction, local)
      |  parties, tax IDs, service description, amounts, fiscal mentions
      v
3. Masking (api/app/extraction, local)
      |  strip/replace personal identifiers before any external call
      v
4. Retrieval (api/app/corpus)
      |  query the DGI code list + governing articles corpus (pgvector)
      v
5. Rule evaluation (api/app/rules, deterministic)
      |  facts (extracted + assisted-with-confidence) -> rule -> finding or abstention
      |
      |--- assisted fact needed? --> api/app/providers/openrouter.py supplies a fact
      |                              with a confidence score; the rule, not the model,
      |                              decides. Below-threshold confidence forces abstention.
      v
6. Finding (with citation) or Abstention (with named missing fact)
      |
      v
7. Counterparty check (api/app/counterparty, RNE): registration facts only, no score
      |
      v
8. Officer queue (web, officer role): pre-qualified file, validate or flag
      |
      v
9. Export (api/app/export): TEJ XML, validated against the DGI XSD before leaving the system
```

Steps 2 and 3 happen before step 4, so no full document text crosses the provider boundary in step 5's assisted-fact path (`docs/decision-log.md` D-013).

## 4. Data model

Entities (PostgreSQL, SQLAlchemy models in `api/app/db/`):

| Entity | Key fields | Notes |
|---|---|---|
| `organisation` | id, name, tax id, role assignments | An MSME or the administration side |
| `document` | id, organisation_id, uploaded_by, filename, storage_ref, status, created_at | The raw uploaded file; `filename` is the name as uploaded, `storage_ref` where the bytes live |
| `extraction` | id, document_id, field_name, value, confidence, source ("extracted"/"assisted"), extracted_at | One row per structured field pulled from the document |
| `corpus_source` | id (the manifest source id), title, edition, publisher, url, sha256, language, page_count, loaded_at | An official document the corpus is indexed from; provenance shown next to its text (D-031) |
| `corpus_chunk` | id, source_id, article_ref, paragraph_ref, heading_path, page, char_start, char_end, token_count, text, text_sha256, text_search (tsvector, GIN index), embedding (pgvector), url, verification_status ("unverified"/"verified"), verified_by, verified_on | Paragraph- or item-level legal text, embedded; unique on (source_id, article_ref, paragraph_ref, char_start) so re-indexing updates in place (D-031). Verification comes from `corpus/verified-passages.json` on every load; unverified text never leaves the API (D-029, D-032) |
| `rule` | id, code, citation_source, article_ref, verbatim_text, url, logic_ref | The rule registry entry; `logic_ref` points to the deterministic code that evaluates it |
| `finding` | id, document_id, rule_id, status ("decided"/"abstained"), decided_code, missing_fact (nullable), created_at | One evaluation outcome per rule per document |
| `citation` | id, finding_id, rule_id | Join surface so a finding's citation is always resolvable in one query |
| `counterparty_check` | id, document_id, rne_id, registered (bool), identifiers_match (bool), status_text | Registration facts only; no score field, per D-007 |
| `officer_decision` | id, document_id, officer_id, action ("validated"/"flagged"), note, decided_at | The one human-authority step before export |
| `export` | id, document_id, xml_ref, xsd_validated (bool), validated_at | Produced only after `officer_decision.action == "validated"` |
| `audit_entry` | id, entity_type, entity_id, actor, action, at | Append-only trail across the pipeline |

`finding.status = "abstained"` is a normal, expected row, not an error log entry (D-005).

## 5. API surface (api/, FastAPI)

REST, versioned under `/api/v1`:

- `GET /organisations` / `POST /organisations` - list organisations, create an MSME (409 on a duplicate tax id); there is no auth yet
- `POST /documents?organisation_id=&uploaded_by=` - multipart upload; extraction and rule evaluation run before it returns
- `GET /documents/{id}` - status, filename, organisation, extraction results, officer decision, export
- `GET /documents/{id}/findings` - findings with their rule code and resolved citation
- `POST /documents/{id}/counterparty-check` - RNE lookup (not built: the RNE is unreachable, see `docs/facts.md`)
- `GET /officer/queue` - extracted files awaiting a decision, with filename, organisation name and finding counts
- `POST /officer/decisions` - validate or flag a document (`officer_id`, `action`, `note`)
- `POST /documents/{id}/export` - build and validate the TEJ export from caller-supplied declaration fields (only after validation)
- `GET /export/operation-codes` - the withholding codes the TEJ schema accepts, read from `schemas/tej/`
- `GET /rules` - registry read; rules are written by the loader in `api/app/rules`, not over HTTP

`web/app/api/` route handlers proxy to these; they hold no business logic.

## 6. Provider boundary

Two provider modules, each the sole point of contact with an external model service:

- `api/app/providers/openrouter.py` - chat/completion calls (fact extraction assistance, drafting, explanation text). Reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL_ID` from `api/app/config.py`, no default for either.
- `api/app/providers/embeddings.py` - retrieval embeddings. Default: local embedding model, no data leaves the process. A hosted alternative stays swappable behind this same module (D-012, flagged as an assumption to confirm: verify OpenRouter's actual embeddings support before relying on it for this path).

No other file in `api/` or `web/` imports a vendor SDK or names a model id string, per the root `CLAUDE.md` rule this decision log restates in D-011.

## 7. Configuration

Two configuration modules, one per process (D-014):

- `web/lib/env.ts` - the only module in the Next.js app that reads `process.env`.
- `api/app/config.py` - the only module in the Python app that reads `os.environ`.

Both follow the same policy: identity values (URLs, tokens, API keys, provider names, model ids) get no default and fail loudly, naming the missing variable. Algorithm parameters (confidence thresholds, benefit-calculation constants) may have a documented default in a `config.py`/`lib/config.ts` sibling. A related settings group is all-or-nothing. `.env` and `.env.example` carry the identical key set in the same order, for both `web/` and `api/`.

## 8. Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial architecture document for the web/api split and the withholding-code pipeline |
| 2026-09-13 | team | Data model: `corpus_source` added, `corpus_chunk` at paragraph level with provenance (D-031) |
| 2026-09-13 | team | Data model: `corpus_chunk` verification fields from the passage register (D-032) |
| 2026-09-13 | team | Data model: `corpus_chunk.text_search` for hybrid retrieval (D-035) |
