# Plan - Source of Truth

**Hack4Justice 2026 · Challenge A · Regulatory AI & Fiscal Compliance**

This document defines what we are building and why. It deliberately avoids implementation detail - how each piece gets built is decided during the build, with better information than we have now. What is fixed here is the idea, the scope, the roles, the design direction, and the facts we are willing to state on stage.

---

## 1. The problem

Tunisian MSMEs continuously produce and receive documents that carry legal or fiscal weight - contracts, invoices, patentes, statutes, RNE extracts, tax attestations - without the time, legal expertise, or budget to verify their compliance or assess the risk of the third parties they work with.

The structure of the economy makes this systemic: of **836,808 registered private enterprises at end-2024**, roughly **87% have no employees**. No legal department, no tax function, often no full-time accountant. When a rule changes, nobody inside the business is responsible for noticing.

On the administration side (DGI, RNE, APII), the absence of upstream verification produces a steady stream of incomplete or inconsistent files. Every badly assembled file triggers a manual round-trip - piece-by-piece checking, a request for what is missing, another queue - that consumes agent time without producing value.

### The legal anchor

One situation concentrates this friction, and it rests on a specific text:

> **Article 62, Finance Law 2014** - any payment by the State, local authorities, or public establishments to a supplier, for an amount **equal to or above 1,000 DT including tax**, is conditional on producing an attestation from the tax services confirming the supplier has filed all due tax declarations.

**For the business:** to get paid, it assembles a physical file - contract or purchase order, invoice, patente, RNE extract, tax situation attestation. The attestation for public procurement (Article 89, IRPP/IS Code) is issued within **2 working days maximum** from a complete filing, but requires a trip to the tax office, and the clock restarts if a piece is missing. Meanwhile the invoice goes unpaid. For a micro-business that is a cash flow problem, not a paperwork problem.

**For the administration:** the public accounting officer verifies every piece by hand, checks validity, cross-references identifiers, and returns the file when something is off.

### What the administration has already built - and why that helps us

This goes in the opening twenty seconds of the pitch, not in the Q&A defence.

The DGI operates **e-sit-fisc**, which lets public bodies consult a supplier's tax situation online in application of Article 62. It also operates **TEJ**, the fiscal data transfer and exchange platform. In a communiqué dated **8 September 2026**, the DGI announced new TEJ functionality effective September 2026: real-time consultation of a taxpayer's filing situation, integration of **all withholding tax certificates** into the platform, an updated **XSD schema** for taxpayers who generate those certificates by electronic file deposit, and a requirement that **public establishments using e-sit-fisc who have not yet joined TEJ must do so** in order to continue consulting their suppliers' fiscal situation.

Read that last point carefully. The DGI is itself connecting supplier verification to structured data exchange, this month. Our position is not "the administration is behind." It is:

> *"Four days ago the DGI connected e-sit-fisc to TEJ and published an updated schema. E-sit-fisc tells the public body whether a supplier filed its declarations. It says nothing about whether the payment file is complete and correct, and the business cannot use it. We built the missing half, and we output the schema the DGI published."*

That is an endorsement, not a rebuttal, and it is the strongest opening available.

---

## 2. The solution

A platform that ingests any document a business holds or receives, checks it against Tunisian regulation, verifies the counterparties involved, and hands the administration a pre-qualified file - plus a structured export that validates against the DGI's own schema.

### Three principles

1. **Traceability by default** - no conclusion without a clickable legal reference.
2. **Uncertainty is a result, not a failure** - when the system is not confident, it says so and asks a human, rather than producing a plausible but unverified answer.
3. **Assistance, not substitution** - the platform prepares, verifies, and structures. It does not sign, does not file, and does not replace any regulated profession.

### The rule registry - the architectural decision

This is the answer to the most dangerous question in the room: *"what if your AI is wrong?"*

If every compliance check were an open question posed to a model, results would vary between runs, would not be auditable, and could hallucinate. Instead, each check is a coded rule carrying the exact legal article that grounds it.

**The model never judges compliance. The rule does.**

But the registry has two kinds of rule, and the difference is where the real work lives.

#### Deterministic rules - the bulk

