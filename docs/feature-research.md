# Feature research

Research into the features Chahed will build, researched 2026-09-13 against the repository (commits up to `a11f057`) and public sources. It has three parts:
- a post-hackathon roadmap toward a pilot with a real administration and real MSMEs (sections 1 to 4)
- an implementation plan for a retrieval-augmented generation (RAG) system integrated into the UI (section 5)
- features built for the demo that also have real use (section 6)

Every feature in sections 4 to 6 is in the scope of `docs/plan.md`, which schedules them in phases (D-030). This document holds the detail and the evidence; section 7 lists what stays out. Only verified legal text reaches a screen (D-029).

## How to read this

- Evidence labels:
  - `[repo]` checked in this repository
  - `[measured]` measured on the running code or database on 2026-09-13
  - `[official]` a DGI, ministry, registry or model publisher page
  - `[press]` Tunisian press
  - `[vendor]` a vendor or consultancy page
- Every external claim below is `to verify` in the sense of `docs/facts.md`. None of it goes on a slide or a screen until a person promotes it there.
- Effort: **S** days, **M** one to two weeks, **L** several weeks or blocked on an external party.

---

## 1. Baseline: what exists today

| Area | State | Evidence |
|---|---|---|
| Rule registry | One registered rule, `CIRPPIS-ART52-I-A`. It decides whether a withholding *mention* is present, not which TEJ code applies. A code-proposal engine for the RS2 family exists but is not registered (D-028) | `[repo]` `rules/cirppis-art52-i-a.json`, `api/app/rules/withholding_code_proposal.py` |
| Extraction | One `full_text` field per document. No parties, tax ids, amounts or dates | `[repo]` `api/app/extraction/service.py` |
| Masking before model calls | Not implemented. The Art. 52 rule sends the full extracted text to OpenRouter, contrary to D-013 | `[repo]` no `mask` symbol in `api/app`; `cirppis_art52_honoraires.py:37` |
| Retrieval | Built and tested, but not called anywhere in the pipeline, and it cannot see most of the corpus. The embedding model reads 128 tokens and chunks are whole articles, so only 2% of Article 52 (6,949 tokens) is embedded, and 9% to 19% of Articles 53 to 55 | `[repo]` `corpus/retrieval.search` has no caller; `[measured]` `max_seq_length` 128 |
| Audit trail | `AuditEntry` model exists, never written | `[repo]` no reference outside `db/models.py` |
| Officer actions | `validated` / `flagged` only. "Request more information" (architecture section 2) is not built | `[repo]` `api/app/api/v1/officer.py:75` |
| TEJ export | `AjouterCertificats` only, one document per declaration, beneficiary by matricule fiscal only, `TotalMontantTVA` hard-coded to 0 | `[repo]` `api/app/export/tej.py` |
| TEJ schema freshness | The three files in `schemas/tej/original/` are byte-identical (sha256) to the zip the DGI links in its September 2026 notice, downloaded again 2026-09-13 | `[repo]` + `[official]` jibaya.tn TEJ notice |
| Counterparty (RNE) | Not built, account-gated (D-020) | `[repo]` |
| Auth, roles, tenancy | None. `OFFICER_ID` comes from env | `[repo]` `web/lib/env.ts` |

## 2. What changed around the product

### 2.1 TEJ platform, September 2026 `[official]` `[press]`

The DGI announced four TEJ changes:
- real-time consultation of one's own filing situation
- delegation of TEJ functions to other users
- public enterprises can consult the tax situation of their suppliers
- integration of all withholding certificates

Filers who submit certificates as a file are told to download the updated XSD. Since 1 January 2026, press and vendor sources say all businesses must issue withholding certificates through TEJ regardless of size (`[press]`, `[vendor]`).

### 2.2 E-invoicing extended to services `[press]` `[vendor]`

Article 53 of Law 2025-17 of 12 December 2025 (finance law 2026) extends mandatory electronic invoicing to service providers. Sources describe this as covering liberal professions, telecoms, insurance, hotels and transport, whatever the amount or regime. Invoices use the TEIF XML format, are signed, and are sent to Tunisie TradeNet (El Fatoora). Reported fines are 100 to 500 TND per paper invoice, capped at 50,000 TND. Vendor pages say TEIF carries withholding amounts; the TEIF version and the official XSD location were not found on an official page.

This matters directly: the service invoices that trigger Article 52 withholding now exist as structured XML.

### 2.3 E-Sit-Fisc and Article 62 of the 2014 finance law `[official]`

The DGI's own page describes E-Sit-Fisc as a consultation service for public administrative bodies and public enterprises to view and print their suppliers' tax situation. It is not a filing channel. Its stated legal basis is Article 62 of the 2014 finance law.

A secondary source summarises that article as follows: payments of 1,000 TND or more (VAT included) by the State, local authorities, public bodies and public enterprises to their suppliers require a certificate proving the supplier has filed its due declarations, or has a payment schedule. See section 3 for why this matters to the pitch.

### 2.4 Digital identity `[press]`

Press reports from May 2026 say that from 1 July 2026, Mobile ID (individuals) and DigiGo (companies) become required for online administrative procedures, starting with the RNE. TunTrust offers partners DigiGo authentication and signature by API `[official]`.

### 2.5 RNE data exchange `[official]` `[press]`

The RNE publishes an "Echange des données par API" page (HTTP 503 on 2026-09-13, not read). Search snippets tie it to a Head of Government decree of 13 January 2026 on beneficial-owner information. The press describes RNE, DGI and CNI cooperation on interoperability. The 2025 Hack4Justice edition was organised by HiiL with the RNE and the CDC `[press]`, which is a plausible partnership path to access.

### 2.6 Personal data protection `[press]`

Law 2004-63 is still in force. A 123-article replacement bill was in hearings at the ARP Rights and Freedoms Commission in February and May 2026. Commission members raised AI and algorithms as a gap. One vendor site claims enforcement from 11 July 2026; no official source supports that date, and a lawyer's page explicitly withdrew similar claims. Treat the bill as not adopted.

### 2.7 Competitors `[vendor]`

| Product | What its public page describes | What it does not describe |
|---|---|---|
| Hesabi | Automatic withholding calculation per invoice, TEJ XML, supplier profiles with exemption attestations and expiry, declaration status workflow, e-invoicing | Operation-code selection, legal citation per decision, abstention |
| Aspiss Certificats - TEJ | Certificate management "four in one" | Same |
| Tassaruf, Expert Computer, TSI ERP | TEJ XML generation, offline entry, ERP module | Same |
| Finco | Free withholding calculator, e-invoicing guides | Same |
| Tekru El Fatoora middleware | Open source (Apache 2.0, Node/TypeScript): TEIF generation, NGSign signature, TTN transmission | Not withholding |

The XML file is a commodity. What no public page describes is choosing the code from facts, with the article cited, abstaining when a fact is missing, and giving the officer a view. That is the defensible position.

