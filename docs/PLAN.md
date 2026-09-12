# Sanad — Build Plan

**Hack4Justice 2026 · Challenge A · Regulatory AI & Fiscal Compliance**

Every payment a Tunisian company makes to a supplier now has to become a *certificat de retenue à la source* on the DGI's TEJ platform. Getting the code wrong costs 30 % of the withholding, minimum 50 DT — **per certificate**. Sanad reads the invoice, picks the code, cites the article, and hands DGI a pre-verified file.

| | |
|---|---|
| **Angle** | DGI / Fiscal compliance (retenue à la source → TEJ) |
| **Team** | 4 people, 3 Claude accounts |
| **Budget** | $120 AWS |
| **Positioning** | The institutional module *is* the product |

---

## The thesis

> **Choosing the right TEJ operation code requires four facts. Exactly one of them is printed on the invoice.**

The nature of the payment is on the invoice. The beneficiary's **legal form**, their **tax regime** (réel vs. forfait, IS at 10 % / 15 % / other), and their **residency status** are not.

Without them you cannot tell `RS7_000001` from `RS7_000002` from `RS7_000003` — three codes for the same purchase that differ only by the supplier's corporate tax rate. Guess, and you file a *rectificative*.

That is the pain, and it is why document conformity and third-party due diligence have to run in a single pass.

This plan replaces the service-contract demo with the same pipeline pointed at a document that actually lands in a civil servant's inbox. **Nothing about the architecture changes.** The team's original design — RAG grounded in real legal texts, citation as proof, conformity and counterparty checks in one flow, generalisable across document types — survives intact and becomes load-bearing rather than decorative.

> **Assumptions.** Written for a ~48-hour sprint; phase markers are hours from kickoff. Stack assumed Next.js + TypeScript + Postgres because it is the fastest path for four people in one repo — swap freely, nothing in the design depends on it. If your runway is weeks rather than hours, Phase 5 is where you expand.

---

## Why this one: the pain is eleven days old and legally mandatory

**TEJ** — *Transfert et Échange des Données Fiscales* — became the only authorised channel for issuing withholding certificates on **1 January 2026**. Salaries, rent, fees, capital income, supplier purchases: all of it. The DGI added new functionality to the platform on **8–9 September 2026**, days before this hackathon, and reissued the XSD schema taxpayers must conform to.

So you are not proposing to digitise a paper process that an agency might one day want automated. You are proposing to fix a live, mandatory, penalty-backed obligation that every one of Tunisia's **836,808** registered enterprises is dealing with right now, badly.

| Figure | Meaning |
|---|---|
| **40+** | operation codes in the official TEJ enumeration, `RS1`–`RS11`, each keyed to a different article |
| **30 %** | penalty on the withholding amount for a non-conforming certificate, minimum 50 DT **each** |
| **Month-end** | certificate due by the end of the month following payment; declaration and payment by the 28th |
| **~103,518** | enterprises with employees, of which 87 % are micro — no in-house accountant, full obligation |

### The three tells in the brief, answered

| What the brief demands | How this answers it |
|---|---|
| **Mandatory Institutional Module** — a real officer review surface | DGI already performs *recoupement*: cross-matching declared withholdings against beneficiaries' declared revenue, and adjudicating rectificatives and penalty disputes. That is a real desk, a real mandate, a real queue. Your officer console plugs into work that exists. |
| **The Agency Benefit slide** — hours saved per month | Measured in *rectificatives avoided* and penalty disputes never opened. The TEJ schema itself distinguishes `ActeDepot` 0 (initiale) from 1 (rectificative) — DGI counts these in their own system. You are reducing a number they already track. |
| **GenAI + OCR** (Bedrock, Textract) | Textract reads the invoice; Bedrock-hosted Claude classifies the operation and drafts the citation; a deterministic engine computes the money. Both services used where they genuinely belong. |

> **On the name.** *Sanad* (سند) is both a supporting document or title deed and, in the classical sciences, the **chain of authority** that authenticates a report. That is exactly what the product does: no fiscal conclusion without a traceable chain back to the text of the law. Tunisian judges will get it instantly.

