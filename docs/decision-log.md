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

## D-022 - Article 62 does not match the anchor case; real candidates found

**Date:** 2026-09-13

**Decision:** `docs/facts.md` already flagged D-002's anchor citation ("Article 62 ... exact text pending") as unverified. Now that the Code de l'IRPP et de l'IS is fully available (D-021), checked it directly: **the real Article 62 in this code governs bookkeeping/accounting record obligations (who must keep formal accounts), not withholding certificates or code selection.** It does not match the anchor case ("a prestataire unpaid because the wrong withholding code was selected on the certificate").

Two real articles in the same code do match the narrative:
- **Article 52(I)(a)** sets the rates and payment categories (honoraires, commissions, courtages, loyers) that determine which withholding code applies. This is what `app/rules/cirppis_art52_honoraires.py` and `app/rules/withholding_code_proposal.py` are grounded in.
- **Article 55(I)** requires the debtor to deliver a "certificat de retenue" to the beneficiary at each payment, naming its required fields (identity, gross amount, withholding amount, net amount), and states it is issued "a travers une plateforme electronique mise en place par le ministere des finances" (added by decret-loi n. 2021-21, 2021-12-28) - this is almost certainly a direct reference to the TEJ platform itself.

**Options considered:**
- Leave "Article 62" in `docs/plan.md` unquestioned, since it was already marked `to verify` and not yet used on any real citation.
- Check it directly now that the source is available, since building further on an unverified anchor risks the whole pitch narrative citing the wrong article on stage.

**Why:** `docs/facts.md`'s own rule: "no fact on a slide or on screen that is not in docs/facts.md with status verified. Article numbers are checked by a person against the official source, never recalled from memory." "62" was never checked against the official source by anyone; it appears to have been a placeholder. Finding this now, before it reaches a slide, is exactly what the facts register is for.

**Result:** No file citing "Article 62" as a real rule exists yet (the fixture fixtures/test data using "article 62" is fixture-only, not a real citation, and is unaffected). `docs/facts.md`'s Article 62 row is updated with this finding. `docs/plan.md` section 2's anchor case still names "Article 62"; changing the pitch narrative's anchor citation is the team's call, not something to rewrite unilaterally. Candidate replacement: Article 55(I) for the certificate-delivery obligation, Article 52(I)(a) for the code-selection mechanism, both `to verify` pending a person confirming the verbatim text and the platform reference.

---

## D-023 - Withholding-code proposal engine (RS2 family)

**Date:** 2026-09-13

**Decision:** Built `app/rules/withholding_code_proposal.py`, docs/plan.md section 2's stated "technical core": given a document's text, propose which of the real 36 TEJ withholding codes (D-019) applies. Scoped narrowly to the honoraires/commissions/courtages family (RS2_000001 vs RS2_000002, distinguished by the beneficiary's fiscal regime, forfait d'assiette vs regime reel), the same family Article 52(I)(a) and the Article 62 investigation (D-022) both point to. Any other category (loyers, capitaux mobiliers, cessions, and so on) abstains by name; none of those are modeled yet.

**Options considered:**
- Attempt to cover all 36 codes now, for a more complete demo.
- Cover one real, narrow, well-understood family first, abstaining explicitly outside it.

**Why:** The other code families involve legally distinct, more complex conditions (residency, establishment, capital gains treatment) that were not part of this session's sourced text and would risk exactly the kind of guessed legal content the root CLAUDE.md rule forbids. A correct narrow proposal with honest abstentions elsewhere demonstrates the mechanism (demo moment 2: "the proposed withholding code appears with its citation") without overclaiming coverage.

**Result:** `app/rules/withholding_code_proposal.py` and its tests (tested live against the real model). Not yet a registered rule, same as D-022's other candidates: needs a human-verified citation before entering `rules/`.

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
| 2026-09-13 | team | Added D-022: Article 62 does not match the anchor case; found real candidates |
| 2026-09-13 | team | Added D-023: withholding-code proposal engine (RS2 family) |