Presence, format, cross-field equality, date ordering, threshold comparison. Pure code, no model involvement beyond supplying the extracted value. Roughly 25 of the 30.

*Examples:* is the supplier's tax identifier present and well-formed; does the invoice amount match the contract; is the attestation dated before the payment request; is every required piece of the Article 62 file present.

#### Assisted rules - where the intelligence lives

The model supplies **a fact the document does not state**, with a confidence level and an escalation path. The rule then judges compliance from that fact. The model still does not judge; it establishes a premise.

Three worth building, in priority order:

| Rule | The fact the model must supply | Why it is hard |
|---|---|---|
| **Withholding tax: is it due, and under which TEJ operation code** | The supplier's legal form, tax regime, and residency | None of this is on the invoice. Several codes can apply to the same purchase, separated only by the supplier's situation. |
| **VAT charged vs. the supplier's permitted regime** | The supplier's declared fiscal regime | Requires reading the patente and the RNE extract together, then judging the invoice against both |
| **Contract object vs. activity declared at the RNE** | A semantic match between free-text object and a nomenclature entry | No string comparison solves this |

**The withholding rule is the showcase**, and it carries an argument the earlier version of this plan was missing entirely: *compliance checking and counterparty verification cannot be separate passes.* You cannot determine the correct withholding code without knowing who the supplier is. That is why the two run together, and it is why this is not a checklist app.

**Escalation is part of the rule, not an afterthought.** When the model cannot establish the fact with confidence, the rule does not fire - it surfaces as "requires confirmation" with a specific question for the human. That path must be visible in the demo.

#### The soundbite

> *"Our compliance checks are deterministic and versioned - the same document always produces the same result, and every rule carries its article. The model establishes facts the documents don't state; the rules judge compliance. It never judges."*

**A rule without a verbatim citation does not enter the registry.**

### External validation - the eight seconds that matter most

Everything else in the demo is self-defined: our report, our status, our score. Nothing outside the system confirms we got it right.

The exception: the **TEJ withholding certificate export**. The DGI publishes the XSD schemas - `TEJDeclarationRS_v1.0.xsd`, `TEJISOPaysDevises.xsd`, and `TEJRSCodesOperations_v1.0.xsd` - with the cahier des charges, downloadable from jibaya.tn. Our export can be validated against them **live on stage**.

> *"That's not our format. That's the schema the DGI reissued four days ago, and our file validates against it."*

This is the only moment in the run where an external authority agrees with us. Build it, and run the validation offline so it cannot fail on network.

### What the demo shows

A services MSME has completed work for a public establishment and must assemble its payment file for an invoice above the 1,000 DT threshold. Documents go in. Extraction, compliance checking, counterparty verification, a withholding determination, and a schema-valid export come out. The file is submitted and appears live in a public officer's queue, pre-qualified, every check traceable.

---

## 3. Facts we will state on stage

Everything in this table goes on a slide or into the script. Each one must be checked against its official source before the pitch, by a person, not by a model.

| Fact | Status |
|---|---|
| Article 62 LF2014 - 1,000 DT threshold, attestation required before public payment | Verified |
| Article 89 IRPP/IS Code - attestation for public procurement, 2 working days max | Verified |
| e-sit-fisc exists for Article 62 supplier checks by public bodies | Verified |
| DGI communiqué 8 Sept 2026 - TEJ update, all withholding certificates integrated, updated XSD, e-sit-fisc users must join TEJ | Verified |
| TEJ XSD schema filenames and availability on jibaya.tn | Verified |
| 836,808 enterprises end-2024, ~87% with no employees (INS) | Verified |
| Loi 2018-52 art. 52 - 15-day notice, then register suspension and referral to the public prosecutor | Verified |
| Loi 2018-52 art. 53 - fine of 1,000 to 5,000 DT | Verified |
| Loi 2018-52 art. 11 - failure to file tax declarations for twelve consecutive months is recorded in the RNE | Verified |
| Financial statement filing deadline (7 months from year-end) and its article number | **To verify - an earlier draft had the wrong article** |
| Specific TEJ operation code values | **To verify - read them from `TEJRSCodesOperations_v1.0.xsd`, never from memory** |