---

## What we verified: the output format is public and already downloaded

This is the part that turns a demo into a product. The DGI publishes the XSD schemas for bulk XML deposit. We pulled the archive — three files, 2,853 lines. Your deliverable is not a mock PDF. It is **a file TEJ will accept.**

| Schema file | Lines | What it pins down |
|---|---:|---|
| `TEJDeclarationRS_v1.0.xsd` | 512 | Declaration envelope, certificate and operation structure, amounts, identifiers |
| `TEJRSCodesOperations_v1.0.xsd` | 189 | The full enumeration of withholding operation codes with their legal descriptions |
| `TEJISOPaysDevises.xsd` | 2,152 | ISO country and currency codes for non-resident payments |

### Constraints the schema imposes

- **Amounts are integers in millimes.** `xs:integer`, *"sans partie décimale"*. A float anywhere in your pipeline is a rejected declaration. Use integer millimes end to end.
- **Matricule fiscal** is 7 digits concatenated with a letter, with `CategorieContribuable` of `PM` or `PP`. Validate the shape before you ever call the API.
- **TVA is an enum** — only `7.0`, `13.0`, `19.0` are valid. Anything else fails schema validation.
- **Five identifier types** — matricule fiscal, CIN, passport, carte de séjour, other. Non-residents route differently and carry a country code.
- **Per-operation flags** — `CNPC` (double-taxation treaty applies) and `P_Charge` (withholding borne by the payer) both change the arithmetic.

### Three codes, one invoice — the demo's money shot

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

Same invoice. Same amount. Same supplier name. The only thing separating the three is the supplier's corporate tax rate — which appears nowhere on the document in front of the business owner.

**This single slide explains why the product needs due diligence, and it is the most persuasive thirty seconds in your pitch.**

> ⚠️ **Do not trust the rate tables on the web — and say so on stage.** While researching this, two Tunisian tax blogs gave contradictory rates for fees paid to BNC professionals under the régime réel. That contradiction *is* the argument for the product: rates move with every Loi de Finances, secondary sources lag, and an LLM answering from memory inherits both problems. Every rate Sanad applies must be retrieved from the primary text and shown with its article.

---

## The product: three surfaces, one verified record

### Surface 1 — The MSME workspace
Drop in a batch of supplier invoices. Textract extracts; Claude classifies each payment against the code enumeration; the supplier's matricule is checked against the registry; anything ambiguous is escalated rather than guessed. Output: **a schema-valid TEJ XML** plus a per-certificate explanation naming the article applied.

### Surface 2 — The DGI officer console
A queue of pre-verified declarations. Each row shows the confidence of every extracted field, which checks passed automatically, the supplier's registry status, and the legal basis for the code chosen. The officer **approves, or flags with a reason** — and the reason flows straight back to the business as remediation steps, not a stamped rejection.

### Surface 3 — The compliance passport
A company consents to expose its own fiscal standing, producing a signed, time-stamped credential it can **present** to counterparties. This is the legally clean inversion of the due-diligence problem — arrears data is covered by *secret fiscal* and you can never fetch it about someone else. Build the read path; the network effect is the vision slide.

### Generalisation, stated honestly

The pipeline — `extract → retrieve → classify → verify counterparty → compute → emit → officer review` — is document-agnostic. Only the retrieved rule set changes. Withholding certificates are the deep vertical you actually build; invoices, patentes and extraits RNE are the roadmap. Say exactly that on stage. Judges reward a team that knows the difference between what is built and what is designed for.

---

## Architecture: what the model may decide, and what it may not

This is the decision that wins a hackathon named for justice, and it costs you nothing to implement. Put it on a slide in these words.

