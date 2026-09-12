# Plan - Source of Truth

This document is the source of truth for what we build and why, for Hack4Justice 2026 Challenge A. The outcome is a 3-minute pitch and a live demo. Everything built serves one of the demo moments in section 6 or it does not get built.

## 1. The problem

The overwhelming majority of Tunisian MSMEs have no in-house accountant and no budget for legal counsel (see `docs/facts.md`, status: to verify). They still must produce accurate declarations and certificates every month and at every supplier payment.

They make mistakes. Not fraud - confusion.

Each error costs the administration more than it costs the business: the business pays a penalty once. The DGI processes the corrected declaration, investigates the cross-check inconsistency the error created, absorbs the resulting support call, and sometimes manages a dispute. One error prevented at the source removes several downstream interventions.

> Every error a business makes costs the administration more than it costs the business.

### What we treat and what we refuse to treat

Fiscal problems fall into four families. We deliberately address two of them.

| Family | What it is | Treated? |
|---|---|---|
| **Missing** | Businesses that should declare and do not | No - requires the DGI's internal database |
| **Erroneous** | Declaration produced, but with errors: wrong code, wrong id, wrong amount | **Yes** |
| **Fraudulent** | Deliberate fraud: false invoices, hidden income | No - requires investigation and enforcement |
| **Confused** | Taxpayers who want to comply and cannot manage it | **Yes** |

This split is a choice, not a limitation we are stuck with. A fraud-detection tool is fiscal policing. A tool that stops honest people from being penalized for confusion is a different thing, and it is ours (`docs/decision-log.md` D-003).

## 2. The anchor case: article 62

A prestataire did real work. They cannot be paid because the withholding certificate for the payment is wrong - the wrong code was selected. Article 62 (`docs/facts.md`, to verify) governs this. One person, one harm, one resolution.

This is the human entry point. The technical core underneath it is: select the correct withholding-tax code among several dozen (`docs/facts.md`: exact count to be verified, do not state "more than 40" until counted).

### Why this case and not another

- The monthly declaration (VAT, withholding, TFP, FOPROLOS, stamp duty) is the most repeated error surface in the country, but every accounting package already covers it.
- Electronic invoicing (TEIF) touches a huge population at once, but it is plumbing, an adoption problem, not an intelligence problem.
- Withholding code selection requires three facts about the supplier that appear nowhere on the invoice: their fiscal regime, their status, and the real nature of the service performed. That is an information-retrieval problem with a correct answer - exactly the shape a retrieval-augmented system is built for.