### 2.8 Demand signal `[official]`

HiiL's Justice Needs and Satisfaction study of Tunisian MSMEs (published 27 November 2025, more than 2,000 business owners) reports:
- more than half faced a serious legal problem in two years
- contract disputes affect 51% of firms with problems
- 9% of formal and 2% of informal firms used any legal support
- around 80% of problems are ongoing or abandoned

OECD work on "tax compliance by design" argues for building compliance into the systems SMEs already use `[official]`.

---

## 3. Incidental findings that affect existing docs

These are not features, but the research surfaced them and they bear on the pitch. Each needs a person to check it and, if confirmed, an update to the named file. `docs/plan.md` section 10 lists them as checks before presenting.

1. **`docs/facts.md` misdescribes E-Sit-Fisc** as "the DGI's existing filing channel". The DGI's own page calls it a supplier tax-situation consultation service for public buyers (2.3). The positioning line "we feed E-Sit-Fisc clean data" does not hold as written.
2. **The anchor "article 62" is not the IRPP/IS code's Article 62**, which governs bookkeeping (D-027, with candidates Article 52(I)(a) and Article 55(I)). This research adds a third candidate: Article 62 of the 2014 finance law describes exactly the plan's story, a supplier whose payment by a public buyer is blocked by a missing certificate. That is a tax-situation certificate, not a withholding certificate. Choosing the anchor is the team's call before it goes on stage.
3. **Masking (D-013) is not implemented** while a live model call already receives the full document text. This affects the prepared Q&A answer "only masked text crosses to the hosted model" (`docs/plan.md` section 11).
4. **The TEJ schema in the repository matches today's official download** (section 1). Half of the `to verify` note on the schema fact is now evidenced; confirming that this zip is the current version remains a human step.

---

## 4. Feature catalogue

Grouped by theme. Each feature states why (with evidence), how it respects the design law, dependencies, and effort.

### A. Pilot prerequisites (trust in the product itself)

**A1. Masking layer before every provider call** - M
- What: replace matricules fiscaux, CIN, names, IBAN, phone numbers and addresses with typed placeholders before `providers/openrouter.py` sees text. Keep the mapping local and store the masked prompt for audit.
- Why: D-013 promises it and section 3.3 shows it is missing. Any administration pilot will ask. The matricule format `\d{7}[A-Z]` is already known from the XSD `[repo]`.
- Design law: no effect on judgement. It narrows what the model sees.
- Depends on: nothing. Lands inside `api/app/extraction/`.

**A2. Write the audit trail** - S
- What: append an `audit_entry` row on upload, extraction, each finding, each model call (masked prompt hash, model id, confidence), officer decision, and export. Show a read-only timeline on the officer file.
- Why: the table exists and is never written `[repo]`. "Who decided what, on which facts" is the answer to D-008's liability question.
- Design law: records that the rule, not the model, produced each finding.

**A3. Real identities and roles** - M, then L for DigiGo
- What: sign-in with roles `msme`, `accountant`, `officer`, `admin`, and organisation-scoped data access. Later, DigiGo for companies and Mobile ID for individuals.
- Why: there is no auth today `[repo]`. DigiGo and Mobile ID are becoming mandatory for administrative procedures (2.4), so a pilot user will already hold one.
- Depends on: a TunTrust partner integration for the DigiGo step.

**A4. Accountant delegation (one user, many MSMEs)** - M
- What: an accountant or cabinet acts for several organisations, with a per-organisation grant the MSME can revoke.
- Why: TEJ itself added delegation in September 2026 (2.1). Most MSMEs without an in-house accountant use an external one, which is the user who uploads in practice.
- Depends on: A3.

**A5. Data protection readiness** - M
- What: a processing register, a retention period per entity (uploads, extractions, masked prompts), a deletion path per organisation, a named contact, and a documented human review of every outcome.
- Why: Law 2004-63 applies now, and a stricter bill under discussion names AI as a concern (2.6). The officer-validates-everything design is already the strongest answer; this makes it demonstrable.

**A6. Asynchronous pipeline** - M
- What: move OCR, extraction and rule evaluation off the upload request into a job queue. The UI already polls `[repo]` (D-022).
- Why: upload currently runs OCR plus a live model call inline `[repo]` `documents.py:90-92`. That is fine for one demo file and not for a month of invoices.
- Trigger: add when pilot volume makes uploads time out, not before.

### B. Rule coverage (the core value)

**B1. Field-level extraction** - M
- What: extract declarant and beneficiary (name, matricule fiscal or CIN, address), invoice number and date, payment date, HT / VAT / TTC amounts, stamp duty, service description, and any withholding mention. Each field gets a confidence and a source span. Validate identifiers against the XSD patterns deterministically.
- Why: every code decision and a pre-filled TEJ form depend on it. The export form is typed by hand today `[repo]`.
- Design law: extraction is the model's job. Validation of formats is code.
- Depends on: A1, and real hero documents in `fixtures/hero/`.

**B2. From "mention present" to "which TEJ code"** - L (bottleneck: verified citations)
- What: a rule family per TEJ operation-code group that outputs a `decided_code` from facts, or abstains naming the missing fact. Start with the groups an MSME meets most (RS1 rents, RS2 fees, RS7 purchases of 1,000 TND or more) and leave dividends, securities and non-residents for later.
- Why: this is the product's thesis (`docs/plan.md` section 2). No competitor page describes it (2.7).
- The decisive facts can be read from the DGI's own code descriptions in `schemas/tej/TEJRSCodesOperations_v1.0.xsd` `[repo]`. They become the vocabulary of named missing facts:

| Code group `[repo]` | Codes | Facts that separate the codes |
|---|---|---|
| RS1 rents | 2 | hotel rent or other rent; beneficiary is a legal person or on the real regime; resident and established |
| RS2 fees, commissions, performance, artists | 4 | BNC flat-rate or real regime; resident and established; performance-based pay; artistic or copyright activity |
| RS3 to RS6 capital income, securities, dividends, disposals | 13 | resident or not; bank or not; privileged-tax territory; natural or legal person; asset type |
| RS7 purchases and telecom commissions | 5 | amount of at least 1,000 TND VAT included; supplier's IS rate (15%, 10%, other) or two-thirds deduction; telecom distributor, natural or legal person |
| RS8 board fees | 3 | resident, non-resident, or privileged-tax territory |
| RS9 non-residents | 8 | established or not; stay of at most 6 months; construction, assembly or other service; royalties; existence declaration filed; privileged-tax territory |
| RS11 betting and lotteries | 1 | none beyond the category |

- Most of these facts are not on an invoice (supplier regime, IS rate, residency). That is why B3 and B4 matter.
- Design law: each code is a deterministic branch over named facts. The model may supply "nature of the service" as an assisted fact with a confidence; everything else is a declared or confirmed fact. Every branch cites a verified article before it is registered.
- Starting point: `api/app/rules/withholding_code_proposal.py` already separates RS2_000001 from RS2_000002 by the beneficiary's fiscal regime (D-028). It enters the registry once its citation is verified.
- Depends on: B1, and a person verifying each governing article (the XSD descriptions are not citations, `schemas/tej/SOURCE.md`).