| The LLM **does** | The LLM **never** |
|---|---|
| **Read.** Normalise messy OCR output into typed fields, in French or Arabic. | **Computes money.** Rates, bases, thresholds, rounding to millimes — all in unit-tested code. |
| **Classify.** Propose one operation code from the enumeration, with a confidence and a stated rationale. | **Decides.** No filing leaves the system without a human approval, on one side or the other. |
| **Explain.** Turn a retrieved article into a sentence a non-lawyer understands. | **Asserts law from memory.** No retrieved citation, no conclusion. The refusal is a feature. |
| **Escalate.** Say "I cannot determine this" and name the missing fact. | **Overwrites the record.** Every suggestion and every override is appended to an immutable log. |

### Pipeline

1. **Ingest.** PDF or scan → S3. Route by language: Textract for French (structured forms and tables), Claude's native document vision for Arabic — **Textract does not support Arabic structured extraction**, only raw text blocks. Knowing this and handling it is a genuine engineering credential in a bilingual country.
2. **Retrieve.** Chunk the fiscal corpus by article. Embed to pgvector. Retrieve against the payment's nature plus the beneficiary's profile.
3. **Classify.** Claude on Bedrock, structured output, constrained to the 40-code enumeration parsed straight from the XSD. Low confidence routes to human review instead of guessing.
4. **Verify.** Matricule fiscal shape check, then registry lookup for legal status and activity. Real API path documented, mock behind the same interface for the demo.
5. **Compute.** Deterministic engine. Integer millimes. Full test suite.
6. **Emit.** Serialise and validate against the real XSD before anything is shown as ready.
7. **Review.** Officer queue. Approve or flag with reason. Append to audit log.

### Stack notes

- **Bedrock client.** Use the Mantle client — `AnthropicBedrockMantle` in the Anthropic SDK — not a `base_url` override on the first-party client. Bedrock model IDs carry an `anthropic.` prefix.
- **Model split.** Opus for the classification and citation reasoning where correctness decides the demo. A cheaper model is defensible for bulk field normalisation once you have a measurement showing quality holds — not before.
- **Two features are unavailable on Bedrock:** Managed Agents and fast mode. Architect as plain Messages API plus tool use and you will never hit either wall.
- **XSD validation is a library call,** not a hand-rolled checker. Wire it early; it is your objective pass/fail signal all weekend and it makes a great live demo beat.
- **Parse the enumeration, don't retype it.** Generate your TypeScript union and your prompt's code list from `TEJRSCodesOperations_v1.0.xsd` at build time. Forty hand-copied codes is forty chances to introduce a typo you will debug at 3am.

---

## Sources — everything you need is public

| What | Where | Use it for |
|---|---|---|
| **TEJ XSD schemas** | https://jibaya.tn/wp-content/uploads/2024/05/plateforme-TEJ-shemas-xsd.zip | Output contract, code enumeration, field validation. Verified downloadable. |
| **Code des droits et procédures fiscaux** | https://jibaya.tn/wp-content/uploads/2024/07/Code-des-droits-et-procedures-fiscaux-2024.pdf | Core corpus for the RAG index. Also on [Jurisite Tunisie](https://www.jurisitetunisie.com/tunisie/codes/cdpf/cdpf1040.htm) as HTML — easier to chunk by article. |
| **Loi de Finances 2026** | https://jibaya.tn/docs/loi-des-finances-2026-disponible-en-langue-arabe-uniquement/ | Current rates. **Arabic only** at time of writing — plan for it, and note that your Arabic pipeline is what lets you index it. |
| **RNE data exchange** | https://home.registre-entreprises.tn/echange_des_donnees/ | Real KYC web service, subscription-based, governed by a January 2026 order. Mock it behind the interface; put the real endpoint on the architecture slide. |
| **UXP interoperability platform** | https://cyber.ee/resources/news/phase-2-tunisia-interoperability/ | The national X-Road-based data exchange, extended to business services. **This is your integration story.** |
| **e-Houwiya / MobileID** | National digital identity | Your authentication path for both sides. Name it; do not build it. |
| **Enterprise statistics** | https://www.ins.tn/sites/default/files-ftp3/files/publication/pdf/RNE%202024.pdf | 836,808 enterprises; 103,518 employers; 89,958 micro, 12,663 SME, 897 large. Market sizing with a citation. |
| **Digitisation programme** | https://www.ecofinagency.com/news-digital/1702-52981-tunisia-launches-192-project-plan-to-fully-digitize-public-services-by-2030 | Proof the buyer exists and is actively procuring. Opening line of the Agency Benefit slide. |

