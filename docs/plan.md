# Plan - Source of Truth

This document is the source of truth for what we build and why, for Hack4Justice 2026 Challenge A and the pilot that follows it. The hackathon outcome is a 3-minute pitch and a live demo. Everything built serves one of the demo moments in section 6 or a feature listed in section 12, or it does not get built (`docs/decision-log.md` D-030).

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

This case is also why the pipeline now extracts structured fiscal facts (supplier and client identity, amounts, withholding rate) instead of only the document's raw text, and why the export form arrives pre-filled from them: it is the same fact base the rule engine already needs to decide and cite a code, read once instead of retyped by the officer. It is not the monthly declaration this section rejects above, and not an invoicing or treasury feature: no declaration roll-up across documents exists, and none is planned (`docs/decision-log.md` D-043, D-045).

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

Only legal text a person has verified reaches a screen. Retrieved passages are filtered to the verified set, and a model-drafted explanation appears only after a person has approved it (`docs/decision-log.md` D-029).

Design law, carried from the root `CLAUDE.md`: compliance judgement is deterministic code. The model extracts facts, explains, and drafts. It never decides whether a finding exists. Assisted rules are the one nuance - the model supplies a fact the document does not state, with a confidence score, and the deterministic rule judges from that fact. When the model cannot establish the fact, the rule escalates a specific question to a human. It never guesses (`docs/decision-log.md` D-004, D-005).

## 5. Counterparty verification

We check the supplier's RNE registration facts: existence, identifiers, status. We do not score or rank suppliers (`docs/decision-log.md` D-007). What we cannot know from RNE data is stated as such, not inferred.

Access goes through the RNE's official data-exchange channel, a partnership step scheduled in phase 9 (section 12, E1).

## 6. Demo moments

Every pre-pitch build decision is tested against whether it serves one of these. Feature ids refer to section 12. The timed script is in `docs/feature-research.md` section 6.5.

1. Upload the article 62 hero document and watch extraction populate the fields live, each field outlined where it was read on the page (J3). The text sent to the model is shown with personal identifiers masked (J5).
2. The proposed withholding code appears with its citation and its decision trace (J1): which fact was read in the document, which was supplied by the model with its confidence, and what the rule decided. Click through to the verbatim article and to the official page it comes from (J2). A person-approved plain-language explanation sits beside it (J6).
3. A second hero document triggers an abstention: the system names the exact missing fact instead of guessing. The presenter answers the question in the file and the rule decides (J4).
4. The officer queue shows the pre-qualified file with the missing facts named (J8); the officer validates in one action.
5. The validated file exports as TEJ XML. A wrong field is explained in French on the field (J7), corrected, and the export passes XSD validation live, on stage.
6. The impact panel shows the system's own counts on the demo dataset and the derived agency benefit, every estimate labelled (J9).

Built and ready for Q&A, outside the three minutes: legal search (J10) and supplier memory (J11).

## 7. Impact measurement

We measure errors prevented, not time saved. Time saved is generic; every project claims it (`docs/decision-log.md` D-009).

**Pilot level**
- First-submission compliance rate, before and after.
- Errors intercepted per file, each with its citation.
- Downstream interventions removed: corrected declaration, cross-check investigation, support call.

These are recorded by the measurement dashboard (F1); the demo shows its first version (J9).

**National projection**

Annual certificate volume x observed error rate x interventions per error. The calculation is shown openly on the slide, every input sourced in `docs/facts.md`. A visible calculation with a modest result is more convincing than a large unexplained number, especially in front of an officer who knows the real figures.

### Agency Benefit slide (mandatory)

The hackathon brief requires one slide, titled "The Agency Benefit," stating exactly how many manual hours, paper processes, or queue delays the agency saves per month. This is a derived conversion of the pilot-level calculation above, not a new headline metric (`docs/decision-log.md` D-016): errors prevented stays the primary claim, and this slide answers the brief's specific required sentence with a number traceable back to it.

Formula: downstream interventions removed per month x average officer time per intervention = officer hours saved per month.

- Downstream interventions removed per month: errors intercepted per file x interventions per error x monthly file volume (pilot level, above).
- Average officer time per intervention (corrected declaration / cross-check investigation / support call): sourced from DGI process documentation where available; otherwise a labelled estimate, per the estimates rule in `docs/facts.md`.