**Do not use the World Bank "144 hours to comply with taxes" figure.** Doing Business was discontinued after an investigation into data manipulation. A judge who knows that discounts everything said after it. The INS figures are Tunisian, current, and stronger.

**Any number not in this table does not get said on stage.**

---

## 4. Users and roles

| Role | Who | Primary job |
|---|---|---|
| `msme_owner` | Business owner or manager | Assemble compliant files, understand what is wrong and how to fix it |
| `msme_accountant` | External expert-comptable, invited by the business | Review and correct files before submission |
| `officer` | DGI / RNE / APII / public accounting agent | Review, validate, flag, or return files |
| `admin` | Platform administrator (in the demo: the jury) | Inspect the rule registry, adjust benefit parameters |

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
| Confirm an uncertain field | ✅ | ✅ | ❌ | ❌ |
| Answer an assisted-rule escalation | ✅ | ✅ | ❌ | ❌ |
| Re-run analysis | ✅ | ✅ | ❌ | ❌ |
| View the compliance report | ✅ | ✅ | ✅ | ✅ |
| Open a legal citation | ✅ | ✅ | ✅ | ✅ |
| **Counterparty verification** | | | | |
| Run a registry check | ✅ | ✅ | ✅ | ❌ |
| View the registry record behind a finding | ✅ | ✅ | ✅ | ✅ |
| **Submission and review** | | | | |
| Submit a file to the administration | ✅ | ❌ | ❌ | ❌ |
| Withdraw before review | ✅ | ❌ | ❌ | ❌ |
| Export the TEJ file | ✅ | ✅ | ✅ | ❌ |
| Validate a file | ❌ | ❌ | ✅ | ❌ |
| Flag an anomaly | ❌ | ❌ | ✅ | ❌ |
| Return the file for correction | ❌ | ❌ | ✅ | ❌ |
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

**The accountant is strategic, not decorative.** Tunisian law (Loi 88-108) reserves habitual bookkeeping, verification and certification of company accounts to registered experts-comptables. Building the accountant in as a first-class invited reviewer who can correct and annotate but **cannot submit** turns the profession from an objection into a distribution channel.

**The officer cannot edit the file.** This changed deliberately. In administrative process the agent does not fix the citizen's file - they return it. Letting an officer silently correct fields and re-run the analysis muddies who is responsible for the conclusion, and it competes with the return-for-correction flow. The officer annotates, flags, validates, or returns. Nothing else.

**The admin role exists for the jury.** Handing judges a login that lets them inspect the rules and change the benefit assumptions is worth more than any slide.

---

## 5. What each role can do

### MSME owner

- **Dashboard** - files in progress, files awaiting the administration, deadlines
- **File creation** - choose a file type and see the required document checklist up front, each item with its legal basis
- **Upload** - multiple documents, mixed formats, mixed languages
- **Extraction review** - structured fields with confidence; uncertain fields surfaced for confirmation before analysis continues
- **Assisted-rule escalations** - specific questions when the system cannot establish a fact on its own
- **Compliance report** - blocking points, attention points, passed checks, each with its article and a concrete fix
- **Counterparty verification** - registry status and legally grounded risk signals
- **TEJ export** - a withholding certificate file that validates against the DGI schema
- **Regulatory assistant** - free-form questions answered with citations
- **Invite an accountant**, **submit**, **track**

### MSME accountant

Read and annotate invited files, correct fields, answer escalations, re-run analysis, replay an analysis to see which rule produced which conclusion. Internal annotations invisible to the administration. **No submission right** - the business remains the submitter, and the platform never acts in place of the taxpayer.

### Officer

Queue with live indicators, filters, and smart default sort. File view with source highlighting, automated checks with their legal basis, and the points left to human judgment. Four actions: validate, flag, return for correction (pre-filled from blocking findings), annotate. Assignment. Audit trail with replay. Agency metrics.

### Admin

Browse the rule registry with every check and citation. Edit the four benefit parameters with instant recalculation. Read-only access to any file.

---

## 6. How a file moves through the system

