# Decision log

Every significant decision, dated. Append, never rewrite history: if a decision changes, add a new entry that supersedes the old one and say so.

---

## D-001 - Product name and thesis

**Date:** 2026-09-12

**Decision:** Keep the product name `Chahed`. The one-sentence thesis: every error a business makes costs the administration more than it costs the business.

**Options considered:**
- Keep `Chahed` (carried over from the prior scaffold).
- Rename to match the narrower v2 scope.

**Why:** No renaming rationale was given with the v2 description; changing a name without a reason adds churn for no benefit. The thesis sentence is the one line the whole product answers to, so it is recorded as a decision, not left implicit in prose.

**Result:** Name unchanged. Thesis sentence appears in `docs/plan.md` section 1 and in `README.md`.

---

## D-002 - Anchor on article 62 and a named prestataire

**Date:** 2026-09-12

**Decision:** The pitch narrative is carried by a real supplier who cannot be paid because the withholding certificate is wrong, grounded in article 62. Code selection is the technical core; the article 62 story is the human entry point.

**Options considered:**
- Lead with the abstract mechanism ("we select the correct withholding code").
- Lead with the article 62 story, back it with the mechanism.
- Two separate pitches for technical and non-technical audiences.

**Why:** "We select the correct code" means nothing to a non-technical judge. A named prestataire who did real work and cannot be paid over a form error gives the same content a person, a harm, and a resolution. One structure serves both audiences without doubling the pitch.

**Result:** `docs/plan.md` section 2 opens with the article 62 case before describing the pipeline.

---

## D-003 - Scope boundary: erroné and confus only

**Date:** 2026-09-12