The slide shows the errors-prevented calculation and the derived hours figure together, so the hours number is never presented without the calculation that produced it.

## 8. Build phases and gates

Phases are sequential. Do not start a phase until the previous gate is met. When a gate is at risk, cut from section 9, do not slip the gate. Phases 0 to 5 end at the pitch; phases 6 to 9 follow it (`docs/decision-log.md` D-030). Retrieval, verification and UI detail for each feature: `docs/feature-research.md`.

| Phase | Scope | Gate to advance |
|---|---|---|
| 0. Foundations | Repo scaffold, `web/` and `api/` skeletons, config modules, database schema, corpus source collection started | `docs/architecture.md` reviewed, first migration applies cleanly |
| 1. Corpus and rules | DGI code list and governing articles chunked by paragraph with page references, embedded, and searchable by hybrid retrieval; verified passage register; retrieval evaluation set; first rule registry entries with verified citations (RAG steps 1 to 7) | At least the article 62 rule has a citation with status `verified` in `docs/facts.md`; retrieval meets the recall target on the evaluation set |
| 2. Extraction | OCR and field-level extraction on the hero documents (B1); masking step in place (A1); field positions on the page (J3); masked text view (J5) | Hero document (article 62 case) extracts all required fields correctly; the text sent to the model contains no personal identifier |
| 3. Decision + retrieval | Retrieval-backed code proposal with citation; abstention path; decision trace (J1); citation provenance and source reader (J2); abstention answered in the file, with confirmed supplier facts stored (J4, B3 and B4 on the hero set); approved explanations (J6) | Demo moments 1-3 work end to end on the hero documents |
| 4. Officer + export | Officer queue naming missing facts (J8), validate/flag actions, TEJ export with XSD validation, field-level French errors and arithmetic checks (J7, C3) | Demo moments 4-5 work end to end; export validates against the published schema |
| 5. Polish | Design tokens applied, motion pass, impact panel (J9), legal search (J10), supplier memory (J11), remaining background/fixture files generated, recorded fallback run | Full demo script (`docs/feature-research.md` section 6.5) runs without a manual workaround |
| 6. Pilot prerequisites | Masking on every provider call (A1), audit trail (A2), identities and roles (A3), data protection readiness (A5), field extraction beyond the hero set (B1), export arithmetic (C3), measurement dashboard (F1); asynchronous pipeline (A6) once volume requires it | Masking demonstrated on real files; every pipeline step audited; fields pre-fill the export; pilot metrics recorded |
| 7. Real coverage | TEJ code decisions for RS1, RS2 and RS7 (B2), supplier fact profile (B3), abstention loop with the officer's request for information (B4), rule versioning (B5), TEJ corrections and cancellations (C1), monthly batching (C2), all identifier types (C4), flag reasons as rule tests (F2), admin texts page and rule-author aid (RAG step 11) | The most frequent MSME code groups are decided or abstained with verified citations; a month files as one declaration |
| 8. Structured inputs | TEIF ingestion (D1), invoice-to-certificate reconciliation (D2), legal source watch (B7), queue triage (F3), phone capture (G3), Arabic sources and grounded assisted facts (RAG steps 12 and 13) | TEIF input reconciled against certificates; a source change alerts an admin and resets the affected verifications |
| 9. Partnerships | RNE data exchange (E1), public-buyer payment readiness (E2), accountant delegation (A4), DigiGo and Mobile ID sign-in (A3), Arabic interface (G1) | RNE convention signed; sign-in through DigiGo; Arabic interface shipped |

## 9. Risks and cut list

Risks:
- unverified facts reaching a slide (mitigated by the facts register, D-015)
- the DGI doctrine update changing something we have not accounted for (must be checked, not assumed, before presenting)
- OCR quality on scanned (not born-digital) documents
- retrieval returning the wrong article for an edge-case code
- verification throughput: every passage and explanation shown needs a person (D-029)
- partnerships (RNE, TunTrust) that the team does not control

