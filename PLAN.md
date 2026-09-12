# Sanad — Build Plan

**Hack4Justice 2026 · Challenge A · Regulatory AI & Fiscal Compliance**

A Tunisian MSME that has delivered work to a public body cannot get paid until its dossier passes a legally mandated fiscal check. A dossier rejected for a missing piece or an inconsistent field restarts the clock — and the invoice stays unpaid. Sanad pre-qualifies that dossier against the actual texts, cites the article behind every finding, and hands the public accountant a file that is already verified.

| | |
|---|---|
| **Frame** | Article 62 LF2014 — public-payment dossier (real officer, real mandate) |
| **Depth** | Retenue à la source → TEJ operation-code selection (AI-hard, machine-verifiable) |
| **Team** | 4 people, 3 Claude accounts |
| **Budget** | $120 AWS |
| **Positioning** | The institutional module *is* the product |

---

## What this plan is

A merge of two proposals. The **frame** comes from the article 62 dossier: it supplies a named legal obligation, a threshold, and a public agent who must verify before money moves — everything the first service-contract proposal lacked. The **depth** comes from the TEJ withholding angle: it supplies a decision the AI genuinely has to make and an output a machine can validate live on stage.

They fit together because the art. 62 proposal already lists *"application correcte de la retenue à la source lorsqu'elle est due"* as one of its conformity checks. That check **is** the TEJ problem. We promote it from a bullet to the showcase.

The legal-guardrails work in the art. 62 proposal (regulated professions, signature, data protection, liability) is kept **in full**. It is the strongest section either proposal produced and almost no competing team will have it.

> **Assumptions.** ~48-hour sprint; phase markers are hours from kickoff. Stack assumed Next.js + TypeScript + Postgres — swap freely, nothing depends on it.

---

## 1. The legal anchor, and the trap inside it

**Article 62 of the Loi de Finances 2014**: any payment by the State, local authorities or public establishments to a supplier, for **≥ 1,000 DT TTC**, is conditional on an attestation certifying the supplier has filed all due tax declarations.

That gives you a real officer at the poste comptable public with a real duty to verify. Good.

### ⚠️ But E-Sit-Fisc goes further than the draft admits

The DGI's own description of the service:

> *"…permettant de consulter et d'éditer en ligne la situation fiscale de leurs fournisseurs… **en application des dispositions de l'article 62 de la loi de finances pour l'année 2014**… principalement par **la dématérialisation des attestations de la situation fiscale**."*
> — [impots.finances.gov.tn](http://www.impots.finances.gov.tn/index.php/fr/services-en-ligne/2015-11-06-16-15-01)

DGI built E-Sit-Fisc **for this exact article**, and its stated purpose is **dematerialising the attestation**. The single piece the draft's narrative centres on is the one piece DGI has already digitised for this workflow. A DGI judge knows this cold — it is their own service. **If they raise it first, the pitch is over.**

**So raise it first, and turn it into the endorsement.** Scripted answer, rehearsed, delivered before anyone asks:

> "DGI already dematerialised one piece of this dossier — E-Sit-Fisc, built specifically for article 62. That proves the demand and it proves the direction. But E-Sit-Fisc answers one question for one actor: *is this supplier fiscally clear?* It does not tell the MSME **before** they submit whether the rest of their dossier will be rejected, it does not check the other pieces, and it does not check coherence between them. We do that, and we hand the result to the same officer."

### Also: stop selling the 2-day delay

The attestation is delivered in **max 2 working days**. That is fast, and citing it undercuts the queue-misery story. The pain is the **round trip**: one missing or inconsistent piece restarts the clock while the invoice goes unpaid. For a TPE that is a cash-flow problem, not a paperwork problem. Make that the entire narrative.

---

## 2. Why 2026 — Tunisia just made structured fiscal data mandatory

Two obligations landed on **1 January 2026**, both with published machine-readable formats, both hitting companies that overwhelmingly have nobody in-house to absorb them.

| Obligation | Format | Penalty | Verified |
|---|---|---|---|
| **TEJ** — withholding certificates (*Transfert et Échange des Données Fiscales*) | XML against published **XSD**, or web entry | 30 % of the withholding, min. 50 DT **per certificate** | Schemas downloaded and read directly |
| **Facture électronique** — art. 53 LF2026 (loi n° 17-2025 du 12/12/2025), extended to **all services** regardless of amount, company size or tax regime | **TEIF XML** via the TTN **El Fatoora** platform | 100–500 DT per paper invoice, annual ceiling 50,000 DT | Confirmed across multiple accounting sources |

The DGI added new TEJ functionality and reissued the XSD on **8–9 September 2026** — days before this hackathon.

Against that: **836,808 registered enterprises**, of which roughly **87 % employ nobody** (INS / RNE 2024). No legal department, no tax department, frequently no full-time accountant. That gap is the product.

---

## 3. The demo: one dossier, six checks

**Persona.** A services MSME (bureau d'études, maintenance, communication) has delivered to a public establishment and must assemble its payment dossier for an invoice of **8,400 DT TTC** — above the art. 62 threshold.

**Pieces in the demo: three, not five.** Contract, invoice, and the supplier's registry extract. Patente and attestation are stubbed and mentioned. Scope discipline beats surface area.

### The six rules we actually implement

Three are deterministic. Three require retrieval and judgment — **those three are the demo.**

| # | Check | Kind | Why it matters |
|---|---|---|---|
| 1 | Dossier completeness against art. 62 — every required piece present, legible, dated, in validity | Deterministic | The frame |
| 2 | Matricule fiscal identical across every piece (7 digits + letter, `PM`/`PP`) | Deterministic | Classic rejection cause |
| 3 | Date chain coherent — contract before delivery, delivery before invoice | Deterministic | Classic rejection cause |
| 4 | **TVA invoiced vs. the supplier's declared regime** — TVA charged by an operator whose regime does not permit it | **RAG** | Strong signal, classic rejection |
| 5 | **Retenue à la source: is it due, at what rate, under which TEJ operation code** | **RAG + due diligence** | ⭐ The showcase |
| 6 | **Contract object vs. activity declared at RNE** (nomenclature) | **RAG + registry** | Also gates sectoral eligibility (APII) |

> **Do not lead with completeness.** Strip the presentation away and checks 1–3 are OCR plus `if` statements. A sharp judge will say *"this is a checklist with an LLM bolted on."* Checks 4, 5 and 6 need facts that are not on the document. Put them at the front of the demo and the front of the deck.

### Plus one due-diligence signal, verified

**Art. 32, loi n° 2018-52**: financial statements must be filed with the register **by the end of the seventh month** following the close of the accounting period, with the auditor's report.

**Art. 51**: late filing incurs a penalty of **half the fee due for the operation, per month of delay or part thereof**.

And the fact the draft missed, which is far stronger: where the Centre finds the operations have not been completed, it notifies the company, gives it **fifteen days**, and failing that **suspends the company's register and transmits the report to the public prosecutor.** A suspended register is existential — no extrait, no bidding, no normal operation. That is a publicly observable, legally grounded regularity signal about a counterparty.

### The limit, stated in the product

Sanad does not claim to know a third party's litigation or tax arrears. **That information is not public in Tunisia** — only DGI holds it, via E-Sit-Fisc, and that service is reserved to public bodies. The product says what it knows and flags explicitly what it cannot know. That honesty is what makes the rest credible.

**The inversion, as the roadmap slide:** a company can *consent* to expose its own standing and mint a signed, time-stamped credential it **presents** to counterparties. Legally clean, and every supplier asked for it has a reason to join.

---

## 4. The showcase: check 5 in detail

The DGI publishes the TEJ XSD schemas. We downloaded them — three files, 2,853 lines.

| Schema file | Lines | Pins down |
|---|---:|---|
| `TEJDeclarationRS_v1.0.xsd` | 512 | Declaration envelope, certificate and operation structure, amounts, identifiers |
| `TEJRSCodesOperations_v1.0.xsd` | 189 | Full enumeration of withholding operation codes with legal descriptions |
| `TEJISOPaysDevises.xsd` | 2,152 | ISO country and currency codes for non-resident payments |

### Three codes, one invoice

```
<!-- All three: purchases >= 1,000 DT TTC -->

RS7_000001   ... personnes morales soumis a l'IS
             au taux AUTRES QUE 15% ET 10%

RS7_000002   ... personnes morales soumis a l'IS
             au taux de 15%

RS7_000003   ... personnes physiques beneficiant de la
             deduction de 2/3 et personnes morales
             soumises a l'IS au taux de 10%
```

Same invoice. Same amount. Same supplier name. The only thing separating the three is the supplier's **corporate tax rate — which appears nowhere on the document in front of the business owner.**

> **This is why conformity and due diligence must run in a single pass.** It is not an architectural preference; it is forced by the law. It is also the most persuasive thirty seconds available to you.

### Constraints the schema imposes

- **Amounts are integers in millimes.** `xs:integer`, *"sans partie décimale"*. A float anywhere in the pipeline is a rejected declaration.
- **Matricule fiscal** — 7 digits concatenated with a letter, plus `CategorieContribuable` of `PM` or `PP`.
- **TVA is an enum** — only `7.0`, `13.0`, `19.0` validate.
- **Five identifier types** — matricule fiscal, CIN, passport, carte de séjour, other. Non-residents route differently and carry a country code.
- **Per-operation flags** — `CNPC` (double-taxation treaty) and `P_Charge` (withholding borne by the payer) both change the arithmetic.

> ⚠️ **Do not trust the rate tables on the web — and say so on stage.** Two Tunisian tax blogs gave us contradictory rates for fees paid to BNC professionals under the régime réel. That contradiction *is* the argument for the product: rates move with every Loi de Finances, secondary sources lag, and an LLM answering from memory inherits both problems.

---

## 5. Architecture: what the model may decide, and what it may not

Put this on a slide in these words. It costs nothing to implement and it is the decision that wins a hackathon named for justice.

| The LLM **does** | The LLM **never** |
|---|---|
| **Read.** Normalise messy OCR into typed fields, French or Arabic. | **Computes money.** Rates, bases, thresholds, rounding to millimes — unit-tested code. |
| **Classify.** Propose one operation code from the enumeration, with confidence and rationale. | **Decides.** No filing leaves the system without a human approval on one side or the other. |
| **Explain.** Turn a retrieved article into a sentence a non-lawyer understands. | **Asserts law from memory.** No retrieved citation, no conclusion. The refusal is a feature. |
| **Escalate.** Say "I cannot determine this" and name the missing fact. | **Overwrites the record.** Every suggestion and override is appended to an immutable log. |

### Pipeline

1. **Ingest.** PDF / scan / photo → S3. Route by language: **Textract for French** (forms and tables), **Claude document vision for Arabic** — Textract does not support Arabic structured extraction, only raw text. Tunisian administrative documents are bilingual, so this routing is mandatory, not optional.
2. **Classify document type** → select the applicable rule set. This routing is what makes the architecture generalisable.
3. **Retrieve.** Corpus chunked by article, embedded to pgvector. Retrieve against the payment's nature plus the counterparty's profile.
4. **Check.** Deterministic rules in code; RAG-backed rules return *finding → verbatim article with source → corrective action*.
5. **Verify counterparty.** Matricule shape check, then registry lookup: legal status, registration date, declared activity, financial-statement filing. Real API behind an interface, mocked for the demo.
6. **Compute.** Deterministic engine. Integer millimes. Full test suite.
7. **Emit.** Serialise and validate against the real XSD before anything is marked ready.
8. **Review.** Officer queue. Approve, flag, or request a complement. Append to audit log.

**Every extracted field carries a confidence score.** Below threshold it is marked *à confirmer* and raised to the user **before any analysis runs**. The system never reasons on data it did not read reliably.

### Stack notes

- **Bedrock client:** `AnthropicBedrockMantle` from the Anthropic SDK — not a `base_url` override. Bedrock model IDs carry an `anthropic.` prefix.
- **Two features are unavailable on Bedrock:** Managed Agents and fast mode. Architect as plain Messages API + tool use and you never hit either wall.
- **XSD validation is a library call**, not a hand-rolled checker. Wire it in hour one; it is your objective scoreboard all weekend and a great live demo beat.
- **Parse the enumeration, don't retype it.** Generate the TypeScript union and the prompt's code list from `TEJRSCodesOperations_v1.0.xsd` at build time. Forty hand-copied codes is forty typos you will debug at 3am.

---

## 6. The institutional module (mandatory deliverable)

The public agent's workstation — DGI, RNE, APII, or poste comptable public — designed to **reproduce the existing control logic, not replace it**.

- **Queue.** Sorted by status (pre-qualified conforming / anomalies detected / awaiting complement) and by age. The agent sees immediately where the real work is.
- **Dossier view.** One screen: each piece previewed beside its extracted data; for every field the extracted value, its confidence, and **the source region highlighted in the document** — the agent verifies at a glance instead of re-reading. Automatic checks listed with their legal basis. Points left to human judgement **surfaced, not buried**.
- **Actions.** Validate · Flag anomaly · Request complement (with a pre-filled reason returned to the business as remediation steps) · Annotate.
- **Audit trail.** Every action timestamped and attributed. Every automatic decision replayable: which rule, **which corpus version**, which article, what confidence. No decision is taken by the system — it prepares, the agent decides.
- **Agent benefit counter.** Live, in the dashboard, from actual throughput. The institutional value is measured by the product, not promised on a slide.
- **Public API hook.** Documented endpoints so an existing information system can pull a structured dossier, its conformity status and its audit trail. Adoption must not require replacing anything.

---

## 7. Legal and ethical guardrails

These are not caveats appended afterwards. They determine the positioning.

- **Regulated professions.** Loi n° 88-108 reserves the keeping, verification and certification of accounts to registered experts-comptables; loi n° 60-34 governs tax advice. Sanad is **documentary preparation and verification** — never account certification, never legal advice. A **"Partager avec mon expert-comptable"** function puts the professional explicitly in the loop: distribution channel, not adversary.
- **Filing and signature.** Filing goes through official portals with an ANCE / TunTrust certificate (DigiGo for legal persons, Mobile ID / e-Houwiya for natural persons). **Sanad neither signs nor files on the taxpayer's behalf.** It prepares; the user transmits through the official channel. Stated in the product and in the pitch.
- **Data protection.** Processing covers sensitive data (CIN, matricule fiscal, financials) under loi organique n° 2004-63 and INPDP oversight: prior declaration, explicit consent, minimisation, purpose limitation, controlled transfers. Tunisia ratified Convention 108 in 2017.
- **Liability for automated advice.** Three mechanisms: systematic citation of the legal source; confidence thresholds that hand off to human verification; and an explicit statement that the analysis does not substitute for a qualified professional's opinion.

---

## 8. What is verified vs. what is estimated

Say this distinction out loud. Judges punish invented precision far harder than honest estimation.

### Verified against primary or official sources

- TEJ XSD schemas — **downloaded and read directly**; 40+ operation codes, millime integers, matricule format, TVA enum
- **E-Sit-Fisc** exists, is reserved to public bodies, and was built in application of art. 62 LF2014 — DGI's own page
- **Art. 62 LF2014** — 1,000 DT TTC threshold conditioning public payment
- **Art. 32 / 51, loi 2018-52** — 7-month filing deadline; penalty of half the fee due per month; register suspension and referral to the prosecutor after a 15-day notice
- **Art. 53 LF2026** (loi n° 17-2025 du 12/12/2025) — e-invoicing extended to all services; TEIF XML via TTN El Fatoora; 100–500 DT per paper invoice, 50,000 DT annual ceiling
- **836,808 enterprises**; 103,518 employers; 89,958 micro, 12,663 SME, 897 large — INS / RNE 2024
- **Textract** supports French but **not** Arabic for structured extraction

### Estimated, and labelled as such in the product

Unit processing time per dossier, incomplete-dossier rate, monthly dossier volume. **Tunisian administrations do not publish these.** They are exposed as adjustable sliders in the dashboard so a DGI manager can enter their own figures and get the calculation on their real volumes, live.

### ❌ Cut entirely

**The World Bank "144 hours/year" figure.** Doing Business was [discontinued in September 2021](https://www.worldbank.org/en/news/statement/2021/09/16/world-bank-group-to-discontinue-doing-business-report) after an investigation found senior officials pressured staff to manipulate rankings. Flagging "série arrêtée en 2020" does not protect you — a well-read judge knows *why* it stopped. Its successor is **B-READY**. Source an equivalent there or use nothing; the INS figures are stronger and they are Tunisian.

### ⚠️ Still unverified — get a practitioner to confirm in writing

- **Art. 89, Code de l'IRPP et de l'IS** — the attestation for participation in marchés publics, and the 2-working-day delivery claim
- **RNE full-digital as of 1 July 2026**
- **Every withholding rate you demo.** One wrong rate in front of a DGI judge ends the pitch.

---

## 9. Sources

| What | Where |
|---|---|
| **TEJ XSD schemas** | https://jibaya.tn/wp-content/uploads/2024/05/plateforme-TEJ-shemas-xsd.zip |
| **E-Sit-Fisc** | http://www.impots.finances.gov.tn/index.php/fr/services-en-ligne/2015-11-06-16-15-01 |
| **Code des droits et procédures fiscaux 2024** | https://jibaya.tn/wp-content/uploads/2024/07/Code-des-droits-et-procedures-fiscaux-2024.pdf · HTML by article on [Jurisite Tunisie](https://www.jurisitetunisie.com/tunisie/codes/cdpf/cdpf1040.htm) |
| **Loi 2018-52 (RNE)** | https://legislation-securite.tn/latest-laws/loi-n-2018-52-du-29-octobre-2018-relative-au-registre-national-des-entreprises/ |
| **Loi de Finances 2026** | https://jibaya.tn/docs/loi-des-finances-2026-disponible-en-langue-arabe-uniquement/ — **Arabic only**; your Arabic pipeline is what lets you index it |
| **RNE data exchange (KYC web service)** | https://home.registre-entreprises.tn/echange_des_donnees/ |
| **UXP interoperability platform** | https://cyber.ee/resources/news/phase-2-tunisia-interoperability/ |
| **INS — Répertoire National des Entreprises 2024** | https://www.ins.tn/sites/default/files-ftp3/files/publication/pdf/RNE%202024.pdf |
| **192 digitisation projects to 2030** | https://www.ecofinagency.com/news-digital/1702-52981-tunisia-launches-192-project-plan-to-fully-digitize-public-services-by-2030 |

> ⚠️ **Corpus scope discipline.** Do not index "all Tunisian law". Index what these six checks actually touch: the withholding articles of the IRPP/IS code, the TVA regime articles, art. 62 LF2014, arts. 32/51 of loi 2018-52, and the operation-code descriptions from the XSD itself. Narrow sources retrieved precisely beat a thousand pages retrieved vaguely — that is the difference between citing correctly and citing plausibly.

---

## 10. Build order (hours from kickoff)

### H0 – H3 · Contract first

- Parse the XSD into a generated **code enumeration + TypeScript types**. Unblocks all other workstreams — do it before anything else.
- Agree the internal `Dossier` and `Certificate` objects once, in one file, and **freeze them**.
- Repo, Postgres + pgvector, hello-world Bedrock call. **Confirm Bedrock model access now**, not at hour 30.
- Golden-path fixture: one contract, one invoice, one registry extract, and the expected findings.

**Gate** — a hand-written XML fixture validates against the real XSD.

### H3 – H12 · Vertical slice, ugly

- One dossier → Textract → typed fields → checks 1–3 → findings list → officer queue → approve → audit row.
- Corpus ingested, chunked by article, retrieval returning something sane.

**Gate** — end to end works for exactly one dossier. Everything after this is depth.

### H12 – H24 · Make it right

- **Checks 4, 5, 6** — the RAG-backed ones. Finding → verbatim article → corrective action.
- **Check 5 in full**: classifier constrained to the enumeration, confidence threshold, escalation path, deterministic computation, XSD-valid emission.
- Counterparty verification behind an interface; art. 32 filing signal included.
- Immutable audit log with corpus versioning.

**Gate** — a wrong-code scenario is caught and explained with a citation.

### H24 – H36 · Make it legible

- Design pass on the **officer console** specifically. It is the prize-bearing surface and the screen most teams leave ugly.
- Source-region highlighting on extracted fields. This is the feature agents will react to.
- Bilingual FR / AR with RTL.
- The **live savings calculator**, sliders fed by real throughput.

**Gate** — a stranger can operate the officer console without narration.

### H36 – H44 · Rehearse, then freeze

- Seed the demo database. Rehearse the three-minute run **five times**, timed, aloud.
- Record a screen capture as fallback. Venue wifi will fail.
- **Feature freeze at H40.**

**Gate** — the pitch lands under 3:00 with the Agency Benefit slide getting its full 45 seconds.

### Later — if you have weeks, not hours

- Second document type through the same pipeline, proving generalisation rather than asserting it. **Facture électronique / TEIF is the obvious next one** — same shape, published format, mandatory since January.
- Real RNE web service subscription. Ask now; procurement is slow.
- An eval set over check 5: real invoices, expert-labelled codes, a **measured accuracy number**. A team that shows measured accuracy beats every team that shows a demo.

---

## 11. Four people: split by surface, not by layer

Layer splits produce merge conflicts and blocked dependencies. Surface splits let four people and three Claude accounts work in different directories all weekend. Freeze the shared types in hour one and the seams hold.

| Owner | Surface | Scope | Directories |
|---|---|---|---|
| **A** | Officer console | Queue, dossier view, source-region highlighting, actions, audit view, savings calculator | `app/(officer)/**` · `components/review/**` |
| **B** | Ingest & extraction | Upload, S3, language routing, Textract / Claude vision, field normalisation, confidence scoring | `lib/ingest/**` · `lib/ocr/**` |
| **C** | Rules, RAG & XML | Corpus ingest and chunking, retrieval, the six checks, constrained classifier, deterministic engine, XSD emission and validation | `lib/rules/**` · `lib/rag/**` · `lib/tej/**` |
| **D** | Pitch & ground truth | **Find a practitioner.** Savings model, deck, demo script, timing, seed data, rehearsal, fallback recording | `deck/**` · `fixtures/**` |

> **Owner D is not the spare person.** One sentence from a real accountant — *"a rejected dossier costs me three weeks of cash flow"* — outweighs any feature shippable in the same hours, because it is the only thing that makes the Agency Benefit slide credible rather than modelled. Assign your most persuasive teammate, not your least technical one. **Message every accountant you know today**; lead time is the constraint, not willingness.

---

## 12. $120 AWS

At demo scale — a few hundred documents — inference and OCR together cost single-digit dollars. Every burned hackathon budget is something left running.

| Service | Shape | Call |
|---|---|---|
| **Textract** | AnalyzeDocument Forms ~$0.05/page, Tables ~$0.015/page; DetectDocumentText a fraction of that | ✅ Use it — prefer DetectDocumentText where layout allows |
| **Bedrock** | Partner-operated pricing. Negligible at demo volume | ✅ Use it |
| **OpenSearch Serverless** | Bills a minimum OCU floor whether or not you query it | ❌ **Never** — it will silently eat the entire $120 |
| **RDS / EC2** | Bills while idle, including the 14 hours you are asleep | ⚠️ Postgres in Docker locally; deploy once, late |
| **S3** | Pennies | ✅ Use it |

> ⚠️ **Set a billing alarm at $25 in hour one.** Two minutes of work.

---

## 13. The Agency Benefit (mandatory slide, 45 seconds)

Title it exactly **"The Agency Benefit"**. A judge with a rubric is ticking a box; do not get creative.

Build it as a **live calculator inside the officer console**, not a static graphic.

```
Agent hours saved / month
  = dossiers processed / month
  × (time for a non-pre-qualified paper dossier
     − time for a pre-qualified structured dossier)
  + rework avoided
  × average round-trip time for an incomplete dossier
```

**What DGI can verify in their own systems:**

- **Incomplete dossiers that never arrive.** The rework loop — notify, wait, re-receive, re-verify — is removed rather than accelerated.
- **Rectificatives avoided.** Every mis-coded certificate produces an `ActeDepot=1` filing. The TEJ schema itself distinguishes initiale from rectificative, so **DGI already counts this number.** You are reducing a figure they track.
- **Disputes never opened.** 30 % penalty, min. 50 DT per certificate, generates réclamations an officer must adjudicate.
- **Helpdesk deflected.** "Which code do I use?" on a platform mandatory since January.

**How to say it:**

> "We don't have DGI's internal figures. Here is our model, built from an interview with a practising accountant, and here are the sliders. Give us your real volumes and we'll compute it live."

Then **do it.** A judge changing a number and watching the figure move is the moment they stop evaluating a demo and start evaluating a supplier.

International comparables — Estonia's X-Road, the EU "once-only" principle — are **orders of magnitude, not Tunisian measurements.** Label them that way out loud.

---

## 14. Demo script (3:00)

Split screen throughout: business left, officer right. Narrate what it *means*, never what the audience can see.

| Time | Beat |
|---|---|
| **0:00–0:18** | **The obligation.** Article 62: no payment above 1,000 DT without a verified fiscal dossier. *"The work is delivered. The invoice is not paid. One missing piece restarts the clock."* |
| **0:18–0:32** | **Pre-empt E-Sit-Fisc.** *"DGI already dematerialised one piece of this dossier. That proves the direction. It answers one question, for one actor. We do the other five — and the coherence between them."* |
| **0:32–0:55** | **Live run.** Drop the dossier in. Extraction with confidence scores, source regions highlighted. Checks 1–3 pass silently. |
| **0:55–1:35** | **The hard checks.** TVA regime mismatch flagged. Then **the three `RS7` codes**: *"Same invoice, same supplier, three codes. What separates them is the supplier's corporate tax rate — which isn't on the invoice. That's why we verify the counterparty in the same pass."* |
| **1:35–1:50** | **The citation.** Open a finding, show the verbatim article. *"The model didn't recall this. It retrieved it. No citation, no conclusion."* One field is flagged low-confidence and escalated rather than guessed — **point at it.** |
| **1:50–2:05** | **The file.** Export, validate against the DGI's published XSD, green. *"That's not a mockup. That's the schema the DGI reissued four days ago."* |
| **2:05–2:20** | **The officer.** Switch right. Queue, evidence, legal basis per check, one approve, one complement request whose reason lands on the business side as remediation steps. |
| **2:20–3:00** | **The Agency Benefit.** Slide, then the live calculator. Invite a judge to change a number. Close on UXP and e-Houwiya: *"We're not asking DGI to adopt new infrastructure. We connect to the one they already built."* |

> **The escalated field is the most important second in the demo.** Every other team's AI will be confidently right about everything. Yours says *"I can't determine this one — here's the fact I'm missing."* In a room judging **justice**, a system that knows the edge of its own competence reads as trustworthy in a way a perfect score never does.

---

## 15. What will go wrong

| Risk | Severity | Mitigation |
|---|---|---|
| **A judge raises E-Sit-Fisc first** | 🔴 Critical | Pre-empt it at 0:18. Scripted, rehearsed, delivered before anyone asks. Turn it into your endorsement. |
| **Rates are wrong** | 🔴 Critical | Secondary sources already contradict each other. Primary text only, article shown, practitioner sanity-checks the codes you demo. |
| **Scope creep** | 🔴 Critical | Three pieces, six rules, one deep check. The generalisation table is a slide, not a sprint. |
| **"This is a checklist with OCR"** | 🟠 High | Lead with checks 4, 5, 6. Never open on completeness. |
| **Arabic OCR** | 🟠 High | Textract will not do structured extraction on Arabic. Route to Claude document vision. Decide in hour one. |
| **Officer console left ugly** | 🟠 High | It is the prize-bearing surface. Owner A owns nothing else. |
| **Venue network** | 🟠 High | Record the full flow at H40. Every failed live demo failed on wifi. |
| **A cited article is wrong** | 🟠 High | The unverified list in §8 gets practitioner confirmation before it reaches a slide. |
| **ECC / tooling rabbit hole** | 🟡 Medium | Agent harnesses optimise how you code, not what you ship. Not working in twenty minutes → drop it. |
| **"This already exists"** | 🟡 Medium | Accounting suites do bulk export. None decide from the law with a citation, none verify the counterparty in the same pass, none give the agent a review surface. Say it before a judge does. |

---

## 16. Hour zero — before anyone writes application code

- [ ] **Read `TEJRSCodesOperations_v1.0.xsd` end to end, as a team.** Twenty minutes. It is the problem statement, written by the DGI.
- [ ] **Confirm Bedrock model access is enabled in your region.** It is a console toggle and it is off by default. Discovering this at hour 30 has ended hackathons.
- [ ] **Set the AWS billing alarm at $25.**
- [ ] **Generate the code enumeration and shared types from the XSD, commit, freeze.** The single dependency unblocking all four workstreams.
- [ ] **Get a schema-valid XML fixture passing validation** — before any AI is involved. Your objective scoreboard for the weekend.
- [ ] **Owner D: message every accountant anyone knows, today.**
- [ ] **Write the E-Sit-Fisc rebuttal and rehearse it aloud.** It is the single most likely question and the one that decides the room.
- [ ] **Agree out loud that the officer console is the product.** Every team that loses this prize decided otherwise by default, at 4am, without discussing it.

---

## 17. What we deliberately cut

| Cut | Why |
|---|---|
| Five-piece dossier → **three** | Surface area is not depth. Patente and attestation are stubbed and mentioned. |
| Five rule categories → **six named rules** | A judge can hold six rules in their head. They cannot audit a category. |
| Generic "any document" ingestion | It is the roadmap slide. The type classifier exists but routes to one implemented rule set. |
| Opaque risk score | Replaced by the explainable grid — each criterion listed, weighted, legally grounded, contestable. A score nobody can audit has no institutional value. |
| Doing Business 144h | Discontinued in 2021 after a data-manipulation investigation. A liability, not a statistic. |
| International expansion section | True, but it reads as padding in a three-minute pitch. One sentence at most. |

---

*Verification status is tracked in §8. The TEJ schemas were downloaded and read directly; art. 62, E-Sit-Fisc, arts. 32/51 of loi 2018-52, art. 53 LF2026 and the INS statistics were confirmed against official or primary sources. Withholding rates, art. 89, and the RNE full-digital date remain unconfirmed and must not reach a slide until a practitioner signs off. Secondary Tunisian tax publications **disagree with one another on at least one rate** — treat every figure as a starting point for verification, not as settled law. That verification is the product.*
