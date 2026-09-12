# Sanad — Master Plan · Source of Truth

**Hack4Justice 2026 · Challenge A · Regulatory AI & Fiscal Compliance**

This document defines what we are building and why. It deliberately avoids implementation detail — *how* we build each piece is decided during the build, with better information than we have now. What is fixed here is the idea, the scope, the roles, the design direction, and the verification discipline.

> **Changes in this revision.** The Doing Business figure is removed (§1). The rule registry is split into deterministic and assisted rules (§3). The TEJ withholding certificate is added as the showcase and the external validation beat (§4). The Perplexity signal search is cut to roadmap (§8). E-Sit-Fisc is promoted from a Q&A answer to the opening twenty seconds (§2). Officer permissions no longer allow silent edits (§5). Build phases now carry hours, owners and gates (§15). A verification ledger is added (§16).

---

## 1. The problem

Tunisian MSMEs continuously produce and receive documents that carry legal or fiscal weight — contracts, invoices, patentes, statutes, RNE extracts, tax attestations — without the time, legal expertise, or budget to verify their compliance or assess the risk of the third parties they work with.

The structure of the economy makes this systemic: of **836,808 registered private enterprises** at end-2024, roughly **87 % have no employees** (INS / RNE 2024). No legal department, no tax function, often no full-time accountant.

And 2026 raised the bar on exactly those businesses. Two obligations landed on **1 January 2026**, both with published machine-readable formats:

| Obligation | Format | Penalty |
|---|---|---|
| **TEJ** — withholding certificates (*Transfert et Échange des Données Fiscales*) | XML against a published **XSD**, or manual web entry | 30 % of the withholding, min. 50 DT **per certificate** |
| **Facture électronique** — art. 53 LF2026, extended to **all services** regardless of amount, company size or tax regime | **TEIF XML** via the TTN **El Fatoora** platform | 100–500 DT per paper invoice, 50,000 DT annual ceiling |

The DGI added new TEJ functionality and reissued the XSD on **8–9 September 2026**, days before this hackathon.

On the administration side (DGI, RNE, APII), the absence of upstream verification produces a steady stream of incomplete or inconsistent files. Every badly assembled file triggers a manual round-trip — piece-by-piece checking, a request for what is missing, another queue — that consumes agent time without producing value.