1. **Documents arrive.** Any format, any language.
2. **The system reads them.** Each document is classified and its fields extracted. Every field carries a confidence level.
3. **Uncertainty surfaces.** Anything read unreliably is flagged for confirmation before analysis proceeds. It never guesses silently.
4. **Deterministic rules run.** Presence, format, consistency, thresholds - each producing a finding with its article.
5. **Assisted rules run.** The model establishes the facts the documents don't state - supplier regime, legal form, residency, activity match - with confidence. Where it can't, the rule escalates a specific question to the human instead of firing.
6. **Counterparty verification runs in the same pass**, because the assisted rules depend on it.
7. **A report is produced.** Not a score: an auditable checklist where every line has a legal basis.
8. **Exports are generated.** Including the TEJ withholding file, validated against the DGI schema.
9. **The file is submitted** and arrives in the officer's queue structured, with every check recorded.
10. **The officer decides.** Validate, flag, or return. The system never decides.

**Bilingual by design.** French and Arabic documents take the same path. Tunisian administrative documents are bilingual; handling that natively rather than as a special case is a requirement.

---

## 7. Counterparty verification

Every check here is grounded in a published text. There is no adverse-media search, no web scraping, and no reputation score - deliberately. The credibility of this whole product rests on "no conclusion without a clickable legal reference," and a press-sentiment signal is the one thing that cannot carry one.

### What we check

| Check | Legal basis | What it tells you |
|---|---|---|
| Legal existence and current status | RNE record | Active, struck off, in proceedings |
| **Register suspended** | Loi 2018-52, art. 52 | The Centre gave 15 days' notice, the company did not comply, the register is suspended and the file went to the public prosecutor |
| **Tax declarations unfiled for twelve consecutive months** | Loi 2018-52, art. 11 | Recorded in the RNE itself |
| Registration date and age | RNE record | A counterparty incorporated last month on a large contract is a signal |
| Declared activity vs. contract object | RNE nomenclature | Feeds the assisted rule |
| Financial statement filing | Loi 2018-52 *(verify article)* | Administrative regularity |

**The suspended register is the strongest signal in the product**, and far stronger than any fine. A suspended register means no extrait, no bidding, no valid payment file. It is existential for the counterparty and immediately legible to an officer. It is also, unlike press coverage, a fact with an article number attached.

### What we say we cannot know

Displayed in the product, not buried in a disclaimer: we do not know a counterparty's tax arrears or litigation. That information is not public in Tunisia; only e-sit-fisc holds it, and it is reserved to public bodies. The product states what it knows and explicitly lists what it cannot.

That third block - "not verifiable by us" - is what makes the other two credible.

### Roadmap, not build

Open-source reputational signals stay on a roadmap slide. If asked: *"we only surface findings we can attach to a legal text. Press signals can't carry a citation, so they're out of scope until we can source them properly."*

---

## 8. Design direction

UI/UX is the top priority. This section is prescriptive; nothing technical is.

### The brief

A compliance instrument used by two very different people: a small business owner under financial pressure, and a public officer working a queue. It must feel **trustworthy, precise, and institutional without being bureaucratic or dated**. The reference is not a startup SaaS dashboard - it is a well-made professional instrument: legal publishing, official documents, verification tooling.

It is bilingual French/Arabic, and that constraint drives the typography rather than being retrofitted.

### Palette

Drawn from the material world of the subject: paper, ink, official stamps, registry ledgers.

```
--paper:       #FAF8F4   warm document ground, not white
--paper-sunk:  #F1EDE6   recessed surfaces, table stripes
--ink:         #16211F   near-black with a green cast, like stamp ink
--ink-soft:    #5A6764   secondary text
--rule:        #DBD5CA   hairlines and borders
--seal:        #1F4D3F   primary - deep registry green
--seal-wash:   #E6EFEA   primary tint for selected states
--cachet:      #A8342A   blocking status only - stamp red
--amber:       #A97420   attention status only
--verified:    #2F6B4F   passed status only
```

**Colour carries status and nothing else.** The three status colours never appear as decoration - red on screen must always mean a blocking issue. `--seal` is the only interactive colour. Everything else is ink on paper.

