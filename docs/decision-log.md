# Decision log

Append only. Superseding a decision means a new row that references the old one, never an edit to the old one.

Format: date, decision, options considered, why, result.

---

## D-001 - Product name

**Date:** 2026-09-12
**Decision:** Working name Chahed (شاهد, witness or attestation).
**Options:** Chahed; Wathiq (واثق, confident, close to وثيقة, document); a French descriptive name.
**Why:** An Arabic word gives the jury something to repeat in deliberation, and Chahed carries the attestation meaning that sits at the centre of the product. A French descriptive name is forgettable.
**Result:** Adopted, pending final team confirmation before slides are made. Change it now if it is going to change.

---

## D-002 - Anchor the product on article 62 rather than on generic document compliance

**Date:** 2026-09-12
**Decision:** The hero workflow is the public procurement payment file under article 62 LF2014.
**Options:** (a) Generic contract compliance checking. (b) The article 62 payment file. (c) Monthly declaration preparation.
**Why:** Option (a) has no legal role for a public officer, so the mandatory institutional module would be fictional and the agency benefit would not be computable. Option (b) gives a named, thresholded, recurring legal obligation, a real officer role, and a measurable benefit. Option (c) collides with the expert-comptable monopoly more directly.
**Result:** Article 62 is the spine. The service contract survives as one document inside the payment file.

---

## D-003 - Compliance judgement is deterministic, the model does not judge

**Date:** 2026-09-12
**Decision:** A registry of coded rules, each carrying a verbatim legal citation, decides compliance. The model extracts, explains, and drafts.
**Options:** (a) Ask the model to assess compliance per document. (b) Deterministic rule registry. (c) Hybrid with the model as tiebreaker.
**Why:** Option (a) gives non-reproducible, non-auditable results that an administration cannot accept. Option (c) has the same problem with extra complexity. Option (b) gives the same output every run and an article behind every finding.
**Result:** Adopted. This is the design law in the root CLAUDE.md.

---

## D-004 - Split the registry into deterministic and assisted rules

**Date:** 2026-09-12
**Decision:** Most rules are pure code. Three assisted rules let the model establish a fact the documents do not state, with a confidence, which the deterministic rule then judges from.
**Options:** (a) Keep every rule deterministic. (b) Introduce assisted rules with an escalation path.
**Why:** Option (a) leaves the project exposed to "so this is OCR plus a rules engine, where is the AI", and more importantly it cannot handle the withholding determination at all, because the correct operation code depends on the supplier's legal form, regime, and residency, none of which appear on the invoice. Option (b) restores the difficulty without breaking D-003: the model supplies a premise, the rule still judges.
**Why it matters beyond the answer:** the withholding rule is the proof that compliance checking and counterparty verification cannot run as separate passes.
**Result:** Adopted. The withholding rule is the showcase and is the last assisted rule to be cut.

---

## D-005 - Escalation is part of an assisted rule, not an error state

**Date:** 2026-09-12
**Decision:** When an assisted rule cannot establish its fact above threshold, it does not fire and does not guess. It emits one specific question for a human.
**Options:** (a) Fall back to the most likely value. (b) Fail the rule. (c) Escalate a specific question.
**Why:** Option (a) is exactly the failure mode we are claiming to avoid. Option (b) loses information the human could supply in five seconds. Option (c) makes "the model never judges" demonstrable rather than aspirational, and it becomes a scripted demo beat.
**Result:** Adopted. An assisted rule without a written escalation question is incomplete.

---

## D-006 - No adverse media or reputation screening

**Date:** 2026-09-12
**Decision:** Counterparty verification uses registry-grounded findings only. The planned web reputation search via a search API is dropped from scope and moved to a roadmap slide.
**Options:** (a) Build the reputational signal search with defamation guardrails. (b) Drop it and rely on registry findings.
**Why:** Three reasons, escalating. It would demo as zero results, because Tunisian MSMEs have almost no press coverage. It adds a paid external vendor outside the rest of the stack. And it is the one feature in the product that cannot cite a legal text, which directly contradicts the credibility argument the whole thing rests on. The volume of guardrails the design needed was itself the signal that it did not fit.
**What replaced it:** loi 2018-52 art. 52 (register suspended after a 15-day notice, referral to the public prosecutor) and art. 11 (twelve consecutive months of unfiled tax declarations recorded in the RNE). Both are stronger counterparty signals than press coverage, and both carry an article number.
**Result:** Dropped. If asked: we only surface findings we can attach to a legal text.

---

## D-007 - The officer cannot edit a file