**B3. Supplier fact profile** - M
- What: a per-supplier record of confirmed facts (regime, IS rate, residency, exemption or regularisation attestation with reference and expiry). Each fact stores who confirmed it, when, and on which document. Rules read the profile before abstaining.
- Why: the same supplier otherwise triggers the same abstention every month. Hesabi already keeps supplier profiles with exemption expiry (2.7).
- Design law: a human-confirmed fact, never a model inference, and never a score (D-007). An expired attestation is a named missing fact.

**B4. Abstention resolution loop** - M
- What: the MSME answers the named question in the file ("régime fiscal du fournisseur ?"), optionally attaching proof. The rule re-runs and the officer sees the answer and its author. Add the officer action "demander un complément" from `docs/architecture.md` section 2.
- Why: abstention is a first-class outcome (D-005), but today it is a dead end `[repo]`.
- Depends on: B3, so an answer is stored once.

**B5. Rule versioning by effective date** - M
- What: rules carry `effective_from` / `effective_to`, and a file is judged by the law in force on its payment date. Loading a new finance law adds versions instead of overwriting.
- Why: rates and scopes change every finance law. The cited Article 52 text itself carries a footnote dating its rate to 1 January 2021 `[repo]`. `load_rules` upserts by code, so history is lost today `[repo]`.

**B6. Retrieval-augmented legal context** - M to L
- The full plan is in section 5.

**B7. Legal source watch** - S
- What: a scheduled job hashes the TEJ schema zip, the corpus source PDFs and the jibaya.tn notes communes listing. On a change, it alerts the admin, marks every rule citing that source as "à revérifier", and returns that source's verified passages to unverified until a person re-checks them.
- Why: the DGI changed TEJ days before the hackathon (2.1) and the plan names doctrine drift as a risk (`docs/plan.md` section 9). The hash comparison in section 1 shows this takes a few lines.

### C. Export and filing

**C1. Complete TEJ declaration lifecycle** - M
- What: support `ModifierCertificats` and `AnnulerCertificats` alongside `AjouterCertificats`, all present in the schema `[repo]` `TEJDeclarationRS_v1.0.xsd:18-44`. Link a correction to the certificate it replaces.
- Why: the erroneous family (D-003) is about fixing wrong certificates, and today the product can only add.

**C2. Monthly declaration batching** - M
- What: group validated certificates by declarant and month into one `DeclarationsRS`. Show the monthly deadline (the 15th for individuals, the 28th for legal entities per DGI calendars reported in the press `[press]`).
- Why: one XML per document `[repo]` does not match how filers deposit a month.

**C3. Export arithmetic and VAT completeness** - S
- What: emit `TauxTVA` / `MontantTVA` and a real `TotalMontantTVA`. Check deterministically that HT + VAT = TTC, withheld + net paid = TTC, and totals equal the sum of operations. Refuse with a named error otherwise.
- Why: `TotalMontantTVA` is always 0 today `[repo]` `tej.py:120`. The XSD checks structure, not arithmetic, so a schema-valid file can still be wrong.

**C4. All beneficiary identifier types** - S
- What: CIN, passport, residence card and foreign tax id, all allowed by the schema's `IdTaxpayer` choice `[repo]` `TEJDeclarationRS_v1.0.xsd:338-342`.
- Why: individual prestataires (the anchor persona) often have no matricule fiscal. `tej.py` hard-codes `MatriculeFiscal` `[repo]`.

### D. E-invoicing convergence

**D1. TEIF invoice ingestion** - M
- What: accept El Fatoora TEIF XML as input next to PDF and scan. Parties, identifiers and amounts are read exactly, with no OCR, and the same rules run.
- Why: service invoices, the ones Article 52 targets, are now mandatory TEIF (2.2). Structured input removes the largest error source (OCR on scans, `docs/plan.md` section 9).
- Depends on: the official TEIF XSD. Vendors cite version 1.8.7, but no official URL was found.

**D2. Invoice-to-certificate reconciliation** - M
- What: for an organisation's month, match paid invoices to withholding certificates. Name each paid invoice with no certificate, each certificate with no invoice, and each amount mismatch.
- Why: this targets the erroneous family directly, and it is the cross-check the plan says costs the administration an investigation (`docs/plan.md` section 1).
- Design law: pure deterministic matching. Each gap cites the obligation to issue a certificate. `[press]` sources cite a 100 to 5,000 TND fine for refusing a certificate under Article 105 CDPF; a person must verify that before registering it.
- Depends on: B1 or D1, and C2.

### E. Counterparty and public buyers

**E1. RNE through the official data-exchange channel** - L (partnership)
- What: registration facts only (exists, identifiers match, status), through the RNE API offer rather than the account-gated public portal (D-020).
- Why: 2.5. The RNE co-organised the previous Hack4Justice edition, which makes a convention a realistic ask.
- Design law: facts, no score (D-007).

**E2. Public-buyer payment readiness file** - M
- What: for a supplier invoicing a public buyer, assemble what a payment of 1,000 TND or more needs under Article 62 LF 2014 (tax-situation or regularisation certificate reference and validity, withholding certificate) and name what is missing before the invoice is sent.
- Why: this is the unpaid-prestataire story told from the supplier's side (section 3.2). Public enterprises now check supplier status in TEJ (2.1), so the supplier benefits from arriving complete.
- Design law: a checklist over documents held, citing the article. It never predicts whether a buyer will pay.
- Depends on: verifying Article 62 LF 2014's text, and B3 for attestation expiry.

### F. Officer and administration side

**F1. Pilot measurement dashboard** - M
- What: per period and rule:
  - files received
  - findings and abstentions, with the most frequent missing facts
  - first-submission compliance rate
  - flags by reason
  - corrections avoided
- Why: `docs/plan.md` section 7 defines these pilot metrics and nothing records them today. The Agency Benefit calculation (D-016) needs observed inputs, not estimates.
- Design law: reports status counts. Status colours only, per `docs/design.md`.
- Depends on: A2.

**F2. Flag reasons that become rule tests** - S
- What: flags carry a reason from a short list (wrong code, missing fact, extraction error, citation dispute) plus a note. An admin can turn a flagged file into a regression fixture for the rule concerned.
- Why: officers' disagreements are the best test data, and a person still changes the rule.

**F3. Queue triage** - S
- What: filter and sort by missing fact, rule, organisation and age. Add keyboard navigation between files.
- Why: the queue has no filters `[repo]`. `docs/design.md` section 4 asks for a dense, scannable officer list.
- Excluded: bulk validation, which conflicts with D-008.

### G. Reach and accessibility

