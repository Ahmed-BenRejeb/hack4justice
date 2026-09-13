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
    (auth)/               sign-in and sign-up screens
    (msme)/              MSME owner/accountant routes
    (officer)/            officer routes
    (admin)/               admin routes
    api/                    thin route handlers that proxy to the api/ backend; no business logic here
  components/
    ui/                   shadcn/ui primitives (registry components, themed via tokens)
    auth/                 sign-in and sign-up forms
    msme/                 MSME-facing composite components
    officer/               officer-facing composite components
    shared/                 cross-role components
  lib/
    api-client.ts          typed client for the Python backend
    session.ts              the signed-in user on the server, role redirects
    auth-actions.ts         sign-in, sign-up and sign-out server actions
    format.ts               display formatting (dates, currency, TND)
    env.ts                  the only module in web/ that reads process.env

api/                    Python backend (FastAPI, latest stable release)
  app/
    main.py               app factory, router registration
    auth/                  passwords, sessions, role and organisation gates, account CLI
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

Four account roles (`app_user.role`) in three spaces, matching the route groups in `web/app/` (D-054):

- **MSME owner (`msme`) / accountant (`accountant`)** - uploads the payment file, sees extraction results and the proposed code with its citation, sees abstentions with the specific missing fact named. An MSME user files for exactly one organisation and signs up themselves; an accountant files for several, each granted by the `create_user` CLI.
- **Officer (`officer`)** - works the queue of pre-qualified files, sees what has already been verified automatically, validates or flags. Never edits a file's content directly (only validates, flags, or requests more information from the MSME).
- **Admin (`admin`)** - manages the rule registry, the corpus, and demo/pilot configuration. Not a compliance-decision role.