Cut list for phases 0 to 5, in order, if a gate is at risk:
1. admin role UI (manage rules via seed/migration instead)
2. background/generated fixtures beyond the hero set
3. motion polish beyond the one orchestrated moment
4. the Q&A backups (J10, J11)
5. approved explanations (J6)
6. evidence outlines on the page (J3) - built, per D-055; no longer a candidate cut
7. the masked text view (J5)
8. the impact panel (J9), falling back to the slide
9. counterparty check (scheduled in phase 9; state it as next)

Do not cut:
- the citation click-through
- the abstention path
- the deterministic/assisted rule split
- verified-only legal text on screen (D-029)

These are the product's argument, not decoration.

In phases 6 to 9, an item blocked by an external party (RNE, TunTrust, DGI) is deferred to the next phase and recorded in `docs/decision-log.md`; the rest of the gate still holds.

## 10. Before presenting

From `docs/facts.md`, promote to `verified` before the pitch, or drop the claim:

- Exact entry-into-force date of the obligation.
- Real count of withholding codes (do not say "more than 40" until counted).
- What the latest DGI doctrine update actually changed.
- Source for the proportion of MSMEs without an accountant, or fall back to "the overwhelming majority" (free, uncontestable, already in this document).

Also check, per `docs/feature-research.md` section 3:

- What E-Sit-Fisc actually is, before the positioning line in section 2 is spoken.
- Which article anchors the story: the IRPP/IS code's Article 62 does not match (D-027, candidates Article 52(I)(a) and Article 55(I)); Article 62 of the 2014 finance law is a further candidate.
- That every legal passage and explanation visible in the demo script is verified or approved (D-029).

## 11. Q&A preparation

**Where do the documents go?** Local OCR and extraction; only masked text crosses to the hosted model, and only for the steps that need it (`docs/decision-log.md` D-013).

**Who is responsible in case of error?** The system pre-qualifies, the officer decides. The human is never removed from the loop (`docs/decision-log.md` D-008).

## 12. Feature scope

Every feature below is in scope (`docs/decision-log.md` D-030). Detail, evidence and design-law notes: `docs/feature-research.md` sections 4 to 6. Phases: section 8.

- **Pilot prerequisites:** A1 masking before provider calls, A2 audit trail, A3 identities and roles (then DigiGo and Mobile ID), A4 accountant delegation, A5 data protection readiness, A6 asynchronous pipeline.
- **Rule coverage:** B1 field-level extraction, B2 TEJ code decisions, B3 supplier fact profile, B4 abstention resolution loop, B5 rule versioning by effective date, B6 retrieval-augmented legal context (the RAG plan, `docs/feature-research.md` section 5), B7 legal source watch.
- **Export and filing:** C1 corrections and cancellations, C2 monthly batching, C3 export arithmetic and VAT, C4 all beneficiary identifier types.
- **E-invoicing:** D1 TEIF ingestion, D2 invoice-to-certificate reconciliation.
- **Counterparty and public buyers:** E1 RNE data exchange, E2 public-buyer payment readiness.
- **Officer side:** F1 measurement dashboard, F2 flag reasons as rule tests, F3 queue triage.
- **Reach:** G1 Arabic interface, G2 plain-language explanations (part of B6), G3 phone capture.
- **Demo:** J1 decision trace, J2 official page one click away, J3 evidence on the document, J4 abstention answered live, J5 masked text view, J6 approved explanation, J7 schema errors on the field, J8 queue naming missing facts, J9 impact panel, J10 legal search, J11 supplier memory.

Out of scope, with reasons in `docs/feature-research.md` section 7:
- supplier or fraud scoring
- automatic submission to TEJ
- model-computed rates
- TEIF issuance
- a general legal chatbot
- generating certificate PDFs

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated plan from description-projet-v2.md, scoped to withholding-code decision plus export and counterparty check |
| 2026-09-12 | team | Added Agency Benefit slide subsection to section 7, per D-016 |
| 2026-09-13 | team | Scope extended to every researched feature: demo moments extended with a sixth, phases 6 to 9, cut list, before-presenting checks, feature scope section, per D-030; verified-only legal text on screen, per D-029 |
| 2026-09-13 | team | Added a paragraph to section 2: structured fiscal extraction feeds the existing pipeline, not a declaration or treasury feature, per D-043 and D-045 |
| 2026-09-13 | team | J3 (evidence outlines on the page) built rather than cut, per D-055; cut list item 6 marked done |
