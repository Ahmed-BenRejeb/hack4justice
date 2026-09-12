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

## D-017 - Web UI: client-side data through a thin proxy, fixed tokens, assumed response shapes

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

## D-018 - Answer-first file review with a side rail

**Date:** 2026-09-12

**Decision:** Both file review screens (MSME and officer) lead with a result banner: proposed code, number of missing facts, extracted fields, and RNE status. The main column holds the cited findings, then the extracted fields. A side rail holds the officer's decision and export (officer), progress as a vertical step list, and the RNE check. The separate "already checked" card is replaced by the banner. The extraction table marks only assisted facts, with a visible legend instead of a tooltip.

**Options considered:**
- Answer first with a side rail.
- A result banner followed by tabs (Constats, Informations, Fournisseur, Suite).
- A single column, reordered, with extracted fields collapsed by default.

**Why:** The first version put the answer below a long extraction table and repeated the same fact in several places. Tabs would hide content the presenter must show during the demo. A rail keeps every element visible while cutting the scroll length, and it puts the officer's one action next to the evidence.

**Result:** `components/shared/result-banner.tsx`, `review-layout.tsx` and `file-header.tsx` added; `prequalification-summary.tsx` removed; unused shadcn primitives (dialog, sheet, progress, separator, tooltip) removed. `docs/design.md` section 4 updated.

---

**Note on the root `CLAUDE.md`:** D-010 and D-014 change facts the root guide currently states as settled (a single TypeScript tree; one config module repo-wide). That file is binding and is not edited as a side effect of this documentation pass; the edit is proposed to the user as a follow-up.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated decision log from description-projet-v2.md, D-001 through D-015 |
| 2026-09-12 | team | Added D-016: derived hours figure for the mandatory Agency Benefit slide |
| 2026-09-12 | team | Added D-017: web UI data flow, tokens and typography, assumed response shapes |
| 2026-09-12 | team | Added D-018: answer-first file review with a side rail |