This avoids the two palettes that dominate generated interfaces: cream with terracotta, and near-black with an acid accent.

### Typography

**One family across both scripts: IBM Plex Sans and IBM Plex Sans Arabic.** Matched Latin and Arabic designs, which matters enormously here because a French field label and an Arabic extracted value will sit in the same table row. Most pairings fall apart at exactly that point.

**IBM Plex Serif** for legal text quoted verbatim in citation panels. The change in texture signals that the law is speaking, not the interface.

**Tabular figures** for every amount, identifier, date, and confidence score.

Avoid all-caps labels, single accented words inside headings, and eyebrow labels above every section.

### Layout

**Officer console: dense.** A professional tool is judged on how much is legible without scrolling. Tight rows, hairline separators, horizontal space given to content rather than padding.

**MSME interface: calmer.** More whitespace, one primary action per screen, sequential progression.

This asymmetry is intentional and worth saying out loud: *two interfaces, two audiences, two densities.*

**Structure through hairlines, not cards.** Avoid identical rounded boxes with identical soft shadows - the most recognisable generated-dashboard pattern. Build hierarchy with rules, background shifts and spacing. Reserve elevation for things that genuinely float.

### Quality floor, unannounced

Visible keyboard focus. Reduced motion respected. Contrast checked on every status colour. Skeleton content on loading, never a spinner on blank. Empty states that say what to do next. Errors that state what happened and how to fix it.

---

## 9. Motion

Framer Motion, used with discipline. Motion exists to **explain what changed**.

### The one orchestrated moment

**A new file arriving in the officer's queue.** The pending counter increments. Existing rows shift down in a genuine reflow - not a fade. The new row enters with a brief coloured left border that fades over a couple of seconds. Roughly 900ms end to end, readable from the back of the room.

Use layout animations so the list visibly rearranges.

### Motion that answers an action

| Interaction | What moves |
|---|---|
| Hover an extracted field | Its region highlights in the document |
| Click a finding | Citation panel slides in from the right |
| Expand an article | Height opens smoothly |
| Answer an escalation | The rule resolves, its finding settles into place |
| Validate a file | Row exits the queue, counter ticks up |
| Filter the queue | Rows reorder in place, no fade |
| Export the TEJ file | Validation result resolves against the schema |

### Forbidden

Fade-and-slide-up on every section at load. Hover lift on every card. Scroll-triggered reveals. Anything over 400ms outside the orchestrated moment. Animated gradients, floating shapes, particles. Statistics counting up on load.

Nothing above the fold animates on first paint.

---

## 10. Screens

**MSME dashboard.** Status as a plain sentence, not a gauge. The file list. One primary action.

**File creation.** The required checklist appears **before** upload, each item with its legal basis on tap. Knowing what is expected before you start is itself a large part of the value.

**Upload.** Mixed formats and languages, visible progress per document.

**Extraction review.** Document preview left, fields right. **Uncertain fields pulled to the top of their group.** Hovering a field highlights its source region. The tone asks for help rather than reporting failure.

**Escalations.** When an assisted rule cannot establish a fact, it asks one specific question - *"Is this supplier resident in Tunisia?"* - with the reason it matters and what changes depending on the answer. This screen is the visible proof that the system knows where it stops.

**Compliance report.** Blocking, attention, passed. Each finding: the issue in plain language, the exact article in serif in an expandable panel, a concrete fix. No score.

**Counterparty view.** Registry facts with their articles, then the explicit "not verifiable by us" block.

**Export.** The TEJ file, with its validation result against the published schema shown on screen.

**Officer queue.** Four header indicators: pending by status, **agent hours saved this month**, pre-qualification rate, average processing time. Columns: company, object, amount, pre-qualification status, anomaly count, age, assigned agent. Persistent filters. **Default sort: oldest first among compliant files** - the agent sees what they can clear quickly.

**Officer file view.** Three columns. Left: documents - **hovering an extracted field highlights the corresponding region**, the gesture that sells the console. Centre: fields grouped by category. Right: automated checks with expandable articles, then the points left to human judgment, visually distinct. Fixed action bar. The return-for-correction form is **pre-filled from the blocking findings** - the agent reviews and sends, they do not compose.