> ⚠️ **Corpus scope discipline.** Do not try to index "all Tunisian law". Index what the withholding decision actually touches: the withholding articles of the IRPP/IS code, the relevant Loi de Finances provisions, the TEJ cahier des charges, and the operation-code descriptions from the XSD itself. Four narrow sources retrieved precisely beats a thousand pages retrieved vaguely — and it is the difference between a demo that cites correctly and one that cites plausibly.

---

## Build order (hours from kickoff)

### H0 – H3 · Contract first

- Parse the XSD into a generated **code enumeration + TypeScript types**. This artifact unblocks all three other workstreams — do it before anything else.
- Agree the internal `Certificate` object once, in one file, and freeze it. Every workstream codes against it in parallel.
- Stand up the repo, Postgres + pgvector, and a hello-world Bedrock call. Confirm credentials work *now*, not at hour 30.
- Write the golden-path fixture: three real-shaped supplier invoices and their expected certificates.

**Gate** — a hand-written XML fixture validates against the real XSD.

### H3 – H12 · Vertical slice, ugly

- One invoice → Textract → typed fields → hardcoded code → computed amounts → emitted XML → passes validation.
- Officer console: a list, a detail view, an approve button, an audit row. No styling yet.
- Corpus ingested and chunked by article; retrieval returning something sane for a test query.

**Gate** — end to end works for exactly one document. Everything after this is depth.

### H12 – H24 · Make it right

- **Classifier** constrained to the enumeration, returning code + confidence + retrieved article. Confidence threshold routes to human review.
- **Rules engine** with its test suite. Integer millimes, `CNPC` and `P_Charge` handled, rounding pinned by tests.
- **Supplier verification** behind an interface, mock implementation, real endpoint documented in code comments.
- **Immutable audit log** — every suggestion, every override, timestamped and attributed.

**Gate** — a wrong-code scenario is caught and explained with a citation.

### H24 – H36 · Make it legible

- Design pass on the officer console specifically. It is what the institutional prize is judged on and it is the screen most teams will leave ugly.
- Bilingual FR / AR with RTL. Cheap, and it signals you built for Tunisia rather than for a template.
- The **live savings calculator** inside the officer dashboard — sliders, real arithmetic, fed by your own demo throughput.
- Batch mode: ten invoices at once. Volume is what makes the saving legible in ninety seconds.

**Gate** — a stranger can operate the officer console without narration.

### H36 – H44 · Rehearse, then freeze

- Seed the demo database. Rehearse the three-minute run **five times**, timed, out loud.
- Record a screen capture of the full flow as your fallback. Venue wifi will fail; assume it.
- **Feature freeze at H40.** The last four hours are rehearsal and bug-fixing only.

**Gate** — the pitch lands under 3:00 with the Agency Benefit slide getting its full 45 seconds.

### Phase 5 — if you have weeks, not hours

- Second document type through the same pipeline, proving the generalisation claim rather than asserting it.
- Real RNE web service subscription. Ask now; procurement is slow.
- An eval set over the classifier: real invoices, expert-labelled codes, a measured accuracy number. **A team that shows a measured accuracy figure beats every team that shows a demo.**

---

## Four people: split by surface, not by layer

Layer-based splits (one on frontend, one on backend) produce constant merge conflicts and blocked dependencies. Surface-based splits let four people — and three Claude accounts running in parallel — work in different directories all weekend. Agree the `Certificate` type in hour one and the seams hold.

### Owner A — Officer console
- Queue, detail view, approve / flag with reason
- Confidence and provenance display per field
- Audit log view
- The savings calculator

`app/(officer)/**` · `components/review/**`

### Owner B — Ingest & extraction
- Upload, S3, language routing
- Textract for French, Claude vision for Arabic
- Field normalisation + confidence scoring
- Batch mode

`lib/ingest/**` · `lib/ocr/**`