**G1. Arabic interface** - M
- What: an Arabic (RTL) locale beside French for MSME screens, with IBM Plex Sans Arabic to stay in the type family.
- Why: several official texts are Arabic-only `[official]`, and OCR already includes `ara` `[repo]`.
- Needs a decision: `docs/design.md` section 6 currently fixes French as the interface language.

**G2. Plain-language explanation drafts** - S
- Now part of section 5 (R3): deterministic quote verification, then a person's approval before any screen shows it (D-029).

**G3. Phone capture** - S
- What: `<input type="file" accept="image/*" capture>` on the upload screen, so a paper invoice is photographed and sent to the existing OCR path.
- Why: MSMEs without an accountant often hold paper. It is native HTML with no new dependency.
- Built (D-055): a multi-page document is photographed page by page and filed as one PDF; photos are turned upright from their EXIF tag before OCR.

---

## 5. RAG system: implementation plan

### 5.1 What RAG may and may not do here

RAG in Chahed finds and explains law. It never creates, changes or removes a finding. That is the design law applied to retrieval and generation.

| Use | What it does | Model involved |
|---|---|---|
| **R1 Related texts** | Beside each finding, shows the verified paragraphs most related to the rule and to the missing fact | Embeddings only |
| **R2 Legal search** | Officers, rule authors and MSMEs search the verified passages and open the exact paragraph and its official page | Embeddings only |
| **R3 Plain-language explanation** | A short explanation of the governing article. Every sentence carries a verbatim quote of a verified passage, checked by code, and a person approves the whole explanation before any screen shows it | Chat model, checked by code, approved by a person |
| **R4 Grounded assisted facts** (later) | An assisted-fact question gets the defining paragraph as context, for example what counts as "honoraires". Nothing is displayed; the rule still judges | Chat model, judged by the rule as today |

Only verified legal text reaches a screen (D-029):
- **Verified passage:** a paragraph a person has checked against the official PDF page, recorded in a tracked register. A rule citation is a verified passage that also grounds a rule.
- **Unverified chunk:** indexed and ranked by the backend, but never returned as text by the API. There is no "non vérifié" label anywhere, because unverified text is never shown. An admin sees an unverified chunk only as a reference (article, paragraph, link to the official PDF page) in the verification queue, so the person checks the official page, not our extraction.
- **Explanation:** drafted by the model into a file, reviewed and approved by a person in that file, and loaded only once approved.

### 5.2 Starting point, measured

- The embedding model `paraphrase-multilingual-MiniLM-L12-v2` truncates at 128 tokens `[measured]`.
- Article-level chunks: 6,949 tokens for Article 52, so 2% is embedded `[measured]`.
- Split by paragraph and item (I, II, a), b), numbered and dashed items), Articles 52 to 55 give 69 pieces with a median of 75 tokens. 25 pieces exceed 128 tokens and 2 exceed 512 `[measured]`. Paragraph chunking alone is not enough for the current model.
- `intfloat/multilingual-e5-small` has 384 dimensions (the same as the current `vector(384)` column, so no migration) and a 512-token limit. It is MIT licensed and requires `query: ` / `passage: ` prefixes `[official]` (Hugging Face model card and config, read 2026-09-13).
- The compose database (`pgvector/pgvector:pg16`) has the `french` and `arabic` text search configurations and the `unaccent` and `pg_trgm` extensions available; `vector` is 0.8.6 `[measured]`.
- Article 52 starts on page 84 of the DGI PDF (index 83), and `pypdf` gives text per page, so every chunk can carry its page `[measured]`.

### 5.3 Architecture

```
INDEX (CLI, on corpus change)
  official PDF --pypdf per page--> page texts
    --> structural split: article > paragraph (I, II) > item (a), b), 1-, -)
    --> size guard: pieces over 450 tokens split by sentence, one sentence of overlap
    --> heading path prepended for embedding only ("Code IRPP-IS 2026 > Article 52 > I > a)")
    --> embed "passage: <heading path> <text>"  (providers/embeddings.py)
    --> tsvector('french', unaccent(text))       (computed at insert)
    --> verification status from corpus/verified-passages.json
        (match on source sha256, article, paragraph, text sha256)
    --> upsert corpus_chunk (source, article, paragraph, char_start) + corpus_source row

QUERY (R1, R2)
  query --> vector search, top 20 (cosine) ----\
        --> full-text search, top 20 (french) --+--> reciprocal rank fusion (k = 60)
                                                      --> keep verified passages only
                                                      --> score floor --> top 5
                                                      --> ts_headline excerpts, page, match type

EXPLAIN (R3, offline, per rule)
  verified rule citation + top verified passages (no document text)
    --> openrouter.py, JSON sentences
    --> verifier: each sentence carries a quote found verbatim in its verified passage
    --> draft file rules/explanations/<code>.draft.json (kept and dropped sentences, with reasons)
    --> a person reviews it in a pull request and approves it as rules/explanations/<code>.json
    --> loader loads approved explanations only
```

Choices, and why:
- **Paragraph chunks with a heading path:** a citation is a paragraph ("Article 52, I, a)"), so retrieval returns the unit a person cites and verifies. The heading path keeps a short item like "b) 15% au titre :" meaningful.
- **Hybrid retrieval:** legal queries hinge on exact terms ("honoraires", "loyers d'hôtels", "régime réel") that vectors blur, and paraphrases that keywords miss. French stemming is already in the database `[measured]`, so hybrid search adds no new dependency.
- **Reciprocal rank fusion:** it needs no score calibration between the two retrievers. `k` and the top-k sizes are algorithm parameters with documented defaults in `api/app/config.py`.
- **Rank everything, show only verified:** ranking over the whole corpus keeps the evaluation honest about retrieval quality. The verified filter sits before anything leaves the API, and the evaluation reports how many expected passages still wait for verification.
- **Approval in tracked files:** there is no admin sign-in yet. Passage verifications and explanation approvals follow the rule registry pattern: reviewed in a pull request, loaded at start (`api/CLAUDE.md`). Approve buttons in the admin screen wait for A3.
- **No generation in R1 and R2:** search results are passages, never answers. The user's query never reaches a model, so search has no prompt-injection surface.
- **No document text in R3:** explaining an article needs the article, not the invoice. No personal data crosses the provider boundary, and R3 runs offline, so it does not wait for masking (A1). A file-specific explanation ("why this applies to your invoice") would need A1 first, plus the same approval, which does not scale per file; it is not planned.

Deferred, each with the trigger that justifies it:
- **Cross-encoder reranker:** when recall@5 stays under target after hybrid search.
- **HNSW vector index:** when the corpus passes about 10,000 chunks (it holds 69 today).
- **A longer-context model** (`BAAI/bge-m3`, 8,192 tokens, 1,024 dimensions `[official]`): only if 512 tokens proves insufficient. It needs a column migration (D-017).

### 5.4 Data model