**Audit trail.** Vertical chronology, timestamped and attributed. Replay shows which rule, which article, which confidence produced each conclusion. Opened for three seconds in the demo: *"no decision is made by the system, and every one is replayable."*

**Admin.** The rule registry browsable. The four benefit parameters editable, recalculating instantly.

---

## 11. The agency benefit

```
Agent hours saved per month
  = files processed
  × (time to process a paper file − time to process a pre-qualified file)
  + files processed × rework rate × time cost of one round-trip
```

**Verified inputs:** the 1,000 DT threshold and control obligation; the 2-day attestation maximum; e-sit-fisc; the TEJ schema requirement.

**Estimated inputs, labelled as such:** unit processing time, incomplete-file rate, monthly volume. Not published by Tunisian administrations. They appear in the product as **editable parameters** - a DGI manager enters their own figures and sees the calculation on their real volumes, live.

**International comparables, as orders of magnitude only:** Estonia's X-Road; the European "once-only" principle.

The counter increments live in the officer console during the demo. The slide is then not a claim - it is a number the jury just watched the product produce.

**Replace the estimates with real figures from the field calls.**

---

## 12. Demo dataset

### Hero documents

A service contract above the 1,000 DT threshold; an invoice with a deliberate, plausible anomaly; a **patente in Arabic**, slightly skewed; an RNE extract for the counterparty; a tax attestation with a partially blurred amount to trigger the confidence threshold.

Anomalies must be **realistic**, not crude. A truncated identifier, an inconsistent date, VAT charged outside the applicable regime.

**Plus one counterparty with a suspended register**, so the art. 52 finding appears in the demo with its article attached.

### Forty background files

Credible Tunisian company names across sectors. Roughly 55% pre-qualified compliant, 30% with anomalies, 15% returned. Timestamps over 30 days with realistic weekday density. Three or four fictional agents.

**An empty queue reads as a prototype. A full queue reads as a system in production.**

---

## 13. Field validation - start immediately

**The highest-return task in the plan, and it costs five phone calls.**

Three experts-comptables, one agent at a public accounting or tax control office, one MSME owner working with the public sector. Two questions:

1. *How long does processing a public procurement payment file actually take you?*
2. *What is the most frequent reason a file is rejected or sent back?*

Open the pitch with what they said, and replace the benefit parameters with their figures.

---

## 14. Build phases and gates

Each phase has an exit condition. **Do not start the next phase until the gate is met - cut scope instead.**

**Phase 1 - Foundations.**
Scope frozen. Roles and auth working. Design tokens and fonts in place. Corpus collected. Demo documents produced. TEJ schemas downloaded and read. Field calls made.
→ *Gate: a user can log in as each of the four roles and land on the right screen. The XSD files are on disk and a hand-written sample validates against them.*

**Phase 2 - Reading.**
Documents in, structured fields with confidence out, uncertain fields surfacing for confirmation. Deterministic rules written with verified citations.
→ *Gate: one real demo PDF produces correct structured fields, and at least one field reliably falls below the confidence threshold.*

**Phase 3 - Judging.**
Deterministic rules execute and produce findings with citations. The three assisted rules work, including the escalation path. Counterparty verification runs in the same pass. TEJ export generates and validates.
→ *Gate: the withholding rule correctly determines the code for the hero file, and the export passes schema validation offline.*

**Phase 4 - Handover.**
Files submit and appear in the officer queue. Officer actions work. Audit trail and replay work. Cached responses built.
→ *Gate: the full path runs end to end - upload to officer validation - however ugly. **This is the hard gate. If it is not met, stop adding features and start cutting.***

**Phase 5 - Making it beautiful.**
Design and motion pass. The orchestrated queue moment. The counter and editable parameters. Backup video recorded.
→ *Gate: the video exists and plays offline.*

**Phase 6 - Hardening.**
Degraded mode. Five full timed rehearsals. Pitch script word for word. Q&A answers written. Every fact in section 3 checked against its source by a person.
→ *Gate: five clean consecutive runs, pitch under 170 seconds.*