### Owner C — Rules, RAG & XML
- Corpus ingest, chunking, pgvector retrieval
- Constrained classifier + citation
- Deterministic engine, integer millimes, tests
- XSD serialisation and validation

`lib/rules/**` · `lib/rag/**` · `lib/tej/**`

### Owner D — Pitch & ground truth
- **Find a practitioner.** Accountant, or ex-DGI. Twenty minutes.
- Build the savings model from what they say
- Deck, demo script, timing
- Seed data, rehearsal, fallback recording

`deck/**` · `fixtures/**`

> **Owner D is not the spare person.** One sentence from a real accountant — *"I spend two days a month on retenue certificates"* — outweighs any feature you could ship in the same hours, because it is the only thing that makes the Agency Benefit slide credible rather than modelled. Assign your most persuasive teammate, not your least technical one.

---

## $120 AWS: the AI is cheap, the idle infrastructure will eat you

At demo scale — a few hundred documents across a weekend — inference and OCR together cost single-digit dollars. Every horror story about a burned hackathon budget is about something left running.

| Service | Shape | Call |
|---|---|---|
| **Textract** | AnalyzeDocument Forms ~$0.05/page, Tables ~$0.015/page; plain DetectDocumentText is a fraction of that | ✅ **Use it** — prefer DetectDocumentText where layout allows |
| **Bedrock** | Partner-operated pricing, separate from first-party rates. Negligible at demo volume | ✅ **Use it** |
| **OpenSearch Serverless** | Bills a minimum OCU floor whether or not you query it | ❌ **Never** — it will silently consume the entire $120 |
| **RDS / EC2** | Bills while idle, including the 14 hours you are asleep | ⚠️ **Local first** — Postgres in Docker; deploy once, late |
| **S3** | Pennies at this scale | ✅ **Use it** |

> ⚠️ **Set a billing alarm at $25 in hour one.** Two minutes of work. It is the difference between noticing a runaway on Saturday morning and discovering it on Monday.

---

## The Agency Benefit (mandatory slide)

Forty-five seconds, one slide, one number. Build it as a **live calculator inside the officer console** rather than a static graphic, so a judge from DGI can plug in their own volumes on stage. That single interaction is worth more than any feature.

### The saving DGI can verify

- **Rectificatives avoided.** Every mis-coded certificate produces an `ActeDepot=1` filing. DGI already counts these. Your claim: *x* % of rectificatives originate in code selection and identifier errors, both of which are caught at source.
- **Recoupement pre-matched.** Cross-checking declared withholdings against beneficiaries' declared revenue is manual reconciliation. You deliver certificates already validated against the registry and already schema-clean.
- **Disputes never opened.** A 30 % penalty, minimum 50 DT per certificate, generates réclamations that an officer must adjudicate. Prevention at source removes the queue rather than speeding it up.
- **Helpdesk deflected.** "Which code do I use?" is the single most common support question on a platform that became mandatory eleven months ago.

### How to say it

Be explicit that the baseline is **modelled**, and name where the model came from. Judges punish invented precision far harder than they punish honest estimation.

> *"We don't have DGI's internal figures. So here is our model, built from an interview with a practising accountant, and here are the sliders. Tell us your real volumes and we'll compute it live."*

Then **do it**. A judge changing a number and watching the figure move is the moment they stop evaluating a demo and start evaluating a supplier.

> ⚠️ **The slide is titled "The Agency Benefit".** Exactly that, as specified in the brief. Do not get creative with the title — a judge with a rubric is ticking a box.

---

## Demo script (3:00)

Split screen throughout: business on the left, officer on the right. Never narrate what the audience can see — narrate what it *means*.