| Change | Fields | Why |
|---|---|---|
| New `corpus_source` | id, title, edition, publisher, url, sha256, language, page_count, loaded_at | Provenance shown in the UI. The source watch (B7) compares sha256 |
| `corpus_chunk` gains | paragraph_ref, heading_path, page, char_start, char_end, token_count, text_sha256, text_search (`tsvector`, GIN index), verification_status (`unverified` or `verified`), verified_by, verified_on | Cite and open the exact paragraph and page; full-text search; the D-029 filter |
| `corpus_chunk` unique key | (source_id, article_ref, paragraph_ref, char_start) | Reloading replaces instead of duplicating (known gap, `api/CLAUDE.md`) |
| New tracked `corpus/verified-passages.json` | source sha256, article_ref, paragraph_ref, page, text_sha256, checked_by, checked_on | The passage register of D-029, reviewable in git. `docs/facts.md` gains one row pointing to it. A source whose sha256 changes loads with its passages back to unverified |
| New tracked `rules/explanations/<code>.json` | rule code, source sha256, model id, prompt sha256, passage refs, sentences with quotes, approved_by, approved_on | Approved explanations, with their audit fields. Drafts (`<code>.draft.json`) are never loaded |
| New `explanation` table | the same fields, loaded from approved files | Served by the API. An explanation whose source sha256 no longer matches is not served |
| Rule files gain | `paragraph_ref` next to `article_ref` | Separates the governing paragraph from related ones without parsing prose |

`unaccent()` is not immutable, so the `tsvector` is computed in the loader's insert rather than as a generated column.

### 5.5 API

All under `/api/v1`. The web catch-all proxy forwards new paths with no change `[repo]` `web/app/api/v1/[...path]/route.ts`.

| Endpoint | Returns |
|---|---|
| `GET /corpus/search?q=&top_k=&source_id=` | Verified passages only: chunk id, source title and edition, article and paragraph refs, page, excerpt with highlight markers, match type (`texte`, `sens`, `les deux`), verified by and on, official URL with `#page=N` |
| `GET /corpus/chunks/{id}` | A verified paragraph with its verified siblings, the article outline limited to verified paragraphs, and source provenance. 404 for an unverified chunk |
| `GET /corpus/sources` | Sources with edition, sha256, page count, verified and total passage counts, loaded date, and the rules that cite each |
| `GET /findings/{id}/related` | R1 for one finding, verified passages only. The query is built deterministically from the rule's verbatim text and, for an abstention, the missing fact label. The governing paragraph is excluded (it is already the citation) |
| `GET /rules/{code}/explanation` | The approved explanation for the current source sha256, or 404 |
| `GET /corpus/verification-queue` | References only (article, paragraph, page, official URL with `#page=N`), ranked by how often retrieval and the evaluation set hit them. No text |

The explanation draft is produced by a CLI, not over HTTP: `python -m app.corpus.draft_explanation <code>`.

Excerpts use `ts_headline` with sentinel markers that cannot occur in the source text. The web splits on them and renders React elements, never HTML strings.

### 5.6 Generation guardrails (R3)

- **Prompt:** the rule's verified citation and the top verified related passages, numbered. It asks for at most four short sentences in formal French, as JSON: `{"sentences": [{"text", "passage", "quote"}]}`.
- **Verifier (deterministic, unit-tested):**
  - Normalise both sides (NFKC, curly to straight apostrophes, whitespace collapsed). The corpus keeps curly apostrophes from `pypdf` `[repo]` `corpus/sources/SOURCE.md`.
  - A sentence is kept only if its quote is at least 20 characters and appears verbatim in the verified passage it names.
  - A sentence containing a digit is kept only if every digit sits inside its quote.
  - If no sentence survives, no draft is written and the CLI reports why.
- **Draft file:** records kept and dropped sentences with the reason for each drop, so the reviewer sees what the verifier removed.
- **Approval:** a person reads the draft against the verified passages and approves it; their name and the date go into the file. A source change (B7) stops the explanation being served until it is re-approved.
- **Audit:** model id, prompt hash and passage refs stay in the approved file and are written to `audit_entry` on load (A2).
- **Provider boundary:** unchanged. The call goes through `providers/openrouter.py`, reusing the JSON path `extract_fact` already uses `[repo]`.

### 5.7 UI integration

Principles, from `docs/design.md` and D-029:
- The answer comes first; retrieval never pushes the finding down.
- Only verified passages and approved explanations appear. When nothing verified matches, the element is absent or says that nothing verified is available; there is no placeholder text and no "non vérifié" label.
- Colour carries status only. Related texts use neutral tokens (`--muted`, `--border`, `--accent` for highlights), never a status colour.
- Loading states are static ("Recherche en cours"). Motion only answers a user action.
- Everything is reachable by keyboard; copy is formal French.

**U1. Verified citation, unchanged at the top.** The existing `Citation` component (scale icon, "Lire l'article") stays the first legal element of a finding card `[repo]` `web/components/shared/citation.tsx`. It gains two quiet lines under the verbatim text:
- "Source officielle, page 84" (opens the PDF at `#page=84`)
- "Empreinte identique au fichier publié par la DGI", shown only while the source watch (B7) confirms the hash

**U2. Related texts, under the citation.** A collapsible "Textes connexes (3)" per finding, present only when at least one verified related passage exists. Each row shows:
- the article and paragraph ref in Plex Mono, and a page number
- a two-line excerpt with matched terms marked on the neutral accent
- a small match-type label ("mot exact" or "sens proche")
- a book icon rather than the scale icon (the scale stays reserved for the governing citation), and "Vérifié le 13/09/2026"

For an abstention, the heading reads "Où les textes en parlent", which points the MSME to the verified paragraphs that define the missing fact.

**U3. Source reader.** A side panel (re-add the shadcn `sheet` primitive, removed as unused in D-023) opened from a citation, a related text or a search result:
- Left: the article outline, limited to its verified paragraphs, with the current one selected.
- Right: the paragraph, with its verified neighbours in muted text, and the matched terms marked. Below them: "Lire l'article complet sur la source officielle, page 84".
- Footer provenance: source title, edition, publisher, page, short sha256, loaded date, and who verified the paragraph and when.
- State lives in the URL (`?texte=<chunk id>`) so the back button closes it and a link can be shared with a colleague.

**U4. Legal search.** "Rechercher dans les textes" in the app header, also on `Ctrl+K` (officer and admin screens):
- A dialog (re-add the shadcn `dialog` primitive) with one input and a result list grouped by article. Arrow keys move and Enter opens the reader.
- No new dependency: a plain input and an ARIA listbox, not a command-palette library.
- Empty state: "Aucun passage vérifié ne correspond. Le système ne complète pas par une réponse inventée."

**U5. "En clair" explanation.** A collapsible "En clair" inside the opened citation, present only when an approved explanation exists. It is loaded, not generated on click, so there is no loading state:
- Up to four sentences, each ending with a numbered marker. Focusing a marker highlights its quoted words in the verbatim text beside it (a user action, so a transition is allowed).
- Footer: "Rédigé par un modèle à partir de passages vérifiés, relu et approuvé par [nom] le [date]. Ne remplace pas l'article."