> **❌ Do not cite the World Bank "144 hours per year" figure.** Doing Business was [discontinued in September 2021](https://www.worldbank.org/en/news/statement/2021/09/16/world-bank-group-to-discontinue-doing-business-report) after an investigation found senior officials pressured staff to manipulate rankings. Flagging "series ended 2020" does not protect us — a well-read judge knows *why* it stopped, and it contaminates everything after it. Its successor is **B-READY**. The INS figures above are stronger and they are Tunisian.

---

## 2. The legal anchor — and the objection we open with

**Article 62, Finance Law 2014** — any payment by the State, local authorities, or public establishments to a supplier, for an amount **≥ 1,000 DT including tax**, is conditional on producing an attestation from the tax services confirming the supplier has filed all due tax declarations.

**For the business:** to get paid, it assembles a physical file — contract or purchase order, invoice, patente, RNE extract, tax situation attestation. The attestation for public procurement is issued within 2 working days of a *complete* filing, but requires a trip to the tax office, and **the clock restarts if a piece is missing**. Meanwhile the invoice goes unpaid. For a micro-business that is a cash flow problem, not a paperwork problem.

**For the administration:** the public accounting officer manually verifies every piece, checks validity, cross-references identifiers, and returns the file when something is off.

### ⚠️ E-Sit-Fisc — the question that decides the room

The DGI's own page:

> *"…permettant de consulter et d'éditer en ligne la situation fiscale de leurs fournisseurs… **en application des dispositions de l'article 62 de la loi de finances pour l'année 2014**… principalement par **la dématérialisation des attestations de la situation fiscale**."*
> — [impots.finances.gov.tn](http://www.impots.finances.gov.tn/index.php/fr/services-en-ligne/2015-11-06-16-15-01)

DGI built E-Sit-Fisc **for this exact article**, and its stated purpose is **dematerialising the attestation**. The piece our narrative centres on is the one piece DGI has already digitised for this workflow. A DGI judge knows this cold — it is their own service.

**So we raise it first, at 0:18, and turn it into the endorsement.** Scripted, rehearsed, delivered before anyone asks:

> "DGI already dematerialised one piece of this file — E-Sit-Fisc, built specifically for article 62. That proves the demand and it proves the direction. But E-Sit-Fisc answers one question for one actor: *is this supplier fiscally clear?* It does not tell the business **before** it submits whether the rest of the file will be rejected, it does not check the other pieces, and it does not check consistency between them. We do that — and we hand the result to the same officer."

**Do not sell the 2-day delay.** It is fast, and citing it undercuts us. The pain is the **round trip**: one missing or inconsistent piece restarts the clock while the invoice goes unpaid.

That gap is the product: pre-qualify the file on the business side, so the agent receives a file that is already verified, structured, and sourced.

---

## 3. The solution

A platform that ingests any document a business holds or receives, checks it against Tunisian regulation, verifies the third parties involved, and hands the administration a pre-qualified file.

Compliance checking runs against a **registry of coded rules**, each carrying the exact legal article that grounds it, backed by retrieval over the relevant Tunisian regulatory corpus.

This choice is institutional, not technical. A model answering from memory can hallucinate or rely on a repealed text. Here every conclusion traces back to the article that grounds it and displays it as evidence. That is the condition for an administration to trust the system: a flagged anomaly is not the model's opinion, it is a rule found in the corpus, quoted verbatim, with its source and date.

### Three principles

1. **Traceability by default** — no conclusion without a clickable legal reference.
2. **Uncertainty is a result, not a failure** — when the system is not confident, it says so and asks a human, rather than producing a plausible but unverified answer.
3. **Assistance, not substitution** — the platform prepares, verifies, and structures. It does not sign, does not file, and does not replace any regulated profession.

### Two kinds of rule — and why this matters

If every compliance check were an open question posed to a model, results would vary between runs, would not be auditable, and could hallucinate. So **the model never judges compliance.** But if the model only did OCR and chat, the honest question back would be *"so this is a rules engine with a chatbot — where is the AI?"*

The registry therefore holds two rule kinds. In both, **a rule judges compliance; the model never does.**

| | **Deterministic rule** | **Assisted rule** |
|---|---|---|
| Input | Fields already on the documents | A **fact the documents do not state**, supplied by the model |
| Model's job | None | Propose that fact, with confidence and rationale |
| Who judges compliance | The rule | The rule |
| On low confidence | n/a | Escalate to a human; never assume |
| Example | Tax identifier identical across all pieces | *This supplier is a legal person taxed at 15 %* → rule then selects the applicable withholding code |

Roughly **25–35 rules** covers the demo workflow convincingly. Most are deterministic. **Three are assisted, and those three are the demo.** A rule without a verbatim citation does not enter the registry.

> **The pitch line, unchanged:** *"Our compliance checks are deterministic and versioned — the same document always produces the same result, and every rule carries its article. The model extracts and explains; it does not judge."*
>
> **The follow-up, when asked where the AI is:** *"Some rules need a fact the document doesn't contain. The model supplies that fact with a confidence score; the rule still makes the compliance decision, and below threshold it goes to a human."*

---

## 4. The three assisted rules — and the showcase

| # | Assisted rule | The fact the model must supply | Why it can't be coded |
|---|---|---|---|
| A1 | **VAT charged vs. the supplier's permitted regime** | The supplier's declared fiscal regime | Not on the invoice; a classic rejection cause |
| A2 | ⭐ **Retenue à la source — is it due, at what rate, under which TEJ operation code** | The supplier's legal form, tax regime **and** residency | None of the three appear on the invoice |
| A3 | **Contract object vs. activity declared at RNE** | A semantic match between free text and a nomenclature entry | Requires meaning, not string comparison |

### A2 is the showcase

The DGI publishes the TEJ XSD schemas. We downloaded them — three files, 2,853 lines.

| Schema file | Lines | Pins down |
|---|---:|---|
| `TEJDeclarationRS_v1.0.xsd` | 512 | Declaration envelope, certificate and operation structure, amounts, identifiers |
| `TEJRSCodesOperations_v1.0.xsd` | 189 | Full enumeration of withholding operation codes with legal descriptions |
| `TEJISOPaysDevises.xsd` | 2,152 | ISO country and currency codes for non-resident payments |

**Three codes, one invoice:**

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

**This is why compliance checking and third-party verification must run in a single pass.** It is not an architectural preference; it is forced by the law. It is also the most persuasive thirty seconds available to us.

### External validation — the only moment an outside authority agrees with us

Every other artifact in the demo is self-defined: our report, our structured file. **The TEJ export is the exception.** Serialise it, validate it against the DGI's published XSD live on screen, green.

> *"That's not a mockup. That's the schema the DGI reissued four days ago."*

Eight seconds, and the only proof in the run that does not come from us.

### Schema constraints to respect from hour one

- **Amounts are integers in millimes** — `xs:integer`, *"sans partie décimale"*. A float anywhere in the pipeline is a rejected declaration.
- **Matricule fiscal** — 7 digits concatenated with a letter, plus `CategorieContribuable` of `PM` or `PP`.
- **VAT is an enum** — only `7.0`, `13.0`, `19.0` validate.
- **Five identifier types** — matricule fiscal, CIN, passport, carte de séjour, other. Non-residents route differently and carry a country code.
- **Per-operation flags** — `CNPC` (double-taxation treaty) and `P_Charge` (withholding borne by the payer) both change the arithmetic.
- **Parse the enumeration, don't retype it.** Generate the code list from `TEJRSCodesOperations_v1.0.xsd` at build time. Forty hand-copied codes is forty typos to debug at 3am.

> ⚠️ **Do not trust rate tables found on the web.** Two Tunisian tax blogs give contradictory rates for fees paid to BNC professionals under the régime réel. That contradiction *is* the argument for the product — and it is a reason to have a practitioner sign off on every rate we demo.

---

## 5. Users and roles

Four roles. Two products sharing one verified dataset.

| Role | Who | Primary job |
|---|---|---|
| `msme_owner` | Business owner or manager | Assemble compliant files, understand what is wrong and how to fix it |
| `msme_accountant` | External expert-comptable, invited by the business | Review and correct files before submission |
| `officer` | DGI / RNE / APII / public accounting agent | Review, validate, flag, or request completion |
| `admin` | Platform administrator (in the demo: **the jury**) | Inspect the rule registry, adjust benefit parameters |

### Permission matrix

| Capability | `msme_owner` | `msme_accountant` | `officer` | `admin` |
|---|:--:|:--:|:--:|:--:|
| **Files and documents** | | | | |
| Create a file | ✅ | ❌ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ❌ | ❌ |
| View own company's files | ✅ | ✅ (invited only) | ❌ | ❌ |
| View any submitted file | ❌ | ❌ | ✅ (own agency) | ✅ (read-only) |
| Delete a draft | ✅ | ❌ | ❌ | ❌ |
| **Extraction and compliance** | | | | |
| Confirm a low-confidence field | ✅ | ✅ | ❌ | ❌ |
| Re-run analysis | ✅ | ✅ | ❌ | ❌ |
| View the compliance report | ✅ | ✅ | ✅ | ✅ |
| Open a legal citation | ✅ | ✅ | ✅ | ✅ |
| **Third-party verification** | | | | |
| Run a registry check | ✅ | ✅ | ✅ | ❌ |
| View raw sources behind a finding | ✅ | ✅ | ✅ | ✅ |
| **Submission and review** | | | | |
| Submit a file to the administration | ✅ | ❌ | ❌ | ❌ |
| Withdraw before review | ✅ | ❌ | ❌ | ❌ |
| Validate a file | ❌ | ❌ | ✅ | ❌ |
| Flag an anomaly | ❌ | ❌ | ✅ | ❌ |
| Request additional documents | ❌ | ❌ | ✅ | ❌ |
| Request correction of a field | ❌ | ❌ | ✅ | ❌ |
| Annotate | ❌ | ✅ (internal) | ✅ | ❌ |
| Assign a file to an agent | ❌ | ❌ | ✅ | ❌ |
| **Transparency and settings** | | | | |
| View the audit trail | ✅ (own) | ✅ (own) | ✅ | ✅ |
| Replay an analysis | ❌ | ✅ | ✅ | ✅ |
| Browse the rule registry | ✅ (read) | ✅ (read) | ✅ (read) | ✅ |
| Edit benefit parameters | ❌ | ❌ | ❌ | ✅ |
| View agency metrics | ❌ | ❌ | ✅ | ✅ |
| Invite an accountant | ✅ | ❌ | ❌ | ❌ |
| Ask the regulatory assistant | ✅ | ✅ | ✅ | ✅ |

### Why these roles

**The accountant is strategic, not decorative.** Loi 88-108 reserves habitual bookkeeping, verification, and certification of company accounts to registered experts-comptables. Building the accountant in as a first-class invited reviewer — who can correct and annotate but cannot submit — turns the profession from an objection into a distribution channel, and answers *"isn't this the accountant's job?"* directly.

**The officer is scoped by agency.** An agent sees their own agency's queue. Small detail, but it is the first thing a public official checks.

**🔧 The officer cannot edit the submitted file.** In administrative process the agent does not fix the citizen's file — they return it. Letting an officer silently confirm fields and re-run analysis muddies who is responsible for the conclusion and competes with our own *request completion* flow. **The submitted file is immutable.** The officer annotates, flags, or requests a correction that the business applies and resubmits. Cleaner audit story, and defensible in front of anyone with process background.

**The admin role exists for the jury.** Handing them a login that lets them inspect the rules and change the benefit assumptions is a stronger argument than any slide. This is the best single idea in the plan — protect it in the cut list.

---

## 6. What each role can do

### MSME owner
- **Dashboard** — files in progress, files awaiting the administration, deadlines, current status
- **File creation** — choose a file type and see the required document checklist up front, each item with its legal basis
- **Upload** — multiple documents, mixed formats, mixed languages
- **Extraction review** — structured fields with confidence indicators; uncertain fields surfaced for confirmation before analysis continues
- **Compliance report** — blocking points, attention points, passed checks, each with its article and a concrete fix
- **Third-party verification** — registry status on every company named in the file
- **Regulatory assistant** — free-form questions answered with citations
- **Invite an accountant** to review a file
- **Submit** the pre-qualified file
- Track status, agent requests, history

### MSME accountant
- Read and annotate invited files
- Correct extracted fields and re-run analysis
- Replay an analysis to see exactly which rule produced which conclusion
- Internal annotations, not visible to the administration
- **No submission right** — the business remains the submitter. Deliberate and defensible: the platform never acts in place of the taxpayer.

### Officer
- **Queue** with live indicators, persistent filters, and a smart default sort
- **File view** — source documents, extracted fields with source highlighting, automated checks with their legal basis, points left to human judgment
- **Four actions** — validate, flag, request completion (pre-filled from blocking findings), annotate
- **Assignment** — take a file or pass it to a colleague
- **Audit trail** with replayable analysis
- **Agency metrics** — agent hours saved, pre-qualification rate, average processing time

### Admin
- Browse the rule registry with every check and citation
- Edit the four benefit parameters with instant recalculation
- Read-only access to any file for demonstration

---

## 7. How a file moves through the system

1. **Documents arrive.** Any format, any language.
2. **The system reads them.** Each document is classified and its fields extracted — parties, identifiers, amounts, dates, fiscal mentions, clauses. Every field carries a confidence level.
3. **Uncertainty surfaces.** Anything the system could not read reliably is flagged and shown for confirmation **before analysis proceeds**. It never guesses silently.
4. **Deterministic rules run.** Presence, format, cross-document equality, date ordering.
5. **Assisted rules run.** The model proposes the missing facts (regime, legal form, residency, activity match) with confidence; the rules judge compliance from them; below threshold, escalate.
6. **Third parties are checked** against the registry.
7. **A report is produced.** Not a score: an auditable checklist where every line has a legal basis and every weight is visible.
8. **The TEJ export is generated and validated** against the published XSD.
9. **The file is submitted.** It arrives in the officer's queue already structured, with every automated check performed and recorded.
10. **The officer decides.** They verify what needs human judgment, and validate, flag, or request completion. The system never decides.

**Bilingual by design.** French and Arabic documents go through the same path. Tunisian administrative documents are bilingual; handling that natively rather than as a special case is a requirement, not a nice-to-have. Note that **AWS Textract does not support Arabic for structured form and table extraction** — Arabic routes to model-based document vision. Decide this in hour one, not hour thirty.

---

## 8. Third-party verification

### Registry verification — factual, and the only kind we ship

Every company named in the file is looked up in accessible registries (RNE simulated for the demo, architecture ready for the official service):

- **Legal existence and status** — active, struck off, in proceedings
- **Registration date and age**
- **Consistency between declared activity and the contract's object** (assisted rule A3)
- **Financial statement filing**, mandatory within **7 months** of fiscal year-end (**Art. 32, Loi 2018-52**), with late filing penalised at **half the fee due per month of delay** (**Art. 51**)
- **Register suspension exposure** — where the Centre finds required operations incomplete, it notifies the company, allows **fifteen days**, and failing that **suspends the company's register and transmits the report to the public prosecutor**. A suspended register is existential: no extrait, no bidding, no normal operation. This is a far stronger regularity signal than a late-filing fee, and it is publicly grounded.

**Stated limitation, displayed in the product:** we do not claim to know a third party's tax arrears or litigation. That information is not public in Tunisia; only the DGI's E-Sit-Fisc holds it, and it is reserved to public bodies. The product says what it knows and explicitly flags what it cannot know.

### ❌ Cut: the public signal / adverse-media search

Previously specified via the Perplexity API. **Cut to roadmap.** Three reasons, escalating:

1. **It will demo as "0 signals found."** Tunisian MSMEs have essentially no press coverage. Making it look alive would require fictional companies with fabricated coverage — worse than not having it.
2. **It is a second vendor**, paid, external, outside the AWS credits, and invites *"why not the platform you already committed to?"* (Check whether a web search tool is available on the Bedrock path before ever adding a dependency.)
3. **It is off-thesis.** Our entire credibility argument is *"no conclusion without a clickable legal reference."* The signal search is the one feature in the product that cannot cite a law — and it required five paragraphs of defamation guardrails around the component that weakens our strongest card.

If it is ever revived, the guardrails previously written stand and are non-negotiable: signals never conclusions, companies never individuals, always sourced, always labelled unverified, always dismissible, never affecting compliance status.

### Consolidated view

One panel, two blocks in order of evidential weight: **registry facts (verified)**, and **not verifiable by us (explicitly listed, with the reason)**. That second block is what makes the first credible.

---

## 9. Design direction

UI/UX is the top priority. This section is prescriptive; everything technical is not.

### The brief

A compliance instrument used by two very different people: a small business owner under financial pressure, and a public officer working a queue. It must feel trustworthy, precise, and institutional without being bureaucratic or dated. The reference is not a startup SaaS dashboard — it is a well-made professional instrument: legal publishing, official documents, verification tooling.

It is also bilingual French/Arabic, and that constraint should drive the typography rather than be retrofitted.

### Palette

Drawn from the material world of the subject: paper, ink, official stamps, registry ledgers.

```
--paper:       #FAF8F4   warm document ground, not white
--paper-sunk:  #F1EDE6   recessed surfaces, table stripes
--ink:         #16211F   near-black with a green cast, like stamp ink
--ink-soft:    #5A6764   secondary text
--rule:        #DBD5CA   hairlines and borders
--seal:        #1F4D3F   primary — deep registry green
--seal-wash:   #E6EFEA   primary tint for selected states
--cachet:      #A8342A   blocking status only — stamp red
--amber:       #A97420   attention status only
--verified:    #2F6B4F   passed status only
```

**Colour carries status and nothing else.** The three status colours never appear as decoration — seeing red on screen must always mean a blocking issue. `--seal` is the only interactive colour: links, primary buttons, focus rings. Everything else is ink on paper.

This deliberately avoids the two palettes that dominate generated interfaces — cream with terracotta, and near-black with an acid accent. A green-ink primary with a stamp-red critical is grounded in administrative documents rather than in a template.

### Typography

One family across both scripts: **IBM Plex Sans** and **IBM Plex Sans Arabic**. Open source, with genuinely matched Latin and Arabic designs — which matters enormously here, because a French field label and an Arabic extracted value will sit in the same table row. Most pairings fall apart at exactly that point. Plex has a civic, engineered character that suits an instrument rather than a brand.

For legal text quoted verbatim in citation panels, **IBM Plex Serif**. The change in texture does real work: it signals that the law is speaking, not the interface.

Use **tabular figures** for every amount, identifier, date, and confidence score. Numbers that jitter between rows read as amateur in a financial tool.

Avoid all-caps labels, single accented words inside headings, and eyebrow labels above every section. These are the standard tells of a generated page.

### Layout

**Officer console: dense.** A professional tool is judged on how much is legible without scrolling. Tight rows, hairline separators, horizontal space given to content rather than padding.

**MSME interface: calmer.** The user is stressed and non-expert. More whitespace, one primary action per screen, sequential progression.

This asymmetry is intentional and worth saying out loud in the pitch: two interfaces, two audiences, two densities.

**Structure through hairlines, not cards.** Avoid chopping content into identical rounded boxes with identical soft shadows — the single most recognisable generated-dashboard pattern. Build hierarchy with rules, background shifts, and spacing. Reserve elevation for things that genuinely float: the citation panel, modals, dropdowns. Vary border radius by hierarchy rather than applying one value everywhere.

### Quality floor, unannounced

Visible keyboard focus everywhere. Reduced motion respected. Contrast checked on every status colour. Skeleton content on loading states, never a spinner on a blank screen. Empty states that say what to do next. Errors that state what happened and how to fix it.

---

## 10. Motion

Used with discipline. Motion exists to explain what changed — and one moment in the demo should be genuinely memorable.

### The one orchestrated moment

**A new file arriving in the officer's queue.** This is the proof that the B2G bridge is real, and the only place to spend real animation budget.

The pending counter increments. Existing rows shift down in a genuine reflow — not a fade. The new row enters with a brief coloured left border that fades over a couple of seconds, and its background settles from the primary tint to transparent. Roughly 900 ms end to end.

Use layout animations so the list visibly rearranges. It looks far better than a fade-in, and it needs to be readable from the back of the room.

### Motion that answers an action

| Interaction | What moves |
|---|---|
| Hover an extracted field | Its region highlights in the document |
| Click a finding | Citation panel slides in from the right |
| Expand an article | Height opens smoothly |
| Confirm an uncertain field | Confidence indicator transitions, row settles |
| Validate a file | Row exits the queue, counter ticks up |
| Filter the queue | Rows reorder in place, no fade |
| Submit a file | Pipeline stages check off in sequence |
| **XSD validation passes** | **Status resolves to green in place — no bounce, no confetti** |

### Motion that is forbidden

- Fade-and-slide-up on every section at page load
- Hover lift and shadow on every card
- Scroll-triggered reveals
- Anything longer than 400 ms outside the orchestrated moment
- Animated gradients, floating shapes, particles
- Statistics counting up on page load

These read as generated, and in an institutional tool they read as unserious. Nothing above the fold animates on first paint — the page is readable immediately.

---

## 11. Screens

**MSME dashboard.** Status as a plain sentence, not a gauge: *"2 files awaiting submission, 1 under review at the DGI."* Below, the list of files. One primary action.

**File creation.** The required document checklist appears **before** upload, each item with its legal basis on tap. Knowing what is expected before you start is itself a large part of the value.

**Upload.** Mixed formats and languages. Each document shows visible progress: received → read → classified → checked.

**Extraction review.** Document preview on the left, extracted fields on the right. Uncertain fields pulled to the top of their group with a clear prompt. Hovering a field highlights its source region. The tone asks for help rather than reporting failure: *"Confirm this amount — the scan is unclear."*

**Compliance report.** Blocking points, attention points, passed checks. Each finding shows the issue in plain language, the exact article in serif type in an expandable panel, and a concrete fix. **Assisted-rule findings additionally show the fact the model supplied and its confidence** — e.g. *"Supplier identified as a legal person taxed at 15 % (confidence 0.91) → code RS7_000002 applies."* No score.

**Third-party view.** Registry facts, and the explicit *"not verifiable by us"* block.

**TEJ export.** The certificate preview, the generated XML, and the validation result against the published XSD. This screen exists for eight seconds in the demo and it is worth building properly.

**Officer queue.** Four indicators in the header: pending files by status, **agent hours saved this month** (the most important element on the screen), pre-qualification rate, average processing time with month-over-month comparison. Table columns: company, object, amount, pre-qualification status, anomaly count, age, assigned agent. Persistent filters in a sidebar. **Default sort: oldest first among compliant files** — the agent sees what they can clear quickly. That is a product decision that shows the workflow was considered, not just the aesthetics.

**Officer file view.** Three columns. *Left:* documents, with a viewer — hovering an extracted field highlights the corresponding region. **That gesture is what sells the console.** *Centre:* extracted fields grouped by category, uncertain ones surfaced at the top, read-only. *Right:* automated checks with expandable articles, then the points left to human judgment, visually distinct. Fixed action bar at the bottom. The completion-request form is pre-filled from the blocking findings — the agent reviews and sends, they do not compose.

**Audit trail.** Vertical chronology of every event, timestamped and attributed. A replay action shows exactly which rule, which article, **which corpus version**, and which confidence produced each conclusion. Opened for three seconds in the demo while saying: *"no decision is made by the system, and every one is replayable."*

**Admin.** The rule registry, browsable, with the deterministic/assisted split visible. The four benefit parameters, editable, recalculating instantly.

---

## 12. The agency benefit

The mandatory slide, and the strongest shot at the Institutional Adoption Prize. Title it exactly **"The Agency Benefit"** — a judge with a rubric is ticking a box.

```
Agent hours saved per month
  = files processed
  × (time to process a paper file − time to process a pre-qualified file)
  + files processed × rework rate × time cost of one round-trip
```

**Verified inputs:** the 1,000 DT threshold and the control obligation (Art. 62 LF2014); the existence and scope of E-Sit-Fisc; the 7-month financial statement deadline, its penalty regime, and the register-suspension mechanism (Arts. 32/51, Loi 2018-52); the TEJ penalty of 30 % with a 50 DT minimum per certificate.

**Estimated inputs, presented as such:** unit processing time, incomplete-file rate, monthly volume. These are not published by Tunisian administrations. They appear in the product as **editable parameters** — a DGI manager can enter their own figures and see the calculation on their real volumes, live.

**A second benefit DGI can verify in their own systems:** *rectificatives avoided.* Every mis-coded withholding certificate produces an `ActeDepot=1` filing. The TEJ schema itself distinguishes *initiale* from *rectificative*, so **DGI already counts this number.** We reduce a figure they track.

**International comparables**, cited as orders of magnitude and never as Tunisian measurements: Estonia's X-Road; the European *once-only* principle.

The counter appears live in the officer console and increments during the demo. The slide is then not a claim — it is a number the jury just watched the product produce.

> Replace the estimates with real figures from the field calls (§14).

---

## 13. Demo dataset

Underestimated by every team, and it is what creates the visual difference.

### Five hero documents

1. **Service contract** — 8,400 DT including tax, between a SARL and a public establishment
2. **Invoice** — with a deliberate anomaly: incomplete provider tax identifier
3. **Patente** — in Arabic, slightly skewed scan
4. **RNE extract** — for the third party, showing its legal form and tax regime (**this is what unlocks assisted rule A2**)
5. **Tax situation attestation** — with a partially blurred amount, to trigger the confidence threshold

Anomalies must be **plausible and common in reality**, not crude. A truncated identifier, an inconsistent date, VAT charged outside the applicable regime — the real rejection reasons.

### Forty background files

Credible Tunisian company names across varied sectors. Status spread of roughly **55 % pre-qualified compliant, 30 % with anomalies, 15 % awaiting completion**. Timestamps over 30 days with realistic weekday density. Amounts between 1,200 and 45,000 DT. Three or four fictional agents.

**An empty queue reads as a prototype. A full queue reads as a system in production.**

All demo companies are fictional.

---

## 14. Field validation — start immediately

The highest-return task in the plan, and it costs five phone calls.

Call **three experts-comptables**, **one agent** at a public accounting or tax control office, and **one MSME owner** working with the public sector. Three questions:

1. How long does processing a public procurement payment file actually take you?
2. What is the most frequent reason a file is rejected or sent back?
3. **Since January, how much time are withholding certificates costing you on TEJ?**

Open the pitch with what they said, and replace the benefit parameters with their figures.

HiiL's methodology starts from what people report experiencing. A team that did primary validation during the hackathon speaks their language natively.

> **Message every accountant anyone knows today.** Lead time is the constraint, not willingness.

---

## 15. Build phases

Hours are from kickoff. Owners are fixed in §15.1. **Every phase has a gate; a phase is not done until its gate passes.**

### 15.1 Owners — split by surface, not by layer

Layer splits produce merge conflicts and blocked dependencies. Surface splits let four people and three Claude accounts work in different directories all weekend.

| Owner | Surface | Directories |
|---|---|---|
| **A** | Officer console — queue, file view, source highlighting, actions, audit view, metrics | `app/(officer)/**` · `components/review/**` |
| **B** | MSME product — dashboard, file creation, upload, extraction review, report, assistant | `app/(msme)/**` · `lib/ingest/**` · `lib/ocr/**` |
| **C** | Rules, retrieval, TEJ — corpus, registry, deterministic + assisted rules, XSD emission and validation | `lib/rules/**` · `lib/rag/**` · `lib/tej/**` |
| **D** | Pitch and ground truth — field calls, benefit model, deck, script, seed data, rehearsal, backup video | `deck/**` · `fixtures/**` |

**Owner D is not the spare person.** One sentence from a real accountant outweighs any feature shippable in the same hours, because it is the only thing that makes the benefit slide credible rather than modelled. Assign the most persuasive teammate, not the least technical one.

### Phase 1 · H0–H4 — Foundations
Scope frozen. Roles and auth working. Design tokens and both Plex fonts in place. Corpus collected. Shared types (`Dossier`, `Certificate`, `Finding`) **agreed in one file and frozen**. Code enumeration generated from the XSD. Bedrock model access confirmed in-region. AWS billing alarm set at $25. Demo PDFs produced. Field calls started.

> **Gate:** a hand-written XML fixture validates against the real XSD, and all four owners can run the app.

### Phase 2 · H4–H14 — Reading
Documents go in, structured fields with confidence come out, uncertain fields surface for confirmation. Language routing working (French → Textract, Arabic → document vision). Deterministic rules written with verified citations.

> **Gate:** one hero document produces correct typed fields, and one uncertain field reliably triggers the confirmation prompt.

### Phase 3 · H14–H28 — Judging and handing over
Deterministic rules execute and produce findings with citations. **The three assisted rules work**, including A2 end to end: proposed fact → code selection → deterministic computation in millimes → XSD-valid export. Registry verification works. Files submit and appear in the officer queue. Officer actions work. Audit trail records rule, article, corpus version, confidence. **Cached responses built now, not at the end.**

> **Gate — the hard one:** the full path from upload to officer validation runs end to end, however ugly. **If this gate has not passed by H28, stop adding and start cutting.**

### Phase 4 · H28–H38 — Making it beautiful
Design and motion pass. Source-region highlighting. The orchestrated queue moment. The counter and editable parameters. The TEJ validation screen. Bilingual RTL. Backup video recorded.

> **Gate:** a stranger can operate the officer console without narration.

### Phase 5 · H38–H44 — Hardening
Degraded mode. **Five full timed rehearsals.** Pitch script written word for word. Q&A answers written and rehearsed, E-Sit-Fisc first.

> **Gate:** the pitch fits in 170 seconds with the Agency Benefit slide getting its full 45.

### Phase 6 · H44+ — Freeze
No commits except crash fixes. Rehearse on the actual hardware and network. Sleep.

---

## 16. Verification ledger

State this distinction out loud. Judges punish invented precision far harder than honest estimation.

### ✅ Verified against primary or official sources
- **TEJ XSD schemas** — downloaded and read directly; 40+ operation codes, millime integers, matricule format, VAT enum
- **E-Sit-Fisc** — exists, reserved to public bodies, built in application of art. 62 LF2014 (DGI's own page)
- **Art. 62 LF2014** — 1,000 DT TTC threshold conditioning public payment
- **Arts. 32 / 51, Loi 2018-52** — 7-month filing deadline; penalty of half the fee due per month; **register suspension and referral to the prosecutor after a 15-day notice**
- **Art. 53 LF2026** (loi n° 17-2025 du 12/12/2025) — e-invoicing extended to all services; TEIF XML via TTN El Fatoora; 100–500 DT per paper invoice, 50,000 DT annual ceiling
- **836,808 enterprises**; 103,518 employers; 89,958 micro, 12,663 SME, 897 large — INS / RNE 2024
- **AWS Textract** supports French but **not** Arabic for structured extraction

### ◐ Estimated, and labelled as such in the product
Unit processing time per file, incomplete-file rate, monthly volume. Not published by Tunisian administrations. Exposed as editable parameters.

### ⚠️ Unverified — must not reach a slide until a practitioner signs off
- **Art. 89, Code de l'IRPP et de l'IS** — the attestation for marchés publics, and the 2-working-day claim
- **RNE full-digital as of 1 July 2026**
- **Every withholding rate we demo.** Secondary sources contradict each other. One wrong rate in front of a DGI judge ends the pitch.

### ❌ Removed
- **World Bank "144 hours/year"** — Doing Business discontinued 2021 after a data-manipulation investigation. Liability, not statistic.

---

## 17. Sources

| What | Where |
|---|---|
| **TEJ XSD schemas** | https://jibaya.tn/wp-content/uploads/2024/05/plateforme-TEJ-shemas-xsd.zip |
| **E-Sit-Fisc** | http://www.impots.finances.gov.tn/index.php/fr/services-en-ligne/2015-11-06-16-15-01 |
| **Code des droits et procédures fiscaux 2024** | https://jibaya.tn/wp-content/uploads/2024/07/Code-des-droits-et-procedures-fiscaux-2024.pdf · HTML by article on [Jurisite Tunisie](https://www.jurisitetunisie.com/tunisie/codes/cdpf/cdpf1040.htm) |
| **Loi 2018-52 (RNE)** | https://legislation-securite.tn/latest-laws/loi-n-2018-52-du-29-octobre-2018-relative-au-registre-national-des-entreprises/ |
| **Loi de Finances 2026** | https://jibaya.tn/docs/loi-des-finances-2026-disponible-en-langue-arabe-uniquement/ — **Arabic only**; our Arabic pipeline is what lets us index it |
| **RNE data exchange (KYC web service)** | https://home.registre-entreprises.tn/echange_des_donnees/ |
| **UXP interoperability platform** | https://cyber.ee/resources/news/phase-2-tunisia-interoperability/ |
| **INS — Répertoire National des Entreprises 2024** | https://www.ins.tn/sites/default/files-ftp3/files/publication/pdf/RNE%202024.pdf |
| **192 digitisation projects to 2030** | https://www.ecofinagency.com/news-digital/1702-52981-tunisia-launches-192-project-plan-to-fully-digitize-public-services-by-2030 |

> ⚠️ **Corpus scope discipline.** Do not index "all Tunisian law". Index what the 25–35 rules actually touch: the withholding and VAT-regime articles, art. 62 LF2014, arts. 32/51 of loi 2018-52, and the operation-code descriptions from the XSD itself. Narrow sources retrieved precisely beat a thousand pages retrieved vaguely — that is the difference between citing correctly and citing plausibly.

---

## 18. Legal and ethical guardrails

Not caveats appended afterwards. They determine the positioning.

- **Regulated professions.** Loi n° 88-108 reserves habitual bookkeeping, verification and certification of accounts to registered experts-comptables; loi n° 60-34 governs tax advice. Sanad is **documentary preparation and verification** — never account certification, never legal advice. The accountant is a first-class role in the product.
- **Filing and signature.** Filing goes through official portals with an ANCE / TunTrust certificate (DigiGo for legal persons, Mobile ID / e-Houwiya for natural persons). **Sanad neither signs nor files on the taxpayer's behalf.** It prepares; the user transmits through the official channel. Stated in the product and in the pitch.
- **Data protection.** Processing covers sensitive data (CIN, matricule fiscal, financials) under loi organique n° 2004-63 and INPDP oversight: prior declaration, explicit consent, minimisation, purpose limitation, controlled transfers. Tunisia ratified Convention 108 in 2017.
- **Liability for automated advice.** Three mechanisms: systematic citation of the legal source; confidence thresholds that hand off to human verification; and an explicit statement that the analysis does not substitute for a qualified professional's opinion.

---

## 19. Risks

| Risk | Mitigation |
|---|---|
| **A judge raises E-Sit-Fisc first** | Pre-empt it at 0:18. Scripted, rehearsed, delivered before anyone asks. |
| **"Where is the AI?"** | The deterministic/assisted split, with A2 as the live proof. Rehearse the answer. |
| **A cited article is wrong** | Manually verify every article cited in the demo against its official source. The §16 unverified list gets practitioner sign-off before it reaches a slide. |
| **A withholding rate is wrong** | Primary text only, article shown, practitioner sanity-checks the codes we demo. |
| Model quota exhausted mid-demo | Cached responses built early, two API keys, degraded mode |
| Wifi failure | Everything runs locally + backup video ready to play |
| **OpenSearch Serverless** | ❌ Never use it — it bills a minimum OCU floor whether queried or not and will silently eat the $120 |
| Idle AWS infrastructure | Postgres in Docker locally; deploy once, late; billing alarm at $25 |
| Integration delay | Freeze the interface between front and back early, build against stubs |
| Officer console left ugly | It is the prize-bearing surface. Owner A owns nothing else. |
| Team exhaustion | Code freeze before the end, sleep rotation |

**Safe demo mode.** A flag that serves model responses from cache for the known demo documents, with the same screens and the same timings. Not cheating — the results are the ones the pipeline genuinely produced, captured. The demo runs live; the flag exists for when quota or network fails.

---

## 20. Cut list

If time runs short, cut in this order:

1. Open registration — keep only pre-created demo accounts
2. The accountant invitation flow — keep the role, cut the invite UI
3. The free-form assistant — the registry and its citations stay, the chat goes
4. Forty seed files → fifteen
5. The audit trail screen → an expandable panel inside the file view
6. Agent assignment
7. Multi-document upload → one document on screen, the rest pre-loaded
8. Mobile responsive
9. Assisted rules A1 and A3 → **A2 is never cut**
10. Everything beyond the hero workflow → a slide

**Never cut:** the citation panel · the officer console · the **A2 / TEJ code-selection moment** · the **XSD validation beat** · the counter with editable parameters · the orchestrated queue animation · the backup video.

---

## 21. Definition of done

- ☐ The full path runs five times consecutively without intervention
- ☐ Every cited article verified against its official source
- ☐ The uncertain field triggers on every run
- ☐ **The TEJ export validates green against the published XSD on every run**
- ☐ **The three `RS7` codes render legibly from the back of the room**
- ☐ The file appears in the officer queue within seconds, visibly
- ☐ Counter parameters editable live in front of the jury
- ☐ The "not verifiable by us" block is visible on the third-party view
- ☐ The demo runs with the network disconnected
- ☐ Backup video on the presentation machine, offline
- ☐ Both sessions open and authenticated before going on stage
- ☐ Reduced motion respected, keyboard focus visible
- ☐ The pitch fits in 170 seconds in rehearsal
- ☐ Q&A answers written and rehearsed, **E-Sit-Fisc first**
- ☐ One person speaks, one person clicks
- ☐ The physical paper folder is ready for the opening

---

## 22. Q&A preparation

1. **You already have E-Sit-Fisc — what are you adding?** → *Ask it ourselves at 0:18.* E-Sit-Fisc answers one question for one actor. It does not tell the business before it submits whether the rest of the file will be rejected, does not check the other pieces, and does not check consistency between them.
2. **What if your AI is wrong?** → Deterministic, versioned rules with citations. The model supplies facts, never verdicts. Confidence thresholds escalate to a human. Every conclusion is replayable.
3. **Where is the AI, then?** → Three assisted rules need a fact the document does not contain. Choosing between `RS7_000001`, `RS7_000002` and `RS7_000003` requires the supplier's corporate tax rate, which is not on the invoice.
4. **Isn't this the accountant's job?** → The accountant is a role in the product. Distribution channel, not competitor. Loi 88-108 defines the boundary and we stay on our side of it.
5. **How do you get a third party's tax data?** → We do not, and we say so in the product. Only E-Sit-Fisc holds it and it is reserved to public bodies.
6. **Where do your benefit figures come from?** → Several verified against primary sources, three estimated and labelled as such, all parameters editable — enter your own volumes.
7. **Can you file on behalf of the taxpayer?** → No. An ANCE/TunTrust certificate is required. We prepare; the user files.
8. **What about data protection?** → Loi 2004-63, INPDP, prior declaration, minimisation, purpose limitation. Companies only.
9. **The DGI already has online services — how are you different?** → We replace nothing. We pre-qualify upstream and hand the same officer a verified file.
10. **How would an administration adopt this?** → Pilot under convention, public API hook, connection to UXP, authentication via e-Houwiya. No replacement of existing systems.
11. **Does it work in Arabic?** → Yes, natively, the same path as French. Note Textract cannot do structured Arabic extraction — we route it to document vision.
12. **What is the business model?** → MSME subscription, institutional licence, free for the agency during pilot.
13. **What if the model is unavailable?** → The deterministic rules still run on confirmed fields; the system degrades to assisted manual entry.
14. **What happens when the law changes?** → Rules are versioned, and the audit trail records which corpus version produced each conclusion.
15. **Why this workflow?** → Article 62 makes it legally mandatory, recurring and measurable — and TEJ made the withholding piece mandatory for everyone in January.
16. **How does this scale beyond Tunisia?** → The approach is corpus-independent, and e-invoicing and continuous-control mandates are converging globally.

---

*Verification status is tracked in §16 and is binding. The TEJ schemas were downloaded and read directly; art. 62, E-Sit-Fisc, arts. 32/51 of loi 2018-52, art. 53 LF2026 and the INS statistics were confirmed against official or primary sources. Art. 89, the RNE full-digital date, and every withholding rate remain unconfirmed and must not reach a slide until a practitioner signs off. Secondary Tunisian tax publications **disagree with one another on at least one rate** — treat every figure as a starting point for verification, not as settled law. That verification is the product.*