| Time | Beat |
|---|---|
| **0:00–0:20** | **The obligation.** *"Since January, every Tunisian company must issue its withholding certificates through TEJ. Forty operation codes. Thirty percent penalty, minimum fifty dinars, per certificate. Nine out of ten Tunisian companies have no accountant."* |
| **0:20–0:40** | **The trap** — the three `RS7` codes on screen. *"Same invoice. Same supplier. Three different codes. What separates them is the supplier's corporate tax rate — which isn't on the invoice."* |
| **0:40–1:20** | **Live run** — drop ten invoices in. Extraction, classification, supplier lookup, computation. One is flagged low-confidence and escalated rather than guessed. Point at that one. It is the most trustworthy thing on screen. |
| **1:20–1:40** | **The citation** — open one certificate, show the article behind the code. *"The model didn't recall this. It retrieved it. No citation, no conclusion."* |
| **1:40–2:00** | **The file** — export, validate against the DGI's published XSD, green. *"That's not a mockup. That's the schema the DGI reissued four days ago."* |
| **2:00–2:15** | **The officer** — switch right. Queue, evidence, one approve, one flagged with a reason that appears on the business side as remediation steps. |
| **2:15–3:00** | **The Agency Benefit** — the slide, then the live calculator. Invite a judge to change a number. Close on UXP and e-Houwiya: *"We're not asking DGI to adopt new infrastructure. We connect to the one they already built."* |

> **The flagged certificate is the most important second in the demo.** Every other team's AI will be confidently right about everything. Yours says "I can't determine this one — here's the fact I'm missing." In a room judging *justice*, a system that knows the edge of its competence reads as trustworthy in a way that a perfect score never does.

---

## What will go wrong

| Risk | Severity | Mitigation |
|---|---|---|
| **Rates are wrong** | 🔴 Critical | Secondary sources already contradict each other. Pull from primary text only, show the article, and have Owner D get a practitioner to sanity-check the three codes you demo. One wrong rate in front of a DGI judge ends the pitch. |
| **Scope creep** | 🔴 Critical | The original proposal had four products in it. One document type, built properly. Generalisation is a slide, not a sprint. |
| **Arabic OCR** | 🟠 High | Textract will not do structured extraction on Arabic. Route Arabic to Claude's document vision. Decide this in hour one, not hour thirty. |
| **Officer console left ugly** | 🟠 High | It is the prize-bearing surface. Phase 4 gives it a dedicated design pass and Owner A owns nothing else. |
| **Venue network** | 🟠 High | Record the full flow at H40. Every live demo that has ever failed, failed on wifi. |
| **ECC / tooling rabbit hole** | 🟡 Medium | Agent harnesses optimise how you code, not what you ship. If it is not installed and working in twenty minutes, drop it and move on. |
| **"This already exists"** | 🟡 Medium | Accounting suites do bulk TEJ export. None of them decide the code from the law with a citation, none verify the counterparty in the same pass, and none give DGI a review surface. Say that before a judge says it for you. |

---

## Hour zero — before anyone writes application code

- [ ] **Download the TEJ XSD archive and read `TEJRSCodesOperations_v1.0.xsd` end to end, as a team.** Twenty minutes. It is the entire problem statement, written by the DGI.
- [ ] **Confirm Bedrock model access is enabled in your region.** Model access is a console toggle and it is not on by default. Discovering this at hour 30 has ended hackathons.
- [ ] **Set the AWS billing alarm at $25.**
- [ ] **Generate the code enumeration and the `Certificate` type from the XSD, commit it, freeze it.** The single dependency that unblocks all four workstreams.
- [ ] **Get a schema-valid XML fixture passing validation.** Before any AI is involved. It is your objective scoreboard for the rest of the weekend.
- [ ] **Owner D: message every accountant any of you know, today.** Lead time is the constraint, not their willingness. Ask at hour zero even if you interview at hour twenty.
- [ ] **Agree out loud that the officer console is the product.** Every team that loses this prize decided otherwise by default, at 4am, without discussing it.

---

*Claims in this plan were checked against primary sources where possible: the TEJ schemas were downloaded and read directly, and enterprise statistics come from the INS Répertoire National des Entreprises 2024. Withholding rates, penalty amounts and filing deadlines come from secondary Tunisian tax publications that **disagree with one another on at least one rate** — treat every figure here as a starting point for verification against the Loi de Finances, not as settled law. That verification is the product.*