**U6. Admin "Textes" page** (`/admin/textes`, read-only like the rule registry):
- The sources table (edition, sha256, pages, verified and total passages, loaded date, rules citing each).
- The last evaluation scores (5.8).
- The verification queue: references and official page links only, never text. The admin checks the page and adds the entry to the register in a pull request.
- The approved explanations, with approver and date.
- A rule-author aid: pick a TEJ code description from the XSD and see candidate references (article, paragraph, page link), each to be read on the official page and verified by a person. This speeds up the citation bottleneck of B2 without the model choosing the citation.

Files:
- `web/components/shared/`: `related-texts.tsx`, `passage-excerpt.tsx`, `source-reader.tsx`, `plain-explanation.tsx`, `legal-search.tsx`
- `web/components/admin/`: `corpus-sources.tsx`, `verification-queue.tsx`
- `web/lib/`: `highlight.ts` (marker splitting, Node-tested like the existing `lib/` tests)
- wire types in `web/lib/api-types.ts`, in the same commit as the Pydantic models (D-024)
- `web/AGENTS.md` requires reading the bundled Next.js 16 docs before writing route or component code.

### 5.8 Evaluation

- **Question set:** `corpus/eval/questions.json`, 40 to 60 questions in French written by team members (Arabic later). Each maps to the expected article and paragraph, for example "retenue sur les loyers d'hôtels" to Article 52 I a). People write it, not a model.
- **Metrics, by a pytest against real embeddings and the real database,** matching the suite's existing no-mock style `[repo]`:
  - recall@5 and mean reciprocal rank over the whole corpus (retrieval quality)
  - verified coverage: the share of questions whose expected passage is verified. It shows where verification work pays off first.
- **Comparison before choosing** (results recorded in the decision log):
  1. today: article chunks, MiniLM
  2. paragraph chunks, MiniLM
  3. paragraph chunks, e5-small
  4. option 3 plus full-text search, fused
- **Gate:** R1 and R2 ship to the UI only when recall@5 meets a target the team fixes (proposed 0.9, a documented default in `config.py`), and every passage the demo script shows is verified.
- **Verifier tests:** fabricated quote dropped, paraphrase dropped, apostrophe variants accepted, quote from an unverified chunk dropped, digit outside the quote dropped, empty result writes no draft.
- **Filter tests:** no endpoint returns the text of an unverified chunk; a changed source sha256 returns its passages to unverified and stops its explanations.

### 5.9 Work breakdown

Each step lands implemented and tested (root `CLAUDE.md`), and each is usable on its own. `docs/plan.md` section 8 assigns them to phases.

| # | Step | Effort | Depends on |
|---|---|---|---|
| 1 | Page- and structure-aware chunker with size guard, tested on the real Articles 52 to 55 | S | none |
| 2 | `corpus_source` table, new chunk columns, migration, upserting loader | S | 1 |
| 3 | Verified passage register, loader matching, and the API-side filter; first verifications of the passages the hero documents need (person time) | S | 2 |
| 4 | Evaluation question set (person time) and harness, with verified coverage | S | 3 |
| 5 | Compare embedding options, switch to e5-small with prefixes if it wins; update the Dockerfile pre-download; supersede D-018 | S | 4 |
| 6 | Full-text column, hybrid retrieval with rank fusion; re-run evaluation | S | 5 |
| 7 | Endpoints: search, chunk, sources, related, verification queue | S | 6 |
| 8 | UI: citation provenance (U1), related texts (U2), source reader (U3) | M | 7 |
| 9 | UI: legal search (U4) | S | 7 |
| 10 | Explanations: draft CLI, verifier, approved-file loader, table, endpoint, UI (U5) | M | 7 |
| 11 | Admin Textes page, verification queue and rule-author aid (U6) | S | 7 |
| 12 | Arabic sources (finance law 2026, notes communes): `arabic` text search config, Arabic questions in the set | M | 6 |
| 13 | Grounded assisted facts (R4) | S | 6, A1 |

Decisions to log when reached:
- the embedding model choice, after step 5
- the recall target
- the "citation vérifiée" / "texte connexe" display rules, as a `docs/design.md` section

Already decided: unverified text is never displayed, and explanations need a person's approval (D-029).

---

## 6. Demo features: visible, real, convincing

### 6.1 What convinces this jury

The pitch lasts three minutes (`docs/plan.md` section 6). Hack4Justice is run by HiiL with public partners (2.5, 2.8), and a DGI officer may attend. That jury is convinced by proof, not by an impressive-looking model:
- official sources opened live
- a system that visibly refuses to guess
- a human visibly in control
- a file the administration's own schema accepts

Every feature below is real product behaviour on seeded demo data, not a staged screen (D-022, no mocks). `docs/plan.md` section 6 carries them as part of the demo moments (D-030).

### 6.2 The features

**J1. "Pourquoi ce code ?" decision trace** - S to M, moment 2
- The jury sees: under the proposed code, a short vertical trace:
  1. "Texte du document lu (couche texte PDF)"
  2. "Catégorie : honoraires, fournie par le modèle, confiance 0,86, seuil 0,50"
  3. "Mention de retenue : absente (recherche du mot « retenue »)"
  4. "Règle CIRPPIS-ART52-I-A : mention manquante", with the citation

  Each fact is tagged by source: lu dans le document, fourni par le modèle, confirmé par une personne.
- Real use: the officer sees exactly which fact came from where before validating. It is also the audit record.
- Build: rule logic returns the steps it took with its outcome; `finding` stores them as JSON; the finding card renders a step list. The Art. 52 rule already has exactly these three steps `[repo]`.
- Why it convinces: the design law ("the model supplies a fact, the rule decides") becomes visible in five seconds.

**J2. The official page, one click away** - S after 5.9 step 8, moment 2
- The jury sees: the citation opens the source reader at Article 52, I, a), verified by a named person on a date. "Source officielle, page 84" opens the DGI PDF on that page, with "Empreinte identique au fichier publié par la DGI" next to it.
- Real use: provenance an officer can check without trusting the tool.
- Why it convinces: `docs/plan.md` says the click to the citation is the pitch, and this makes the click land on the administration's own document.

**J3. Evidence on the document** - M, moment 1
- The jury sees: the uploaded invoice rendered beside the extracted fields. Selecting a field outlines where it was read on the page.
- Real use: an officer or MSME checks an extraction in one glance instead of rereading the file.
- Build: pages rendered with `pdf2image` (installed). Word boxes from `pytesseract.image_to_data` (installed `[measured]`). Field values located among the boxes by string match (deterministic). No new dependency.
- Depends on: B1 field extraction.