**Decision:** The product addresses two of the four problem families: declarations produced with errors (erroné), and taxpayers who want to comply and cannot manage it (confus). It explicitly refuses the other two: missing declarations (manquant, requires DGI's internal database) and deliberate fraud (frauduleux, requires investigation and enforcement powers we do not have and should not build).

**Options considered:**
- Cover all four families as a long-term roadmap claim.
- Cover only erroné and confus, state the refusal of the other two as a design choice.

**Why:** A fraud-detection tool is fiscal policing, a different product with a different trust relationship to the taxpayer. Building it would also require enforcement data access we do not have. Naming the refusal turns a limitation into a stated position: we protect honest but confused taxpayers, we do not police them.

**Result:** The four-families table appears in `docs/plan.md` section 1, worded as a choice, not an excuse.

---

## D-004 - Compliance judgement is deterministic code

**Date:** 2026-09-12

**Decision:** The model extracts facts, explains findings, and drafts text. It never decides whether a compliance finding exists. Every finding is produced by a deterministic rule evaluating facts, one of which may itself be a model-supplied assisted fact carrying a confidence score.

**Options considered:**
- Let the model reason directly to a code recommendation.
- Deterministic rules over extracted facts, with the model confined to extraction, retrieval, and explanation.

**Why:** A public administration will not accept "the model said so" as the basis for a certificate that affects payment and tax liability. A deterministic rule can be read, tested, and defended in a legal and procurement review; a model's internal reasoning cannot. This is the same principle already fixed in the inherited `CLAUDE.md` code rules and it is restated here as the reason those rules exist for this product.

**Result:** `lib/rules` (now `api/app/rules`) holds the rule registry; the provider module never returns a compliance verdict, only facts and text.

---

## D-005 - Abstention is a first-class outcome

**Date:** 2026-09-12

**Decision:** When available information does not allow a rule to decide, the system says so and states exactly what is missing, then escalates a specific question to a human. It does not guess, and it does not silently fall back to a default code.

**Options considered:**
- Force a best-guess code with a low-confidence flag.
- Abstain explicitly and escalate a named question.

**Why:** A wrong code that looks confident is worse than an honest "cannot determine, missing X" because it is the wrong-code failure mode this product exists to prevent. Escalating a specific question (not a generic "review this") is what makes the officer's review fast instead of a restart from zero.

**Result:** Abstention is modeled as a finding status, not an error path, in `docs/architecture.md` section 4 (data model).

---

## D-006 - No finding without a citation

**Date:** 2026-09-12

**Decision:** Every finding carries the source, the article number, the verbatim legal text, and a URL to the official text. The citation is one click away from the finding on screen.

**Options considered:**
- Cite by article number only, verbatim text available on request.
- Cite article number, verbatim text, and source URL inline, one click from the finding.

**Why:** The click to the citation is the demo's central proof point: it is what separates this from a model that asserts things. A citation that requires digging defeats the purpose.

**Result:** Carried over as the binding rule already stated in the root `CLAUDE.md` ("No finding without a citation"); `docs/architecture.md` specifies the citation as a first-class entity tied one-to-many from a finding.

---

## D-007 - No supplier scoring or reputation screening

**Date:** 2026-09-12

**Decision:** The product does not score suppliers or screen them for reputation or adverse media. RNE verification is limited to confirming registration facts (existence, identifiers, status), not producing a risk score.

**Options considered:**
- Build a supplier risk score from RNE and public signals.
- Verify registration facts only, no scoring.

**Why:** Practitioners interviewed during scoping attached no value to a reputation score; it was built and then withdrawn. Scoring also creates a different kind of liability (a wrong score damaging a real business) that is out of scope for a compliance-support tool.

**Result:** `api/app/counterparty` exposes fact lookups (registered, identifiers match, status) and no score field anywhere in the data model.

---

## D-008 - The officer decides, the system pre-qualifies

**Date:** 2026-09-12

**Decision:** The officer role reviews a pre-qualified file and validates or flags it. The system never submits a certificate or a declaration on its own authority, and liability for the final decision stays with the officer.

**Options considered:**
- Auto-approve files above a confidence threshold.
- Officer validates every file, system pre-qualifies and highlights what is already checked.

**Why:** This is the answer to "who is responsible in case of error," one of the two questions flagged as certain to come up. An administration will not accept a tool that removes the human from a decision with legal consequences.

**Result:** `docs/plan.md` section on roles states the officer's validate/flag actions as the only two terminal actions on a file; `docs/architecture.md` marks the officer decision as a required, auditable step before any export leaves the system.

---

## D-009 - Impact measured as errors prevented, not time saved

**Date:** 2026-09-12

**Decision:** The pilot metric is the first-submission compliance rate before and after, the count of errors intercepted per file (each with its citation), and the downstream interventions removed (corrected declaration, cross-check investigation, support call). The national projection multiplies annual certificate volume by observed error rate by interventions per error, shown as an open calculation with every input sourced.

**Options considered:**
- Lead with hours or cost saved for the business.
- Lead with errors prevented and downstream interventions removed, projected nationally with a sourced calculation.

**Why:** Time saved is the metric every hackathon project claims; it does not speak to what a tax administration actually optimizes for. A visible, modest, sourced calculation is more credible in front of an audience that knows the real numbers than a large unexplained one.

**Result:** `docs/plan.md` section 8 (impact) and `docs/facts.md` carry the formula and mark every input's verification status.

---

## D-010 - Stack: Next.js/shadcn front end, Python backend, PostgreSQL

**Date:** 2026-09-12

**Decision:** The web application is Next.js (App Router) with TypeScript and shadcn/ui components. The backend is a Python service (latest stable release) exposing a REST API. The database is PostgreSQL with the pgvector extension for corpus chunk embeddings. The repository splits into `web/` and `api/`, with shared, non-code assets (`docs/`, `corpus/`, `rules/`, `schemas/`, `fixtures/`, `seed/`) at the repository root.

**Options considered:**
- Single Next.js application with API routes and TypeScript throughout.
- Next.js front end, Python backend, split repo (chosen).
- Separate `apps/`/`services/`/`packages/` monorepo with a shared-package layer.

**Why:** OCR, document extraction, and retrieval tooling are stronger and better supported in the Python ecosystem for a hackathon timeline; a REST boundary between a TypeScript UI and a Python service is a well-understood pattern that does not require a shared package layer. The three-tier `apps/services/packages` layout was rejected as more ceremony than an eight-week hackathon build needs.

**Result:** `docs/architecture.md` section 1 specifies the full tree. The root `CLAUDE.md` repo map, which still describes a single TypeScript tree, is out of date as a result of this decision; a follow-up edit is proposed separately rather than made silently (see the note at the end of this log's latest entries).

---

## D-011 - OpenRouter as the single LLM gateway

**Date:** 2026-09-12

**Decision:** All model calls go through OpenRouter. Exactly one module per process talks to it (`api/app/providers/openrouter.py` on the backend; the front end never calls a model directly). The model id is read from the environment with no default and no fallback, per the existing configuration rules.

**Options considered:**
- Call a single vendor's SDK directly.
- Route every call through OpenRouter so the underlying model stays swappable without an application code change.

**Why:** The root `CLAUDE.md` already requires the model provider to be swappable and forbids naming a vendor model outside one file. OpenRouter's own value proposition is exactly that swappability, so it is a natural fit for a rule that already existed independent of this choice.

**Result:** `api/app/providers/openrouter.py` is the only file permitted to import an OpenRouter client or reference a model id string; `OPENROUTER_API_KEY` and `OPENROUTER_MODEL_ID` are the two environment variables it requires, both with no default.

---

## D-012 - Embeddings are a separate concern from OpenRouter

**Date:** 2026-09-12

**Decision (flagged assumption, confirm before implementation):** OpenRouter is a chat-completion gateway; it does not expose a dedicated embeddings endpoint for every model. Retrieval embeddings (for the corpus chunks and for query-time matching) are produced by a separate embedding source, reached through the same one-module provider boundary. Default: a local embedding model, so no document text has to leave the machine to be indexed. A hosted embedding endpoint stays swappable behind the same boundary if local quality is insufficient.

**Options considered:**
- Assume OpenRouter also serves embeddings and design around that.
- Treat embeddings as a distinct capability with its own provider seam, default to local.

**Why:** Asserting OpenRouter serves embeddings without checking would violate the SDK-verification rule already in the root `CLAUDE.md`. A local default also answers the "where do the documents go" question directly for the corpus path.

**Result:** `api/app/providers/embeddings.py` is a second, separate provider module. This decision is marked as an assumption pending a five-minute check of OpenRouter's actual API surface before implementation starts; do not build against it unverified.

---

## D-013 - Document privacy: local OCR, masking before any external call

**Date:** 2026-09-12

**Decision:** Uploaded documents are OCR'd and have their structured fields extracted locally. Only masked text (personal identifiers removed or replaced with placeholders) is sent to OpenRouter for the retrieval-assisted reasoning and drafting steps that need a model.

**Options considered:**
- Send full document text to the hosted model for extraction and reasoning.
- OCR and structured extraction fully local; mask before any hosted call.

**Why:** This is the prepared answer to the first of the two questions flagged in the v2 description ("where do the documents go"). A masking step before any external call is a concrete, demonstrable answer rather than a promise.

**Result:** `docs/architecture.md` section 3 places OCR and extraction before the provider boundary in the pipeline diagram, with a masking step in between.

---

## D-014 - Two configuration modules, one per process

**Date:** 2026-09-12

**Decision:** With the repository split into `web/` and `api/`, the root `CLAUDE.md` rule "configuration enters the process in exactly one module" is read as one module per process: `web/lib/env.ts` for the Next.js process, `api/app/config.py` for the Python process. Each still applies the identity-vs-parameter distinction (no default for anything naming a system, account, or vendor; documented defaults allowed for algorithm parameters) and the all-or-nothing rule for a related settings group.

**Options considered:**
- Read the existing rule literally as a single module for the whole repository, which is impossible once there are two runtimes.
- Read it as one module per process, preserving its intent.

**Why:** The rule's purpose is to prevent configuration from leaking into arbitrary files, not to force a single process. Splitting by process is the natural unit once there are two independently deployed runtimes.

**Result:** Recorded here as the authoritative reading; `docs/architecture.md` states both module paths explicitly. The root `CLAUDE.md` repo map and this rule's wording should be updated to reflect the split (see note below); until then, this entry governs.

---

## D-015 - A facts register gates every public claim

**Date:** 2026-09-12

**Decision:** No number, date, or article reference reaches a slide or a screen unless it has a row in `docs/facts.md` with status `verified`. Every claim starts at `to verify` and is promoted only after a person checks it against the official source; a model's recollection never promotes a fact.

**Options considered:**
- Trust figures and dates as drafted from the project description.
- Gate every stated fact through a register with an explicit verification status.

**Why:** Two of the flagged risk items in the v2 description are exactly this class of error (an unverified compliance figure, an unverified code count) presented to an audience that includes people who will check. A register makes the unverified state visible instead of silent.

**Result:** `docs/facts.md` created with every v2-sourced claim entered at status `to verify`.

---

## D-016 - Agency Benefit slide: a derived hours figure, not a new primary metric

**Date:** 2026-09-12

**Decision:** Add a labelled, derived hours-saved figure to satisfy the hackathon brief's mandatory "Agency Benefit" slide (45 seconds, one slide, stating exactly how many manual hours the agency saves per month). This figure is computed from the same calculation established in D-009 (downstream interventions removed per month x average officer time per intervention), never presented as an independent or unsourced headline. D-009's primary metric (errors prevented, downstream interventions removed) is unchanged and remains the substantiation for the derived figure.

**Options considered:**
- Skip the mandatory slide, or retitle it to fit the errors-prevented framing only, accepting we do not literally answer the brief's required sentence.
- Derive an hours-saved figure from the existing, sourced errors-prevented calculation, and show it alongside that calculation on the mandatory slide.
- Lead the whole pitch with a generic hours-saved headline (reopening D-009).

**Why:** The brief makes this slide mandatory and names the exact sentence to answer; ignoring it risks losing on a scored requirement. Reopening D-009 to lead with hours would give up the more credible, harder-to-attack metric for no reason, since the hours figure can be derived from it directly. A new multiplicand (average officer time per intervention) is added to the impact calculation, sourced or explicitly labelled as an estimate per the existing estimates rule.

**Result:** `docs/plan.md` section 7 adds an "Agency Benefit slide" subsection with the conversion formula. `docs/facts.md` gains an impact-calculation-inputs row for average officer time per intervention, and the banned-claims entry for "hours saved" is narrowed to exclude this specific, sourced, labelled derivation.

---

## D-017 - api/ scaffold: Python 3.12 pin, embedding dimension default

**Date:** 2026-09-12

**Decision:** Two implementation calls made while scaffolding `api/` (Phase 0), each a deviation from or a gap in an existing decision, recorded rather than made silently:

1. Python is pinned to 3.12 via `uv`, not the "latest stable release" language in D-010 (which is 3.14 as of this date). Core dependencies (psycopg, pgvector, SQLAlchemy) either lacked 3.14 wheels or were unverified against it at scaffold time.
2. `corpus_chunk.embedding` needs a fixed vector dimension to create the column. D-012 leaves the embedding model (and so its dimension) an open, unconfirmed assumption. A default of 384 (`EMBEDDING_DIMENSIONS` in `api/app/config.py`, documented default per the algorithm-parameter policy) is used so the migration can exist at all; it is a placeholder, not a model choice, and the column will need a new migration once D-012 is actually resolved.

**Options considered:**
- Block the entire database schema and first migration on resolving D-012 first.
- Add a documented, overridable default dimension now, revisit when the embedding model is chosen.

**Why:** Phase 0's gate is "first migration applies cleanly" (`docs/plan.md` section 8); the whole schema, not just the embedding column, was waiting on it. A configurable default with the assumption stated in the same place (`api/app/config.py`, `api/CLAUDE.md`) is cheaper to unwind later than blocking Phase 0 on a decision that belongs to Phase 1's corpus work.

**Result:** `api/.python-version` pins 3.12. `api/app/config.py` documents `EMBEDDING_DIMENSIONS_DEFAULT = 384`. Both are flagged in `api/CLAUDE.md` for whoever picks up the embeddings provider next.

---

## D-018 - D-012 resolved: OpenRouter embeddings verified, local model chosen

**Date:** 2026-09-12

**Decision:** Supersedes D-012's flagged assumption with an actual verification, using a real OpenRouter key: `POST /api/v1/embeddings` on OpenRouter works, returning real vectors (tested live against `openai/text-embedding-3-small`, 1536 dimensions, real cost incurred: $0.00000002). D-012's premise ("OpenRouter does not expose a dedicated embeddings endpoint") was wrong. The default stays local anyway: `sentence-transformers`, model `paraphrase-multilingual-MiniLM-L12-v2`, verified to produce 384-dimension vectors, matching the schema default already committed in D-017 (coincidence, not planning; confirmed after the fact). `torch` pulls ~2GB of CUDA/nvidia packages from the default PyPI index even with no GPU present; pinned to the CPU-only wheel index (`https://download.pytorch.org/whl/cpu`) instead, via `[tool.uv.sources]`.

**Options considered:**
- Switch the default to OpenRouter's hosted embeddings, now that they are confirmed to work.
- Keep the local default: offline, free, no dependency on a paid external call for indexing legal text.

**Why:** Offered as a real choice, not decided unilaterally: OpenRouter's own embeddings would remove the torch/sentence-transformers dependency entirely, but cost money per call, need internet at index time, and return a different dimension (1536, requiring a schema migration to change). The team chose to keep local.

**Result:** `api/app/providers/embeddings.py` implements the local model. `api/Dockerfile` pre-downloads the model weights at build time so the running container needs no Hugging Face access. `OPENROUTER_MODEL_ID` was set to `google/gemini-2.5-flash` (verified against OpenRouter's live model list) so the OpenRouter key is usable once `api/app/providers/openrouter.py` is actually built; that provider module itself is not built yet.

---

## D-019 - Real DGI TEJ XSD schema found and added to schemas/

**Date:** 2026-09-12

**Decision:** Located and downloaded the actual, current DGI TEJ withholding-declaration XSD schema from `jibaya.tn` (the DGI's own tax portal, linked from public press coverage of the September 2026 TEJ platform update), rather than continuing to treat `docs/facts.md`'s "DGI TEJ export has a published XSD schema" as unreachable. Added it to `schemas/tej/` with a `SOURCE.md` recording provenance. Built `api/app/export/tej.py` to generate and validate a real `DeclarationsRS` XML against this real schema (previously, only a synthetic fixture schema existed for `api/app/export/xsd.py`, since no real schema was known to be available).

**Options considered:**
- Keep treating TEJ export as blocked, since no one had supplied the schema.
- Search for and verify a real public source before assuming it is unreachable.

**Why:** The root CLAUDE.md rule against fabricating an external contract applies to *guessing* a schema's structure, not to using the schema once it is genuinely found. A five-minute search turned up a live, official download; there was no reason to keep building against a synthetic placeholder once the real one was one request away.

**Result:** `schemas/tej/*.xsd` are in the repository. `docs/facts.md` gained candidate answers (not `verified` - that promotion is still a human step) for the withholding-code count (36, not "more than 40", with two numbering gaps and no RS10 category flagged for someone to check) and the schema's existence. `api/app/export/tej.py` and its tests validate real generated XML against the real schema, not a fixture.

---

**Note on the root `CLAUDE.md`:** D-010 and D-014 change facts the root guide currently states as settled (a single TypeScript tree; one config module repo-wide). That file is binding and is not edited as a side effect of this documentation pass; the edit is proposed to the user as a follow-up.

---

## D-020 - RNE re-checked: reachable, but account-gated, not network-gated

**Date:** 2026-09-12

**Decision:** Re-checked RNE reachability from a different network (the user removed a firewall). `home.registre-entreprises.tn` still returns 503, but `www.registre-entreprises.tn/rne-public` now loads as a real Angular portal. Read its own served JS bundle (public, same as any browser downloads) to find its real API surface rather than guess one: four API bases (`rne-api`, `rne-auth-api`, `rne-bor-api`, `rne-subscription-api`) and a real search endpoint, `GET /api/rne-api/front-office/entites`, with real parameter names (`idUnique`, `denomination`, `nomCommercialFr`, `cnssNumPM`, and others) taken directly from the generated API client code. Called it live, unauthenticated: `401 Access is denied`. Traced the auth flow: `/api/rne-auth-api/oauth/token` needs a real user account; the embedded Basic credential is the SPA's own OAuth client id, not a bypass. No unauthenticated search path exists in the served client code.

**Options considered:**
- Assume the earlier network-level 503 was the only blocker and build the integration now that the site loads.
- Verify what actually gates the real search endpoint before writing any integration code.
- Try further to find or work around the auth requirement (guess a public/guest flow, hunt for a bypass).

**Why:** The root CLAUDE.md rule against fabricating an external contract cuts both ways: it is also wrong to assume a blocker is resolved without checking. The previous "unreachable" finding and the current "requires a real account" finding are both genuine, evidence-based facts, not assumptions, arrived at the same way as D-019. Going further than reading the site's own public client code (trying to obtain or guess credentials, hunting for an undocumented bypass) is a step the team should decide on explicitly, not something to do unilaterally against a live government system.

**Result:** `app/counterparty/` stays unbuilt. `docs/facts.md`'s RNE row is updated with the concrete endpoint, parameters, and the specific 401/OAuth finding, replacing the vaguer "contract-gated" note. If the team obtains real RNE credentials, `front-office/entites?idUnique=<...>` is the endpoint to integrate against, using the parameter names found here (not yet `verified`: a person should confirm `idUnique` is the same identifier as the DGI matricule fiscal before relying on it).

---

## D-021 - Real legal text sourced into corpus/sources/, found a real chunking bug

**Date:** 2026-09-12

**Decision:** `legislation.tn` still 503s, but other official/reference Tunisian legal sources are reachable now (`iort.gov.tn`, `jurisitetunisie.com`, and PDF mirrors of the Code de l'IRPP et de l'IS). Downloaded the current Code de l'IRPP et de l'IS (watermarked "Imprimerie Officielle de la Republique Tunisienne"), extracted Articles 52 through 55 ("2. Retenues a la source") with `pypdf`, and added them as the first real content in `corpus/sources/` (previously empty). Built `app/corpus/load_corpus.py`, a CLI loader mirroring `app/rules/load_rules.py`'s pattern (a `manifest.json` naming each source file and its URL), and ran it against the real database: 4 real chunks, real embeddings, real pgvector retrieval, verified live with French tax queries returning the correct articles.

Running it surfaced a real bug: `app/corpus/chunking.py`'s heading regex only matched a bare "Article N" heading and returned zero chunks for the real text, which uses "Article N.-" (period-hyphen suffix), the standard heading style for Tunisian codified law. Widened the regex; added a regression test using the real heading style; existing synthetic-fixture tests still pass unchanged.

**Options considered:**
- Keep `corpus/sources/` empty until a full corpus-sourcing pass is scoped, since one section is a small fraction of the real corpus.
- Add one real, verifiable section now to prove the pipeline end to end against real content, same as D-019 did for the TEJ schema.

**Why:** The pipeline (`chunking.py`, `service.py`, `retrieval.py`) had only ever been tested against synthetic fixture text. A small amount of real content was enough to find a real bug that synthetic fixtures could not have caught (the heading format difference), matching this session's standing instruction to test everything end to end against real material, not just unit fixtures.

**Result:** `corpus/sources/cirppis-retenues-a-la-source.txt`, `CODE-IRPP-IS-2024.pdf`, `manifest.json`, and `SOURCE.md` (provenance) are in the repository. `app/corpus/load_corpus.py` is a new CLI entry point; `app/config.py` gained `corpus_sources_dir` (algorithm parameter, default `../corpus/sources`, `/corpus-sources` in Docker). No compliance rule was written against this text: Article 52's rates and exceptions are legally complex and have been amended repeatedly; writing a rule against them accurately is a legal-content decision for the team, not something to guess at while sourcing the text.

---

## D-022 - Web UI: client-side data through a thin proxy, fixed tokens, assumed response shapes

**Date:** 2026-09-12

**Decision:** Build the `web/` UI against the backend contract only, with no mock data in the repository. The browser calls `/api/v1/*` on the Next.js app; one catch-all route handler forwards to `API_BASE_URL`; screens load and poll their data client-side. Typography is IBM Plex Sans and Plex Mono, and the token file is `web/app/globals.css`. Where `docs/architecture.md` section 5 does not fix a response shape, the UI assumes the following (defined in `web/lib/api-types.ts`):
- `GET /documents/{id}` returns `id, filename, status, uploaded_at, extractions[], counterparty_check | null, officer_decision | null, export | null`.
- `GET /documents/{id}/findings` returns findings with their `rule` embedded (code, source, article, verbatim text, url, logic ref).
- `GET /officer/queue` returns rows of `document_id, filename, organisation_name, submitted_at, status, decided_count, abstained_count, counterparty_registered | null`.
- `POST /documents` takes the multipart field `file` and returns the document; `POST /officer/decisions` takes `document_id, action, note`.
- Document `status` is free text. The UI labels known values and derives pipeline progress from the presence of each stage's output, never from the status string.

**Options considered:**
- A typed client plus a mock backend inside `web/` for demos before the API exists.
- A real client only, built against the architecture contract.
- Static fixtures imported directly by components.
- Server components fetching the backend directly, instead of client-side polling through a proxy.

**Why:** A mock in the repository would be thrown away and could drift from the backend; the user chose the real client only. Client-side polling is what demo moments 1 and 4 need (fields populating live, a file arriving in the queue). A single proxy keeps the backend origin in the one server-side configuration module (D-014). Presence-based progress stays correct whatever status vocabulary the backend settles on. IBM Plex covers Latin Extended and reads as a sober administrative face.

**Result:** Screens for all three roles on branch `feat/web-ui`, with the admin registry read-only so cut list item 1 stays cheap. The backend confirms or corrects the shapes above, and `web/lib/api-types.ts` changes with any correction. `docs/design.md` sections 2, 3, 5 and 7 updated.

---

## D-023 - Answer-first file review with a side rail

**Date:** 2026-09-12

**Decision:** Both file review screens (MSME and officer) lead with a result banner: proposed code, number of missing facts, extracted fields, and RNE status. The main column holds the cited findings, then the extracted fields. A side rail holds the officer's decision and export (officer), progress as a vertical step list, and the RNE check. The separate "already checked" card is replaced by the banner. The extraction table marks only assisted facts, with a visible legend instead of a tooltip.

**Options considered:**
- Answer first with a side rail.
- A result banner followed by tabs (Constats, Informations, Fournisseur, Suite).
- A single column, reordered, with extracted fields collapsed by default.

**Why:** The first version put the answer below a long extraction table and repeated the same fact in several places. Tabs would hide content the presenter must show during the demo. A rail keeps every element visible while cutting the scroll length, and it puts the officer's one action next to the evidence.

**Result:** `components/shared/result-banner.tsx`, `review-layout.tsx` and `file-header.tsx` added; `prequalification-summary.tsx` removed; unused shadcn primitives (dialog, sheet, progress, separator, tooltip) removed. `docs/design.md` section 4 updated.

---

## D-024 - Web and api integration: backend is the contract, minimal extensions

**Date:** 2026-09-12

**Decision:** Merge `feat/web-ui` into `docs/v2-scope-and-architecture` and make the UI work against the real backend. The backend's Pydantic models are the contract; `web/lib/api-types.ts` mirrors them and replaces the shapes D-022 assumed. The backend gains only what the screens need:
- `document.filename` (migration `a3f9c2d17b64`, backfilled from `storage_ref` for older rows).
- `GET /documents/{id}` returns the organisation, the officer decision and the latest export; findings carry their `rule_code`.
- `GET /officer/queue` rows carry filename, organisation name, and decided and abstained counts.
- `GET` and `POST /organisations`, so the upload screen can pick or create the organisation a file is filed for.
- `GET /export/operation-codes`, read from the real TEJ schema, so the export form offers exactly the codes the XSD accepts.

On the web side: an organisation picker and the uploader's e-mail feed `POST /documents`; `officer_id` comes from `OFFICER_ID` in `web/.env` until officer sign-in exists; after validation the officer fills the TEJ declaration in a form (amounts typed in dinars, sent in millimes as the schema requires) and refused exports list every XSD error; the RNE check is removed from the screens because no counterparty endpoint exists (D-020); the extracted text is shown as a text block because extraction records a single `full_text` field. `docker compose up` now also builds and runs `web`.

**Options considered:**
- Adapt the UI to the backend as it stood, with no backend change, losing filenames, decision history and queue counts.
- Extend the backend minimally, each change tested.
- For identity: a seeded demo organisation with ids in env, or an organisations endpoint with a picker.
- For export: an officer form, or leaving export out of the UI.
- For running: web in Docker Compose, or `pnpm dev` beside the compose backend.

**Why:** Chosen by the user in each case. The extensions are read models and one small write (organisations): none moves compliance judgement out of the rules engine, and none infers a declaration value. Deriving the code list from the XSD keeps the form and the validator on one source.

**Result:** Backend tests added for every extension. `docs/architecture.md` sections 4 and 5, `api/CLAUDE.md`, `web/CLAUDE.md`, `docs/design.md` section 4 and `README.md` updated.

## D-025 - Configurable host port for the compose database

**Date:** 2026-09-13

**Decision:** `docker-compose.yml` publishes the database on `${CHAHED_DB_PORT:-5432}`. A developer whose machine already runs Postgres on 5432 sets `CHAHED_DB_PORT` in a git-ignored root `.env` and uses the same port in `api/.env`'s `DATABASE_URL`.

**Options considered:**
- A configurable host port with the current default.
- Move the tracked mapping to a non-standard port for everyone.
- No repo change: stop the local Postgres before working on Chahed.

**Why:** Chosen by the user. Teammates without a clash see no change, and the personal port stays out of tracked files. The host port is a local convenience, not process configuration: inside compose, `api` reaches `db:5432` regardless.

**Result:** `docker compose up` starts on a machine with a local Postgres on 5432. `api/CLAUDE.md` local setup updated.

## D-026 - First registered rule: Article 52(I)(a), cited from the DGI's 2026 edition

**Date:** 2026-09-13

**Decision:** Register `rules/cirppis-art52-i-a.json` (code `CIRPPIS-ART52-I-A`, logic `app.rules.cirppis_art52_honoraires.decide_article_52_withholding_mention`), citing Article 52, paragraphe I, a) of the Code de l'IRPP et de l'IS, 2026 edition, from the DGI's own portal (`https://jibaya.tn/wp-content/uploads/2026/03/11.pdf`, PDF page 84). The citation was promoted to `verified` in `docs/facts.md` after a person on the team checked the verbatim text against that page. `corpus/sources/` now holds the same 2026 edition in place of the 2024 copy from `alliance-tunisie.com`, so the indexed text and the citation come from one document. The chunker accepts the 2026 edition's `ARTICLE N :` heading style. In Docker, `rules/` is copied into the api image and `load_rules` runs on every start.

**Options considered:**
- Sign-off: a person reviews the evidence and the verification is recorded; stage the rule unregistered; hand over the evidence only.
- Source: the DGI 2026 edition for rule and corpus; for the rule only; keep the 2024 private-host copy.
- Loading: automatic in the compose command; manual CLI.

**Why:** Chosen by the user. The DGI portal is the tax authority's own publication and the most recent edition; the 2024 copy was a private re-host, two editions behind. The verbatim text was extracted from the 2026 PDF and compared with the DGI 2025 edition (identical) and the 2024 copy (same words, different footnote marker, one missing "du"), but the `verified` status rests on the person's check, not on those extractions. `load_rules` upserts by code, so running it on every start is safe.

**Result:** The registry holds one rule. Verified in the compose stack through the web proxy: an honoraires note without any withholding mention yields `ART52_WITHHOLDING_MISSING`, one mentioning a retenue yields `ART52_WITHHOLDING_PRESENT`, and a delivery note yields an abstention on `article_52_category`, each with the Article 52(I)(a) citation. Every upload now makes one live OpenRouter call. The 10% rate in the cited text (footnote (1): applies to amounts paid from 1 January 2021) is not asserted by the rule and not verified for a slide. `api/CLAUDE.md`, `corpus/sources/SOURCE.md` and `docs/facts.md` updated; api suite 74 passed.

---

## D-027 - Article 62 does not match the anchor case; real candidates found

**Date:** 2026-09-13

**Decision:** `docs/facts.md` already flagged D-002's anchor citation ("Article 62 ... exact text pending") as unverified. Now that the Code de l'IRPP et de l'IS is fully available (D-021), checked it directly: **the real Article 62 in this code governs bookkeeping/accounting record obligations (who must keep formal accounts), not withholding certificates or code selection.** It does not match the anchor case ("a prestataire unpaid because the wrong withholding code was selected on the certificate").

Two real articles in the same code do match the narrative:
- **Article 52(I)(a)** sets the rates and payment categories (honoraires, commissions, courtages, loyers) that determine which withholding code applies. This is what `app/rules/cirppis_art52_honoraires.py` (now the registered rule, D-026) and `app/rules/withholding_code_proposal.py` (D-028) are grounded in.
- **Article 55(I)** requires the debtor to deliver a "certificat de retenue" to the beneficiary at each payment, naming its required fields (identity, gross amount, withholding amount, net amount), and states it is issued "a travers une plateforme electronique mise en place par le ministere des finances" (added by decret-loi n. 2021-21, 2021-12-28) - this is almost certainly a direct reference to the TEJ platform itself.

**Options considered:**
- Leave "Article 62" in `docs/plan.md` unquestioned, since it was already marked `to verify` and not yet used on any real citation.
- Check it directly now that the source is available, since building further on an unverified anchor risks the whole pitch narrative citing the wrong article on stage.

**Why:** `docs/facts.md`'s own rule: "no fact on a slide or on screen that is not in docs/facts.md with status verified. Article numbers are checked by a person against the official source, never recalled from memory." "62" was never checked against the official source by anyone; it appears to have been a placeholder. Finding this now, before it reaches a slide, is exactly what the facts register is for.

**Result:** No file citing "Article 62" as a real rule exists (D-026 registered Article 52(I)(a) instead). `docs/facts.md`'s Article 62 row is updated with this finding. `docs/plan.md` section 2's anchor case still names "Article 62"; changing the pitch narrative's anchor citation is the team's call, not something to rewrite unilaterally. Candidate replacement: Article 55(I) for the certificate-delivery obligation, Article 52(I)(a) for the code-selection mechanism (already registered per D-026).

---

## D-028 - Withholding-code proposal engine (RS2 family)

**Date:** 2026-09-13

**Decision:** Built `app/rules/withholding_code_proposal.py`, docs/plan.md section 2's stated "technical core": given a document's text, propose which of the real 36 TEJ withholding codes (D-019) applies. Scoped narrowly to the honoraires/commissions/courtages family (RS2_000001 vs RS2_000002, distinguished by the beneficiary's fiscal regime, forfait d'assiette vs regime reel), the same family Article 52(I)(a) and the Article 62 investigation (D-027) both point to. Any other category (loyers, capitaux mobiliers, cessions, and so on) abstains by name; none of those are modeled yet.

**Options considered:**
- Attempt to cover all 36 codes now, for a more complete demo.
- Cover one real, narrow, well-understood family first, abstaining explicitly outside it.

**Why:** The other code families involve legally distinct, more complex conditions (residency, establishment, capital gains treatment) that were not part of this session's sourced text and would risk exactly the kind of guessed legal content the root CLAUDE.md rule forbids. A correct narrow proposal with honest abstentions elsewhere demonstrates the mechanism (demo moment 2: "the proposed withholding code appears with its citation") without overclaiming coverage.

**Result:** `app/rules/withholding_code_proposal.py` and its tests (tested live against the real model). Not yet a registered rule: needs a human-verified citation before entering `rules/`, same as D-026 provided for Article 52(I)(a).

---

## D-029 - Only verified legal text reaches a screen; explanations need a person's approval

**Date:** 2026-09-13

**Decision:** No legal passage appears on any screen unless a person has verified it against the official source. A passage retrieved from an official source but not checked by a person is not shown, not even with a "non vérifié" label. Model-drafted plain-language explanations appear only after a person has approved them.

**Options considered:**
- Show unverified official passages with a visible "non vérifié" label, to give context.
- Show only passages a person has verified (chosen).
- For explanations: show them automatically once code confirms every sentence quotes a passage verbatim, or require a person's approval as well (chosen).

**Why:** Chosen by the user. It extends D-015 and the root `CLAUDE.md` rule ("no fact on screen that is not verified") to retrieved text. An official PDF is not the same as a checked passage: the extraction keeps page numbers, footnotes and stray spaces inline (`corpus/sources/SOURCE.md`), and articles carry amended rates. A label would still put unverified rates in front of a reader. Explanations are per rule and per source version, so approving each once is affordable.

**Result:** `docs/feature-research.md` section 5 revised. Retrieval ranks over the whole corpus but the API returns verified passages only. Verifications are recorded in a tracked register. Unverified chunks reach the admin only as references (article, paragraph, link to the official page), never as text. Explanations are drafted into a file, approved by a person in review, and loaded only once approved.

---

## D-030 - The plan's scope includes every researched feature

**Date:** 2026-09-13

**Decision:** `docs/plan.md` takes in every feature in `docs/feature-research.md` sections 4 to 6; section 7 of that document (not recommended) stays out.
- Phases 0 to 5 keep the pitch as their goal, with the demo features added to their scope and gates.
- Phases 6 to 9 are added: pilot prerequisites, real coverage, structured inputs, partnerships.
- The build rule in the root `CLAUDE.md` and in `docs/plan.md` becomes: everything built serves a demo moment or a feature listed in `docs/plan.md`.

**Options considered:**
- Phases: keep demo phases and add roadmap phases (chosen); put everything before the pitch; replace the phases with one roadmap where the pitch is a milestone.
- Build rule: reword it to include plan features (chosen); leave the root `CLAUDE.md` unchanged.

**Why:** Chosen by the user. Separate roadmap phases keep the gate discipline for the pitch while making the roadmap binding. Items that depend on an external party (RNE, TunTrust) cannot be promised by the pitch date, so they sit in the last phase.

**Result:** `docs/plan.md` gains a demo moment 6, phases 6 to 9, an extended cut list and a feature scope section (section 12). The root `CLAUDE.md` build rule and source-of-truth list are updated. `docs/architecture.md` is updated as each feature lands, not in advance. The anchor article question (D-027) and the incidental findings in `docs/feature-research.md` section 3 are not features: they stay checks for a person before presenting. B2 builds on the RS2 proposal engine (D-028).

---

## D-031 - Corpus chunked by paragraph and item, read from the official PDF by page

**Date:** 2026-09-13

**Decision:** RAG steps 1 and 2 (`docs/feature-research.md` section 5.9). The corpus is indexed from the DGI PDF's page range, not from a text extract. Each article is split at line-start markers: paragraph (`I`, `II bis`), item (`a)`, `b bis)`, `1-`) and dashed item (`tiret N`). A piece over 450 tokens is split by sentence with one sentence of overlap. Each chunk stores its page, offsets, heading path and text hash, and belongs to a new `corpus_source` row carrying the PDF's sha256. The loader upserts on (source, article, paragraph, offset) and runs on compose start.

**Options considered:**
- Granularity: keep article chunks (only 2% of Article 52 embedded); paragraph and item, dashes included, as planned (chosen); also split at every blank-line paragraph inside an item.
- Text input: keep `cirppis-retenues-a-la-source.txt`; read PDF pages directly (chosen).
- Reload: delete and re-insert; upsert on a position key and delete what disappeared (chosen).

**Why:** A citation is a paragraph, so the chunk is the unit a person cites and verifies. On the real Articles 52 to 55, this gives 78 chunks, median 91 tokens, none over 450 (measured). A text extract cannot say which page a paragraph is on, and the source reader opens the official PDF at that page. Upserting keeps chunk ids stable, so a link to a passage survives a reload. The finer blank-line split was not taken: it departs from the plan without a measured need. Marker detection is mechanical: a sentence that follows a dashed list joins the last dash (for example the amendment note after `Article 52, I, a), tiret 3`).

**Result:** `app/corpus/chunking.py`, `service.py`, `load_corpus.py`, migration `5b8e1c4f9a02`, updated `corpus/sources/manifest.json`; the text extract is removed. Consequence for step 3: the `Article 52, I` lead-in chunk lies entirely inside the verified citation of `CIRPPIS-ART52-I-A`, but the `Article 52, I, a)` chunk also holds sentences the team has not verified ("Le taux de 10%(1) s'applique également...", "Ce taux est réduit à :"). It needs its own verification before it can be shown.

---

## D-032 - Verified passage register, applied on every corpus load

**Date:** 2026-09-13

**Decision:** RAG step 3. `corpus/verified-passages.json` records each passage a person has checked: source PDF sha256, article, paragraph, page, text sha256, checked by, checked on. `load_corpus` applies it after indexing: matching chunks become `verified`, all others `unverified`, and an entry that matches nothing is printed. A CLI prints a chunk's text, its official page link, and a register entry with the checker and date left blank. The register is seeded with one entry, `Article 52, I`.

**Options considered:**
- Seed: leave the register empty; seed only text already covered by a person's check (chosen); also seed `Article 52, I, a)` because the rule citing it is verified.
- Stale entries: fail the load; report and leave unverified (chosen).
- API-side filter: build it now; build it with the first endpoint that returns chunk text, RAG step 7 (chosen), since no endpoint returns corpus text yet and an unused filter would be dead code.

**Why:** The user chose to build the mechanism and seed it truthfully. The `Article 52, I` chunk text is verbatim inside the citation the team verified on 2026-09-13 (checked in code), so its entry carries that check. The `I, a)` chunk also holds sentences nobody checked, so seeding it would put unverified text on screen, which D-029 forbids. A changed source must not block loading: the plan says its passages return to unverified, and the printed report tells a person which checks to redo.

**Result:** `app/corpus/verification.py`, migration `7c2d9e3a41b5`, `VERIFIED_PASSAGES_PATH` (documented default), `docs/facts.md` row for the register. Phase 1 still needs a person to verify the passages the demo shows, starting with `Article 52, I, a)`.

---

## D-033 - Retrieval evaluation harness; recall target 0.9 until the team fixes one

**Date:** 2026-09-13

**Decision:** RAG step 4. `app/corpus/evaluation.py` reads `corpus/eval/questions.json`, a list of French questions each naming the expected article and paragraph and its author. It reports recall@5, mean reciprocal rank and verified coverage over the whole corpus, as a CLI and as a pytest against real embeddings and the real database. A chunk answers a question at the expected paragraph or inside it. The recall target is 0.9, a documented default in `app/config.py`.

**Options considered:**
- Who writes the question set: the team (chosen); a model drafts it for the team to rewrite.
- Matching: exact paragraph only; the expected paragraph or any item inside it (chosen).
- Recall target: 0.9 as the plan proposes (chosen as the default); wait for the team before setting any.
- Missing question set: fail the suite; skip the real-set test with a named reason and have the CLI report the target not met (chosen).

**Why:** The user chose to have the team write the set: a model-written set would grade retrieval on the model's own idea of the law. Item-level matching lets a writer cite at the level a person naturally cites ("Article 52, I, a)") while chunks are finer. A skipped test with a reason keeps the suite green without hiding the gate: the CLI exit code and the skip reason both say it is not met.

**Result:** No question set exists yet, so the phase 1 recall gate is not met. The harness is tested on a fictitious source. The team can change the target in `app/config.py` by recording a new decision.

---

## D-034 - Embedding model kept until the comparison can be measured

**Date:** 2026-09-13

**Decision:** RAG step 5 (compare embedding options, switch to `multilingual-e5-small` if it wins) is deferred until `corpus/eval/questions.json` exists. `paraphrase-multilingual-MiniLM-L12-v2` stays (D-018). Steps 6 and 7 go ahead on it.

**Options considered:**
- Switch to e5-small now on truncation evidence and run the ranking comparison later.
- Keep MiniLM until measured (chosen).
- Pause the whole RAG build until the question set is written.

**Why:** Chosen by the user. The plan makes the switch conditional on e5-small winning on the evaluation set, and without the set there is no honest way to say which wins. Measured meanwhile: MiniLM reads 128 tokens, and 31 of the 78 real chunks are longer (median 91, max 427), so their ends are not embedded. The full-text search added in D-035 still indexes their whole text.

**Result:** No model download, no image rebuild. When the question set exists, run the comparison from `docs/feature-research.md` section 5.8 (paragraph chunks with MiniLM, then e5-small, each with and without full-text fusion), record the result here, and switch only if e5-small wins.

---

## D-035 - Hybrid retrieval: full-text and vector search fused by reciprocal rank

**Date:** 2026-09-13

**Decision:** RAG step 6. `corpus_chunk.text_search` holds `to_tsvector('french', unaccent(text))` with a GIN index. A search runs a cosine search (top 20, similarity at least 0.4) and a full-text search (top 20, query terms ORed, ranked by `ts_rank_cd`), then fuses both by reciprocal rank with k = 60. Each hit says which search found it, so the UI can label "mot exact" or "sens proche".

**Options considered:**
- Full-text query: every term required (`plainto_tsquery`); any term, ranked by how many match (chosen).
- Floor: none, so an unrelated query still returns its nearest passages; a similarity floor on the vector side (chosen); a floor on the fused score, which rank fusion makes meaningless.
- Floor value: 0.4, measured (chosen), to recalibrate on the evaluation set.

**Why:** Legal queries turn on exact terms that vectors blur. Measured on the real corpus with MiniLM, "loyers d'hotels" (typed without the accent) has a top vector similarity of 0.41 and a second of 0.21, while full text finds exactly the 2 passages naming hotel rents. Requiring every term fails on questions: a question rarely shares every word with its answer. The 0.4 floor comes from 12 calibration queries, not from the evaluation set. Relevant queries scored a top-1 similarity of 0.41 to 0.64. Unrelated ones scored 0.14 to 0.36, except "congés payés des salariés" (0.69), which Article 53 does cover. Full-text matches are not floored: a match on a word is a fact the UI states as "mot exact". A query can therefore return a passage sharing one ordinary word (for example "Tunis").

**Result:** `app/corpus/retrieval.py`, migration `9e4b6f2c8d13` (creates `unaccent`, backfills existing chunks). The recall target stays unmeasured until the question set exists (D-033). Floor and fusion constants are documented defaults in `app/config.py`.

---

## D-036 - Corpus endpoints serve verified passages only

**Date:** 2026-09-13

**Decision:** RAG step 7, from `docs/feature-research.md` section 5.5. It adds `GET /corpus/search`, `/corpus/chunks/{id}`, `/corpus/sources`, `/corpus/verification-queue` and `GET /findings/{id}/related`.
- Passage models require the verifier and date, so an unverified chunk cannot serialize.
- An unverified chunk id answers 404 exactly like a missing one.
- The queue carries references and official page links, never text.
- Excerpts mark matched terms with the control characters U+0002 and U+0003, which tests show never occur in the corpus.

Three departures from the plan:
1. The full-text column uses a text search configuration, `chahed_french` (unaccent, then French stemming), generated from `text`. This replaces D-035's `to_tsvector('french', unaccent(text))` computed by the loader.
2. Related texts leave out the citation by comparing text: a passage whose text, or whose opening sentence of at least 40 characters, appears verbatim in the rule's citation. Rule files do not gain `paragraph_ref`.
3. The queue is in document order, and search has no `source_id` filter.

**Options considered:**
- Accent folding: `unaccent()` around the text at insert, as in D-035; folding inside a text search configuration (chosen).
- Leaving out the citation: a `paragraph_ref` added to every rule file and the `rule` table; comparing chunk text with the verbatim citation (chosen).
- Queue order: ranked by retrieval and evaluation hits; document order (chosen).

**Why:**
- Folding: with `unaccent()` outside, `ts_headline` stems the stored "hôtels" differently from the query "hotels" and marks nothing. With folding inside the configuration, the stored text keeps its accents and the highlight lands on "hôtels" (measured). `to_tsvector` with an explicit configuration is immutable, so the column becomes a generated column and the loader no longer computes it.
- Citation: the verbatim citation is already the verified reference, so comparing text needs no schema change and no new field in person-verified rule files. On the real corpus it leaves out exactly `Article 52, I` and `Article 52, I, a)` for `CIRPPIS-ART52-I-A` (tested). A dashed item inside a) that the citation does not quote, such as the reduced rate, stays a related text.
- Queue order: there is no search log and no question set to rank by yet.
- Source filter: there is one source. Add the filter when a second source is loaded.

**Result:** migration `b5d8e2a4c617`, `app/api/v1/corpus.py`, `app/corpus/related.py`, wire types in `web/lib/api-types.ts`. With one verified passage today, search and related texts return almost nothing until people verify more (D-032). The UI steps (RAG steps 8 to 11) stay behind the phase 1 gate: no question set, recall unmeasured (D-033).

---

## D-037 - Verified-only search ranks verified passages; short query terms dropped

**Date:** 2026-09-13

**Decision:** Two corrections to D-035 and D-036, found by running the endpoints on the real corpus and register.
- With `verified_only`, both candidate searches rank verified chunks only. Before, both searches ranked the whole corpus and unverified chunks were removed after fusion.
- Full-text queries OR only the stemmed terms of at least 3 characters (`TEXT_QUERY_MIN_LEXEME_CHARS`).

**Options considered:**
- Verified filter: after fusion over the whole corpus, as `docs/feature-research.md` section 5.3 draws it; inside each candidate search (chosen). Evaluation still ranks the whole corpus.
- Short terms: keep them; a stop-word dictionary file installed on the database server; a length cut on query terms (chosen).

**Why:**
- The plan's order drops a verified passage that a search ranks below 20 unverified chunks, so the API answered that nothing verified matched when something did. With 1 verified passage out of 78, that was the common case: the query "impot sur les societes retenue" returned `Article 52, I` labelled "sens" although it contains the words.
- The database's French stop-word list keeps "les" (stemmed `le`), and folding accents before stemming turns "à" into `a`. ORed, `le` matched 46 of 78 chunks and was highlighted in excerpts. A stop-word file would need access to the database server's file system, which neither compose nor a managed database guarantees.
- The length cut also drops `is`, `rs` and one- and two-digit numbers. In this corpus those come almost only from amendment notes (`lf` appears in 54 chunks). It is marked as a known ceiling in the code.

**Result:** `app/corpus/retrieval.py`. Tests cover a verified paragraph outranked by 25 unverified items, and the terms of a sample query.

## D-038 - Gate-independent features proceed while the phase 1 recall gate stays open

**Date:** 2026-09-13

**Decision:** The phase 1 gate is not met: the recall target cannot be measured until team members write `corpus/eval/questions.json` (D-033). Work continues on features whose code depends neither on retrieval quality nor on hero documents, in this order, each on its own branch from `docs/v2-scope-and-architecture` and merged back into it:
1. J1 decision trace
2. J8 queue naming missing facts
3. J7 schema errors on the field, with C3 export arithmetic
4. A1 masking before provider calls, with the J5 masked text view

The RAG UI (steps 8 to 11) and hero-document work (B1, J3) stay behind the gate.

**Options considered:**
- Build gate-independent features and log the exception (chosen).
- Waive the gate and follow plan order, generating fictitious hero invoices.
- Stop feature work until the question set exists.

**Why:** Chosen by the user. The recall gate protects features that show retrieved text; none of these four shows retrieved text or needs a measured retrieval score. Every one is in the pitch's Must or Strong tier (`docs/feature-research.md` section 6.3), so building them now shortens the path to the demo without weakening what the gate guards.

**Result:** The phase 1 gate is still open and still reported as not met. The question set remains person time for the team.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated decision log from description-projet-v2.md, D-001 through D-015 |
| 2026-09-12 | team | Added D-016: derived hours figure for the mandatory Agency Benefit slide |
| 2026-09-12 | team | Added D-017: api/ scaffold deviations (Python 3.12 pin, embedding dimension default) |
| 2026-09-12 | team | Added D-018: resolved D-012, verified OpenRouter embeddings work, kept local default |
| 2026-09-12 | team | Added D-019: found and added the real DGI TEJ XSD schema to schemas/ |
| 2026-09-12 | team | Added D-020: RNE re-checked, reachable now but account-gated, not network-gated |
| 2026-09-12 | team | Added D-021: sourced real legal text into corpus/sources/, fixed a real chunking bug |
| 2026-09-12 | team | Added D-022: web UI data flow, tokens and typography, assumed response shapes |
| 2026-09-12 | team | Added D-023: answer-first file review with a side rail |
| 2026-09-12 | team | Added D-024: web and api integration, minimal backend extensions |
| 2026-09-13 | team | Added D-025: configurable host port for the compose database |
| 2026-09-13 | team | Added D-026: first registered rule, Article 52(I)(a) cited from the DGI 2026 edition |
| 2026-09-13 | team | Added D-027: Article 62 does not match the anchor case; found real candidates |
| 2026-09-13 | team | Added D-028: withholding-code proposal engine (RS2 family) |
| 2026-09-13 | team | Added D-029: only verified legal text on screen, explanations approved by a person |
| 2026-09-13 | team | Added D-030: plan scope includes every researched feature, phases 6 to 9 added |
| 2026-09-13 | team | Added D-031: corpus chunked by paragraph from the official PDF, with page provenance |
| 2026-09-13 | team | Added D-032: verified passage register applied on every corpus load |
| 2026-09-13 | team | Added D-033: retrieval evaluation harness, recall target 0.9 until the team fixes one |
| 2026-09-13 | team | Added D-034: embedding model kept until the comparison can be measured |
| 2026-09-13 | team | Added D-035: hybrid retrieval, full-text and vector search fused by reciprocal rank |
| 2026-09-13 | team | Added D-036: corpus endpoints serve verified passages only; accent-folding configuration, citation left out by text |
| 2026-09-13 | team | Added D-037: verified-only search ranks verified passages; short full-text query terms dropped |
| 2026-09-13 | team | Added D-038: gate-independent features (J1, J8, J7 with C3, A1 with J5) proceed while the recall gate stays open |