**Phase 7 - Freeze.**
No commits except crash fixes. Rehearse on the actual hardware and network. Sleep.

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| **Free model quota exhausted mid-demo** | Cached responses built in phase 4, two API keys, degraded mode |
| Wifi failure | Everything local + **backup video ready to play** |
| **A wrong article number on a slide** | Section 3 table, checked by a person against official sources |
| XSD validation fails live | Validate offline, test against the exact schema files on disk, rehearse it |
| Assisted rule gives a wrong answer live | The escalation path is the answer - demo it deliberately, don't hide it |
| Integration delay | Freeze the interface between front and back early, build against stubs |
| Team exhaustion | Code freeze before the end, sleep rotation |

**Safe demo mode.** A flag that serves model responses from cache for the known demo documents, with the same screens and timings. Not cheating - the results are the ones the pipeline genuinely produced, captured.

---

## 16. Cut list

1. Open registration - keep only pre-created demo accounts
2. The accountant invitation flow - keep the role, cut the invite UI
3. The free-form assistant - the registry and its citations stay, the chat goes
4. Forty seed files → fifteen
5. Two of the three assisted rules - **keep the withholding rule**
6. The audit trail screen → an expandable panel in the file view
7. Agent assignment
8. Multi-document upload → one document on screen, the rest pre-loaded
9. Mobile responsive
10. Everything beyond the hero workflow → a slide

**Never cut:** the citation panel, the withholding assisted rule with its escalation, the TEJ export validation, the officer console, the counter with editable parameters, the orchestrated queue animation, the backup video.

---

## 17. Definition of done

- [ ] The full path runs five times consecutively without intervention
- [ ] Every fact in section 3 verified by a person against its official source
- [ ] The uncertain field triggers on every run
- [ ] The assisted-rule escalation appears and resolves on every run
- [ ] The TEJ export validates against the published schema, offline
- [ ] The file appears in the officer queue within seconds, visibly
- [ ] Counter parameters editable live in front of the jury
- [ ] The demo runs with the network disconnected
- [ ] Backup video on the presentation machine, offline
- [ ] Both sessions open and authenticated before going on stage
- [ ] Reduced motion respected, keyboard focus visible
- [ ] The pitch fits in 170 seconds in rehearsal
- [ ] Q&A answers written and rehearsed
- [ ] One person speaks, one person clicks
- [ ] The physical paper folder is ready for the opening

---

## 18. Q&A preparation

1. *What if your AI is wrong?* → deterministic rules judge; the model only establishes facts, with confidence and an escalation path; every conclusion replayable
2. *So where is the AI?* → the assisted rules - determining the withholding code requires knowing the supplier's legal form, regime and residency, none of which are on the invoice
3. *Isn't this the accountant's job?* → the accountant is a role in the product; distribution channel, not competitor
4. *You already have e-sit-fisc - what are you adding?* → *(already said in the opening)* e-sit-fisc tells the public body whether the supplier filed; it says nothing about whether the file is complete and correct, and the business can't use it
5. *How do you get a counterparty's tax data?* → we do not, and we say so; only e-sit-fisc holds it
6. *Where do your benefit figures come from?* → two verified, two estimated and labelled, parameters editable
7. *Can you file on behalf of the taxpayer?* → no, an ANCE/TunTrust certificate is required; we prepare, the user files
8. *What about data protection?* → Loi 2004-63, INPDP, prior declaration, minimisation
9. *Why no reputation or press screening?* → we only surface findings we can attach to a legal text; on roadmap
10. *How would an administration adopt this?* → pilot under convention, API hook, no replacement of existing systems
11. *Does it work in Arabic?* → yes, natively, the same path as French
12. *What is the business model?* → MSME subscription, institutional licence, free for the agency during pilot
13. *What if the model is unavailable?* → the deterministic rules still run on confirmed fields; assisted rules escalate to the human
14. *What happens when the law changes?* → rules are versioned, and the audit trail records which version produced each conclusion
15. *How does this scale beyond Tunisia?* → the approach is corpus-independent, and e-invoicing and structured-reporting mandates are converging globally