Every role reads the verified legal texts. The backend enforces the split on every route (401 without a session, 403 for a role outside the route, 404 for a document outside the user's organisations); the web layouts only send each role to its own space.

## 3. Pipeline

```
1. Upload (web, MSME role)
      |
      v
2. OCR (api/app/extraction, local)
      |  the document's full text
      v
3. Masking, then structured extraction (api/app/extraction: local masking, one assisted call)
      |  identifiers replaced by placeholders before any external call; the model reads
      |  parties, tax IDs, addresses, dates, amounts (HT/TVA/TTC/retenue/net), withholding
      |  rate, payment category and beneficiary fiscal regime from the masked text, and
      |  placeholders in its answers are read back locally
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

Step 2's structured fields are extracted with one shared model call per document (`api/app/providers/openrouter.py:extract_fields()`), recorded as `extraction` rows with `source = "assisted"`; a field the model could not establish with sufficient confidence is simply absent, so any rule needing it abstains naming that field rather than judging a guess (`docs/decision-log.md` D-043). The call receives the masked text only; placeholders in its answers are read back in memory (D-046).

## 4. Data model

Entities (PostgreSQL, SQLAlchemy models in `api/app/db/`):

| Entity | Key fields | Notes |
|---|---|---|
| `organisation` | id, name, tax id, kind | An MSME or the administration side |
| `app_user` | id, email (unique), password_hash (scrypt, parameters and salt in the string), role ("msme"/"accountant"/"officer"/"admin"), created_at | A person who signs in (D-054) |
| `organisation_member` | user_id, organisation_id (composite key) | The organisations a user files for: one for an MSME user, several for an accountant, none for an officer or admin |
| `user_session` | id, user_id, token_sha256 (unique), created_at, expires_at | A signed-in session; the token itself is never stored |
| `document` | id, organisation_id, uploaded_by, filename, storage_ref, status, created_at | The raw uploaded file; `uploaded_by` is the signed-in filer's email, `filename` the name as uploaded, `storage_ref` where the bytes live |
| `extraction` | id, document_id, field_name, value, confidence, source ("extracted"/"assisted"), extracted_at | One row per structured field pulled from the document; `full_text` and its `masked_text` copy, the only text a model receives (A1, D-042) |
| `corpus_source` | id (the manifest source id), title, edition, publisher, url, sha256, language, page_count, loaded_at | An official document the corpus is indexed from; provenance shown next to its text (D-031) |
| `corpus_chunk` | id, source_id, article_ref, paragraph_ref, heading_path, page, char_start, char_end, token_count, text, text_sha256, text_search (tsvector generated with the accent-folding `chahed_french` configuration, GIN index), embedding (pgvector), url, verification_status ("unverified"/"verified"), verified_by, verified_on | Paragraph- or item-level legal text, embedded; unique on (source_id, article_ref, paragraph_ref, char_start) so re-indexing updates in place (D-031). Verification comes from `corpus/verified-passages.json` on every load; unverified text never leaves the API (D-029, D-032) |
| `rule` | id, code, citation_source, article_ref, verbatim_text, url, logic_ref, error_codes (JSON list) | The rule registry entry; `logic_ref` points to the deterministic code that evaluates it. `error_codes` names the decided codes that report a problem found, declared by the rule's author so the impact panel counts errors without inferring meaning from code names (J9, D-048) |
| `finding` | id, document_id, rule_id, status ("decided"/"abstained"), decided_code, missing_fact (nullable), trace (JSON list of steps: fact, source "document"/"model"/"person", value, confidence, threshold, confirmed_by, confirmed_at), created_at | One evaluation outcome per rule per document; the trace records the facts the rule used, in order (J1, D-039), naming the person who confirmed one (J4, D-047). Answering a missing fact replaces the document's findings with a fresh evaluation |
| `citation` | id, finding_id, rule_id | Join surface so a finding's citation is always resolvable in one query |
| `supplier_fact` | id, organisation_id, supplier_tax_id, fact_name, value, confirmed_by, confirmed_at, valid_until (nullable) | A supplier property a person confirmed, unique per organisation, supplier and fact. Reused on that supplier's later files so the same question is not asked twice (B3, J4, J11, D-047); an expired one stops applying |
| `counterparty_check` | id, document_id, rne_id, registered (bool), identifiers_match (bool), status_text | Registration facts only; no score field, per D-007 |
| `officer_decision` | id, document_id, officer_id, action ("validated"/"flagged"), note, decided_at | The one human-authority step before export; `officer_id` is the signed-in officer's email |
| `export` | id, document_id, xml_ref, xsd_validated (bool), validated_at | Produced only after `officer_decision.action == "validated"` |
| `audit_entry` | id, entity_type, entity_id, actor, action, at | Append-only trail across the pipeline |

`finding.status = "abstained"` is a normal, expected row, not an error log entry (D-005).

## 5. API surface (api/, FastAPI)

REST, versioned under `/api/v1`. Every endpoint but health, sign-up and sign-in takes `Authorization: Bearer <token>`; the role that may call each is in brackets (D-054).

- `POST /auth/signup` - creates an MSME, its first `msme` user and a session (`email`, `password`, `organisation: {name, tax_id}`); 409 on a taken email or tax id
- `POST /auth/login` - opens a session: `{token, expires_at, user}`; 401 with one message for a wrong email or password
- `POST /auth/logout` [any] - ends the calling session
- `GET /auth/me` [any] - the user, their role and the organisations they file for
- `POST /documents?organisation_id=` [msme, accountant] - multipart upload for one of the user's organisations, recorded as uploaded by them; extraction and rule evaluation run before it returns. Several `file` parts are phone photos of one paper document, stored and read as one PDF; 422 when one is not a readable image or there are more than 20 (G3, D-055)
- `GET /documents/{id}` [officer, members of its organisation] - status, filename, organisation, extraction results, officer decision, export
- `GET /documents/{id}/findings` [officer, members of its organisation] - findings with their rule code, decision trace and resolved citation
- `POST /documents/{id}/counterparty-check` - RNE lookup (not built: the RNE is unreachable, see `docs/facts.md`)
- `GET /officer/queue` [officer] - extracted files awaiting a decision, with filename, organisation name, finding counts and the distinct missing facts their abstentions name
- `POST /officer/decisions` [officer] - validate or flag a document (`document_id`, `action`, `note`), recorded as decided by the signed-in officer
- `GET /documents/{id}/answerable-facts` [officer, members of its organisation] - the supplier facts a person may confirm for this file, with the values each accepts; `supplier_tax_id` is null when the supplier could not be identified (J4)
- `POST /documents/{id}/supplier-facts` [officer, members of its organisation] - records the signed-in user's answer about the supplier (`fact_name`, `value`, optional `valid_until`) and re-runs the document's rules; 409 without an identified supplier, 422 for a fact or value the registry does not accept (B4, J4, D-047)
- `GET /impact` [officer; a filer only with one of its own `organisation_id`s] - counts computed from this database (files, decided and abstained findings, errors intercepted per rule, abstentions by missing fact, facts confirmed by people) and the D-016 benefit calculation, each input returned with its basis so an unsourced one is shown as an estimate; optional `organisation_id` scopes it to one filer (J9, F1, D-048)
- `GET /documents/{id}/export-draft` [officer] - a pre-fill for the export form, projected from the document's extraction rows (no new table: `docs/decision-log.md` D-043); every value stays editable and the officer still supplies and owns the whole export payload
- `POST /documents/{id}/export` [officer] - build and validate the TEJ export from caller-supplied declaration fields, VAT included (only after validation); a refusal answers 422 with every schema and arithmetic error placed on its request field, as `{loc, msg, type}`
- `GET /export/operation-codes` [officer] - the withholding codes the TEJ schema accepts, read from `schemas/tej/`
- `GET /rules` [admin] - registry read; rules are written by the loader in `api/app/rules`, not over HTTP
- `GET /corpus/search?q=&top_k=` [any] - verified passages only, hybrid retrieval, each with a marked excerpt and how it matched (`texte`, `sens`, `les deux`)
- `GET /corpus/chunks/{id}` [any] - a verified passage with its verified neighbours, its article's verified outline and its source; 404 for an unverified chunk
- `GET /corpus/sources` [any] - sources with provenance, verified and total passage counts, and the rules citing each
- `GET /corpus/verification-queue` [admin] - unverified chunks by reference and official page link, never text
- `GET /findings/{id}/related` [any] - verified passages related to a finding's rule and missing fact, its own citation left out

Only verified legal text leaves the corpus endpoints (D-029, D-036).

`web/app/api/` route handlers proxy to these; they hold no business logic. The session token lives in an HttpOnly cookie set by the web app's server actions, and the proxy forwards it as the bearer token.

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
| 2026-09-13 | team | API surface: corpus search, passage, sources, verification queue and related-text endpoints; `text_search` generated with an accent-folding configuration (D-036) |
| 2026-09-13 | team | Data model and API: `finding.trace`, the decision trace (D-039) |
| 2026-09-13 | team | API: queue rows name their missing facts (D-040) |
| 2026-09-13 | team | API: export takes VAT and places refused values on request fields (D-041) |
| 2026-09-13 | team | Data model: `masked_text` extraction, the only text sent to a model (D-042) |
| 2026-09-13 | team | Structured field extraction (section 3), GET /documents/{id}/export-draft (section 5); data model (section 4) unchanged, per D-043 |
| 2026-09-13 | team | supplier_fact and rule.error_codes (section 4); answerable-facts, supplier-facts and impact endpoints (section 5), per D-047 and D-048 |
| 2026-09-13 | team | Pipeline: masking before the one assisted extraction call, answers read back locally (D-046) |
| 2026-09-13 | team | Sign-in: four roles (section 2), `app_user`, `organisation_member`, `user_session` (section 4), auth endpoints and the role of every endpoint, `/organisations` removed (section 5), per D-054 |