**J4. Abstention answered live** - M, moment 3
- The jury sees: the abstention card asks "Le fournisseur est-il soumis à l'impôt selon le régime réel ?" with "Oui", "Non", "Je ne sais pas" and an optional attestation upload. The presenter answers. The rule re-runs, the card changes from abstention to decision, and the trace (J1) now shows "confirmé par [utilisateur], 13/09/2026".
- Real use: an abstention stops being a dead end (B4).
- Build: B3 and B4; the answered fact enters the facts dict like any other fact.
- Why it convinces: it is the strongest possible proof of "it does not guess". It asks, a person answers, the rule decides.

**J5. "Ce qui quitte le poste"** - M, moment 1
- The jury sees: a panel with the document text on the left and, on the right, exactly the text sent to the model, with `[MATRICULE_1]`, `[NOM_1]`, `[TELEPHONE_1]` in place.
- Real use: data-protection audit (A1, A2, 2.6).
- Why it convinces: it answers "where do the documents go" (`docs/plan.md` section 11) with evidence instead of a promise.

**J6. "En clair", approved** - M, moment 2
- The jury sees: inside the opened citation, up to four plain-French sentences. Each is linked to the verified words it quotes, signed "relu et approuvé par [nom] le [date]".
- Real use: MSME owners without legal support (2.8) understand the article.
- Why it convinces: the model drafts, code checks every quote, a person approves, and the jury sees all three.

**J7. Schema errors in plain French, on the field** - S, moment 5
- The jury sees: the presenter types a malformed matricule. The form shows, on that field, "Le matricule fiscal doit comporter 7 chiffres suivis d'une lettre majuscule (schéma TEJ de la DGI)". After the fix, the export validates and the XML downloads.
- Real use: today refused exports list raw XSD errors `[repo]`; mapping them to fields makes them actionable.
- Build: map the element name in each `lxml` error to its form field, with French templates per XSD facet (pattern, enumeration, length). Add the C3 arithmetic checks with the same presentation.
- Why it convinces: the administration's own schema, live, and a failure turned into a fix.

**J8. A queue that shows the pre-qualification** - S, moment 4
- The jury sees: on file arrival (the existing orchestrated moment), the row reads "1 code proposé, 1 information manquante: régime fiscal", and a filter by missing fact. The officer opens it and validates in one action.
- Real use: F3 triage.
- Build: queue rows already carry decided and abstained counts `[repo]`; add the missing fact names.

**J9. Impact panel from the system's own data** - M, moment 6
- The jury sees: counts from the database for the demo dataset (files, errors intercepted per rule, abstentions by missing fact), labelled "jeu de démonstration". Beside them, the D-016 formula with each input labelled "estimation" or linked to its verified fact.
- Real use: F1, the pilot's measurement tool.
- Caution: no national or unsourced figure on screen (`docs/facts.md`); the panel shows only computed counts and the labelled formula.

**J10. Legal search** - S after 5.9 step 9, Q&A backup
- The jury sees: `Ctrl+K`, "loyers d'hôtels", and the verified paragraph opening in the reader with its page.
- Caution: prepared query only on stage. Live queries from the room belong to Q&A, where an empty result states that nothing verified matches.

**J11. Supplier memory** - M, Q&A backup
- The jury sees: a second invoice from the same supplier produces no abstention. The trace shows "fait confirmé le 13/09/2026, attestation valable jusqu'au ...".
- Real use: B3.

### 6.3 Priority for the pitch

All eleven are in scope (D-030). This order decides what is cut first if a pre-pitch gate is at risk (`docs/plan.md` section 9).

| Tier | Features | Rationale |
|---|---|---|
| Must | J1, J2, J4, J7, J8 | Each makes one of the demo moments self-evident, and none needs a new dependency |
| Strong | J3, J5, J6, J9 | Each answers a question a jury asks (is the reading right, where does data go, can an MSME understand it, what does the administration gain) |
| Backup, for Q&A | J10, J11 | Real and quick to show, but they would crowd three minutes |

### 6.4 Not shown in the demo

These are in scope (D-030) but get no stage time:
- **Arabic interface (G1):** the demo runs in French.
- **TEIF ingestion (D1) and certificate corrections (C1):** real value, but no visual moment worth stage time.

Anything animated for effect is out entirely: `docs/design.md` section 5 forbids it.

### 6.5 A three-minute script using them

| Time | Beat | Features |
|---|---|---|
| 0:00 to 0:25 | The unpaid prestataire and the one sentence thesis | slide |
| 0:25 to 0:55 | Upload the hero invoice; fields appear and are outlined on the page; the masked text sent to the model is one click away | moment 1, J3, J5 |
| 0:55 to 1:25 | Proposed outcome; open the trace; open the verified article at its official page and its approved explanation | moment 2, J1, J2, J6 |
| 1:25 to 1:50 | Second invoice abstains; answer the question live; the rule decides | moment 3, J4 |
| 1:50 to 2:15 | The file arrives in the officer queue with what is missing named; validate | moment 4, J8 |
| 2:15 to 2:35 | Export: one wrong field explained in French, fixed, the XSD accepts | moment 5, J7 |
| 2:35 to 3:00 | Impact from the system's own counts, derived agency benefit | moment 6, J9 |

### 6.6 Demo safety

- **Seeded, not staged:** hero fixtures and their outcomes come from the real pipeline, re-run before the pitch.
- **No live dependency on the network where avoidable:**
  - explanations are approved and loaded before the pitch, never generated on stage
  - the embedding model loads at container start
  - a model-call failure shows its documented state, not a crash
  - a recorded run of the full script is ready as a fallback
- **Verified only (D-029):** every passage and explanation the script opens is verified or approved, and the presenter narrates only verified facts. Before the pitch, check every figure visible in the script against `docs/facts.md`.
- **Motion and access:** no new animation beyond answers to user actions. The presenter drives the whole script by keyboard with reduced motion on, per `docs/design.md` section 8.

---

## 7. Not recommended (out of scope)

| Idea | Why not |
|---|---|
| Supplier risk or fraud scoring | Banned claims, D-003 and D-007 |
| Automatic submission to TEJ without an officer | D-008. No public submission API was found, and TEJ takes a file upload |
| Model-computed withholding rates | Design law. Rates must come from versioned, cited rules (B5) |
| Issuing TEIF invoices or TTN transmission | Crowded (Fatoora, TTNHub, Hesabi, open-source Tekru middleware) and plumbing, not judgement (`docs/plan.md` section 2) |
| General legal chatbot | Built as a Hack4Justice 2025 challenge `[press]`; off-thesis. Section 5's search returns verified passages and its explanations are approved quotes of one article, never free-form answers |
| Generating the withholding certificate PDF | TEJ produces certificates itself (2.1); duplicating it adds liability, not value |

## 8. Sequencing

Phases and their gates live in `docs/plan.md` section 8 (D-030). This table maps features to them.