**Date:** 2026-09-12
**Decision:** The officer role can annotate, flag, validate, assign, and return for correction. It cannot confirm extracted fields, answer escalations, or re-run analysis.
**Options:** (a) Let the officer fix and re-run. (b) Restrict the officer to review actions.
**Why:** In administrative process the agent returns the file, they do not repair the citizen's submission. Letting an officer silently edit and re-run muddies who is responsible for the conclusion, and it competes with our own return-for-correction flow, which is a time saving we want to claim.
**Result:** Adopted. Enforced server-side, noted in app/CLAUDE.md.

---

## D-008 - The expert-comptable is a role in the product

**Date:** 2026-09-12
**Decision:** An external accountant can be invited to a file, can correct and annotate, and cannot submit.
**Options:** (a) Ignore the profession. (b) Position against it. (c) Build it in as an invited reviewer without submission rights.
**Why:** Loi 88-108 reserves habitual bookkeeping, verification and certification to registered experts-comptables. Option (b) is a losing fight and an easy attack line in Q&A. Option (c) turns the profession into a distribution channel and keeps the business as the submitter, so the platform never acts in place of the taxpayer.
**Result:** Adopted.

---

## D-009 - Ship a TEJ export validated against the DGI schema

**Date:** 2026-09-12
**Decision:** Generate a withholding certificate file and validate it against the published XSD schemas, offline, on stage.
**Options:** (a) Ship only our own report and structured hand-off. (b) Add the TEJ export with live schema validation.
**Why:** Every other artifact in the demo is self-defined. Nothing outside the system confirms we got anything right. The XSD validation is the only moment where an external authority agrees with us, and the schemas were reissued on 8 September 2026, four days before the event.
**Risk accepted:** it adds scope. Mitigated by validating offline against schema files committed to `schemas/`.
**Result:** Adopted. Phase 3 gate.

---

## D-010 - e-sit-fisc goes in the opening, not the Q&A

**Date:** 2026-09-12
**Decision:** Name the DGI's existing systems in the first twenty seconds of the pitch, framed as a convergence we build on.
**Options:** (a) Wait for the question and answer it defensively. (b) State it up front as an endorsement.
**Why:** The specific hard question is "we built e-sit-fisc for article 62, what are you adding", and it is much harder than the generic "the DGI already has online services". Said first, it reads as confidence and homework. Said in response, it reads as defence. The 8 September communiqué connecting e-sit-fisc to TEJ makes the framing available.
**Result:** Adopted.

---

## D-011 - Drop the World Bank tax compliance hours figure

**Date:** 2026-09-12
**Decision:** The 144 hours per year figure is banned from all materials.
**Options:** (a) Use it with a caveat. (b) Drop it.
**Why:** Doing Business was discontinued after an investigation into data manipulation. A well-read judge knows why the series stopped, and it contaminates the problem statement it opens. The INS enterprise figures are Tunisian, current, and make the same point more strongly.
**Result:** Banned, recorded in docs/facts.md so nobody reintroduces it.

---

## D-012 - A facts register gates every public claim

**Date:** 2026-09-12
**Decision:** docs/facts.md holds every fact we may state publicly, with a verification status set by a person who opened the official source.
**Options:** (a) Check facts as they come up. (b) Maintain a single register with an explicit gate.
**Why:** We already shipped a wrong article number in a draft. Professional commentary gets article numbers wrong routinely. The audience includes people who work at these agencies, and one wrong citation costs the competition.
**Result:** Adopted. Nothing goes on a slide unless it is in the register as verified.

---

## D-013 - Cache model responses from phase 4, not at the end

**Date:** 2026-09-12
**Decision:** Responses are cached by content hash starting in phase 4. The demo must run with the network disconnected.
**Options:** (a) Add caching during hardening. (b) Build it into the pipeline early.
**Why:** The free model tier has per-minute and per-day limits and the demo fires several calls in sequence, which makes quota exhaustion the single most likely live failure. Caching added late tends to be bolted on and untested. In safe demo mode a cache miss is a loud error, never a silent live call.
**Result:** Adopted. Phase 4 gate includes the cache.

---

## D-014 - Retire the Sanad plan from the shared repository

**Date:** 2026-09-12
**Decision:** Remove the earlier Sanad build plan (PLAN.md, docs/PLAN.md) from the tree and publish Chahed on top of the existing remote history.
**Options:** (a) Keep the Sanad plan alongside docs/plan.md. (b) Move it to an archive folder. (c) Remove it and rely on git history. (d) Overwrite the remote history.
**Why:** Two plans in the tree contradict the single source of truth. docs/PLAN.md and docs/plan.md collide on case-insensitive filesystems, which breaks checkout on macOS and Windows. Option (d) would destroy a teammate's commits.
**Result:** Adopted. The Sanad plan stays recoverable at commit 2475584.

---

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Seeded with decisions D-001 to D-013 |
| 2026-09-12 | team | Added D-014 |