It is also current: the obligation has been in force for about eight months, and DGI doctrine was updated days before the hackathon (`docs/facts.md`: both to verify, and the doctrine update's content specifically must be known precisely before presenting).

### Positioning

e-Tafakna (Tunis, founded circa 2022, `docs/facts.md`: to verify) covers legal documents between private parties: contract templates, e-signature, risk-clause analysis. It does not touch fiscal compliance, declarations, the DGI, or an officer-facing view.

> Legal documents are covered in Tunisia. Fiscal compliance with the administration is not.

We do not replace E-Sit-Fisc or any existing filing channel. We feed those systems clean data before it enters them.

We do not do supplier reputation checks or scoring (`docs/decision-log.md` D-007): practitioners interviewed attach no value to it.

## 3. Roles

Three roles. Full detail in `docs/architecture.md` section 2.

- **MSME owner / accountant** - uploads the payment file, reads the proposed code and its citation, sees abstentions with the named missing fact.
- **Officer** - works a queue of pre-qualified files, validates or flags. Never edits a file directly.
- **Admin** - manages the rule registry and the corpus.

The officer pre-qualifies and validates; the human is never removed from the loop (`docs/decision-log.md` D-008). This is the answer to "who is responsible in case of error."

## 4. How a file moves through the system

1. **Ingestion** - the business uploads its payment file (PDF or scan). OCR and structured extraction pull out parties, tax ids, the service description, amounts, and fiscal mentions.
2. **Code decision** - the system queries a document base built from the official DGI code list and the articles that govern them, then proposes the applicable code.
3. **Proof** - every conclusion carries the exact article retrieved, one click away. Not a model assertion: a verifiable citation.
4. **Abstention** - when the available information cannot decide, the system says so and names what is missing.
5. **Restitution** - the pre-qualified file goes to the officer, who sees what was already verified and validates or flags without starting from zero.

Full pipeline and data model: `docs/architecture.md` sections 3-4.

**The click to the citation is the pitch.** It is what separates this from a model that guesses, and it is the condition for an administration to trust it.

Design law, carried from the root `CLAUDE.md`: compliance judgement is deterministic code. The model extracts facts, explains, and drafts. It never decides whether a finding exists. Assisted rules are the one nuance - the model supplies a fact the document does not state, with a confidence score, and the deterministic rule judges from that fact. When the model cannot establish the fact, the rule escalates a specific question to a human. It never guesses (`docs/decision-log.md` D-004, D-005).

## 5. Counterparty verification

We check the supplier's RNE registration facts: existence, identifiers, status. We do not score or rank suppliers (`docs/decision-log.md` D-007). What we cannot know from RNE data is stated as such, not inferred.

## 6. Demo moments

Every build decision is tested against whether it serves one of these:

1. Upload the article 62 hero document, watch extraction populate the fields live.
2. The proposed withholding code appears with its citation; click through to the verbatim article text.
3. A second hero document triggers an abstention: the system names the exact missing fact instead of guessing.
4. The officer queue shows the pre-qualified file with what has already been checked; the officer validates in one action.
5. The validated file exports as TEJ XML and passes XSD validation live, on stage.

## 7. Impact measurement

We measure errors prevented, not time saved. Time saved is generic; every project claims it (`docs/decision-log.md` D-009).

**Pilot level**
- First-submission compliance rate, before and after.
- Errors intercepted per file, each with its citation.
- Downstream interventions removed: corrected declaration, cross-check investigation, support call.

**National projection**

Annual certificate volume x observed error rate x interventions per error. The calculation is shown openly on the slide, every input sourced in `docs/facts.md`. A visible calculation with a modest result is more convincing than a large unexplained number, especially in front of an officer who knows the real figures.

### Agency Benefit slide (mandatory)

The hackathon brief requires one slide, titled "The Agency Benefit," stating exactly how many manual hours, paper processes, or queue delays the agency saves per month. This is a derived conversion of the pilot-level calculation above, not a new headline metric (`docs/decision-log.md` D-016): errors prevented stays the primary claim, and this slide answers the brief's specific required sentence with a number traceable back to it.

Formula: downstream interventions removed per month x average officer time per intervention = officer hours saved per month.

- Downstream interventions removed per month: errors intercepted per file x interventions per error x monthly file volume (pilot level, above).
- Average officer time per intervention (corrected declaration / cross-check investigation / support call): sourced from DGI process documentation where available; otherwise a labelled estimate, per the estimates rule in `docs/facts.md`.

The slide shows the errors-prevented calculation and the derived hours figure together, so the hours number is never presented without the calculation that produced it.

## 8. Build phases and gates

Phases are sequential. Do not start a phase until the previous gate is met. When a gate is at risk, cut from section 9, do not slip the gate.

| Phase | Scope | Gate to advance |
|---|---|---|
| 0. Foundations | Repo scaffold, `web/` and `api/` skeletons, config modules, database schema, corpus source collection started | `docs/architecture.md` reviewed, first migration applies cleanly |
| 1. Corpus and rules | DGI code list and governing articles chunked and embedded; first rule registry entries with verified citations | At least the article 62 rule has a citation with status `verified` in `docs/facts.md` |
| 2. Extraction | OCR + structured extraction on the hero documents; masking step in place | Hero document (article 62 case) extracts all required fields correctly |
| 3. Decision + retrieval | Retrieval-backed code proposal with citation; abstention path implemented | Demo moments 1-3 work end to end on the hero documents |
| 4. Officer + export | Officer queue, validate/flag actions, TEJ export with XSD validation | Demo moments 4-5 work end to end; export validates against the published schema |
| 5. Polish | Design tokens applied, motion pass, remaining background/fixture files generated | Full demo script runs without a manual workaround |

## 9. Risks and cut list

Risks: unverified facts reaching a slide (mitigated by the facts register, D-015); the DGI doctrine update changing something we have not accounted for (must be checked, not assumed, before presenting); OCR quality on scanned (not born-digital) documents; retrieval returning the wrong article for an edge-case code.

Cut list, in order, if a gate is at risk: admin role UI (manage rules via seed/migration instead), background/generated fixtures beyond the hero set, motion polish beyond the one orchestrated moment, counterparty check (keep the pipeline defensible without it, state it as next).

Do not cut: the citation click-through, the abstention path, or the deterministic/assisted rule split. These are the product's argument, not decoration.

## 10. Before presenting

From `docs/facts.md`, promote to `verified` before the pitch, or drop the claim:

- Exact entry-into-force date of the obligation.
- Real count of withholding codes (do not say "more than 40" until counted).
- What the latest DGI doctrine update actually changed.
- Source for the proportion of MSMEs without an accountant, or fall back to "the overwhelming majority" (free, uncontestable, already in this document).

## 11. Q&A preparation

**Where do the documents go?** Local OCR and extraction; only masked text crosses to the hosted model, and only for the steps that need it (`docs/decision-log.md` D-013).

**Who is responsible in case of error?** The system pre-qualifies, the officer decides. The human is never removed from the loop (`docs/decision-log.md` D-008).

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated plan from description-projet-v2.md, scoped to withholding-code decision plus export and counterparty check |
| 2026-09-12 | team | Added Agency Benefit slide subsection to section 7, per D-016 |