| `docs/plan.md` phase | Features |
|---|---|
| 1 Corpus and rules | RAG steps 1 to 7 |
| 2 Extraction | B1 and A1 on the hero set, J3, J5 |
| 3 Decision + retrieval | J1; J2 (RAG step 8); J4 with B3 and B4 on the hero set; J6 (RAG step 10) |
| 4 Officer + export | J7 with C3, J8 |
| 5 Polish | J9; J10 (RAG step 9); J11; recorded fallback run |
| 6 Pilot prerequisites | A1, A2, A3 roles, A5, A6 when volume requires it, B1 beyond the hero set, C3, F1 |
| 7 Real coverage | B2 (RS1, RS2, RS7), B3, B4 with the officer's request for information, B5, C1, C2, C4, F2, RAG step 11 |
| 8 Structured inputs | D1, D2, B7, F3, G3, RAG steps 12 and 13 |
| 9 Partnerships | E1, E2, A4, A3 DigiGo and Mobile ID, G1 |

## 9. Open questions for the team

1. Who in the team verifies articles, passages and explanations, and at what pace? B2, the verified passage register and R3 are all bounded by person time, not code.
2. Pilot partner: the DGI (officer side), a public buyer (E2), or an accountancy firm (A4)? Each changes phase 6.
3. Which article anchors the story: Article 55(I) or Article 52(I)(a) (D-027), or Article 62 LF 2014 (section 3.2)? The answer changes the pitch and possibly whether E2 moves earlier.
4. Arabic interface: a product decision against `docs/design.md` section 6.
5. Hosting and data residency for a public-sector pilot, given 2.6.

Answered on 2026-09-13: display of unverified text and explanation approval (D-029); scope and phases (D-030).

## 10. Sources

Official
- DGI, TEJ new features notice: https://jibaya.tn/blog/avis-nouvelles-fonctionnalites-a-la-plateforme-tej/
- DGI, TEJ schema zip: https://jibaya.tn/wp-content/uploads/2024/05/plateforme-TEJ-shemas-xsd.zip
- DGI, E-situation fiscale: https://jibaya.tn/blog/e-situation-fiscale/
- DGI, Notes communes: https://jibaya.tn/docs-category/notes-communes/
- DGI, Loi de finances 2026 (Arabic): https://jibaya.tn/docs/loi-des-finances-2026-disponible-en-langue-arabe-uniquement/
- Ministry of Finance, VAT withholding on public contracts FAQ: https://www.finances.gov.tn/fr/node/905
- Tunisian government portal, supplier tax situation for public bodies: http://fr.tunisie.gov.tn/service/600/6-consultation-de-la-situation-fiscale-des-fournisseurs-de-marchandises-de-services-de-travaux-et-de-biens-au-profit-des-epa-et-entreprises-publiques-%D9%80%D9%80%D9%80%D9%80-minist%C3%A8re-des-finances.htm?UTB_FS=3
- RNE, data exchange by API: https://home.registre-entreprises.tn/echange_des_donnees/
- TunTrust, DigiGo: https://www.tuntrust.tn/fr/solutions/digigo
- HiiL, Tunisia MSME justice needs: https://www.hiil.org/news/uncovering-tunisias-hidden-economic-barrier-msme/
- OECD, Tax Compliance by Design: https://www.oecd.org/ctp/administration/tax-compliance-by-design-9789264223219-en.htm
- OECD, Tax Administration 2025: https://www.oecd.org/en/publications/tax-administration-2025_cc015ce8-en.html
- Hugging Face, intfloat/multilingual-e5-small: https://huggingface.co/intfloat/multilingual-e5-small
- Hugging Face, BAAI/bge-m3: https://huggingface.co/BAAI/bge-m3

Press
- La Presse, TEJ changes September 2026: https://www.lapresse.tn/2026/09/08/fiscalite-ce-qui-change-sur-la-plateforme-tej-des-septembre-2026
- Business News, e-invoicing legal framework: https://businessnews.com.tn/2026/01/06/facture-electronique-en-tunisie-cadre-legal-entreprises-concernees-sanctions-et-enjeux-de-transparence/1381540/
- Le Temps, ministry details on the LF 2026 e-invoicing extension: https://letemps.news/2026/01/26/facturation-electronique-le-ministere-des-finances-detaille-lelargissement-prevu-par-la-lf-2026/
- Directinfo, Mobile ID and DigiGo from July 2026: https://directinfo.webmanagercenter.com/2026/05/19/tunisie-des-juillet-le-mobile-id-et-digigo-deviennent-obligatoires-pour-les-procedures-administratives/
- WMC, data protection bill at the ARP: https://www.webmanagercenter.com/2026/02/23/562193/tunisie-vers-un-nouveau-cadre-legal-pour-renforcer-la-protection-des-donnees-personnelles/
- Directinfo, ARP commission session May 2026: https://directinfo.webmanagercenter.com/2026/05/20/tunisie-arp-la-commission-des-droits-et-des-libertes-examine-une-serie-de-projets-de-loi/
- Managers, Hack4Justice 2025: https://managers.tn/2025/05/31/hack4justice-faciliter-lacces-a-la-justice-pour-les-tpmes-en-tunisie-grace-a-lintelligence-artificielle/
- Managers, fiscal calendar September 2026: https://managers.tn/2026/09/02/fiscalite-les-4-dates-a-retenir-en-septembre-2026/

Vendor and consultancy
- Deloitte, LF 2026 main measures: https://blog.avocats.deloitte.fr/tunisie-les-principales-mesures-de-la-loi-de-finances-pour-2026/
- Hesabi, TEJ: https://hesabi.tn/tej-retenue-source-tunisie
- Aspiss, TEJ: https://www.aspiss.com/nos-solutions/tej
- Tassaruf, TEJ: https://www.tassaruf.com/application_retenue_source_TEJ_tunisie.html
- Expert Computer, TEJ: https://www.expertcomputer.tn/logiciel-tej-tunisie/
- TSI ERP, RS certificates: https://www.tsi.com.tn/tsi-fichier-des-certificats-rs/
- Noqta, TEIF specification tutorial: https://noqta.tn/en/tutorials/format-teif-specifications-techniques-tunisie-2026
- Tekru, El Fatoora middleware: https://tekru.net/fr/blog/facturation-electronique-en-tunisie-tekru-technologiespublie-un-middleware-open-source-pour-accelerer-ladoption-del-fatoora-en-partenariat-avec-ngsign/
- Jurisite, CDPF penalties: https://www.jurisitetunisie.com/tunisie/codes/cdpf/cdpf1085.htm

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-13 | team | Initial post-hackathon feature research |
| 2026-09-13 | team | Added the RAG implementation plan (section 5, with measured retrieval baseline) and demo-facing features (section 6); renumbered later sections |
| 2026-09-13 | team | Applied D-029 (only verified passages on screen, explanations approved by a person) to sections 5 and 6; scope moved into `docs/plan.md` per D-030, section 8 now maps features to plan phases |
