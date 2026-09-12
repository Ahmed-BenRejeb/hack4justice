# Facts register

Every fact we state on a slide, in the pitch script, or on a screen lives here first.

**The rule: if it is not in this table with status `verified`, nobody says it on stage.**

Status is set by a person who opened the official source and read the number. Not by a model, not from memory, not from professional commentary, which gets article numbers wrong often enough that we have already been caught by it once.

| Status | Meaning |
|---|---|
| `verified` | A person opened the official source and confirmed it. Safe to state. |
| `confirm` | Plausible, not yet checked at source. Not usable in public. |
| `wrong` | Checked and found incorrect. Kept here so nobody reintroduces it. |
| `banned` | Factually defensible but strategically unusable. Reason given. |

## Legal basis

| Fact | Status | Source to check | Checked by | Date |
|---|---|---|---|---|
| Article 62, Finance Law 2014: payments by the State, local authorities and public establishments to suppliers of 1,000 DT TTC or above require an attestation that all due declarations were filed | `verified` | DGI | | |
| Article 89, IRPP/IS Code: attestation de situation fiscale for public procurement, issued within 2 working days maximum from a complete filing | `verified` | SICAD procedure sheet | | |
| Loi 2018-52 art. 52: the Centre notifies, allows 15 days maximum, then suspends the company's register and transmits the file to the public prosecutor | `verified` | Loi 2018-52 full text | | |
| Loi 2018-52 art. 53: fine of 1,000 to 5,000 DT | `verified` | Loi 2018-52 full text | | |
| Loi 2018-52 art. 11: failure to file tax declarations for twelve consecutive months is recorded in the RNE | `verified` | Loi 2018-52 full text | | |
| Financial statement filing deadline of 7 months from fiscal year-end, and its article number | `confirm` | Loi 2018-52 full text | | |
| Loi 88-108: bookkeeping, verification and certification of company accounts reserved to registered experts-comptables | `confirm` | Loi 88-108 | | |
| Loi 2004-63 and INPDP: personal data processing regime | `confirm` | Loi organique 2004-63 | | |

An earlier draft of the plan attributed the registry filing penalty to article 51 and described it as half the applicable fee per month. That did not match the text. Article 52 is the suspension mechanism and article 53 is the fine. Re-read the law before citing any article from it.

## Administration systems

| Fact | Status | Source to check | Checked by | Date |
|---|---|---|---|---|
| e-sit-fisc exists and lets public bodies consult a supplier's fiscal situation online in application of article 62 | `verified` | DGI | | |
| DGI communiqué dated 8 September 2026 announcing new TEJ functionality from September 2026 | `verified` | DGI communiqué, and the press coverage of it | | |
| The TEJ update integrates all withholding tax certificates into the platform | `verified` | Same communiqué | | |
| Taxpayers generating withholding certificates by electronic file deposit must download the updated XSD schema | `verified` | Same communiqué | | |
| Public establishments using e-sit-fisc that have not joined TEJ must do so to continue consulting suppliers' fiscal situations | `verified` | Same communiqué | | |
| Schema files `TEJDeclarationRS_v1.0.xsd`, `TEJISOPaysDevises.xsd`, `TEJRSCodesOperations_v1.0.xsd` plus the cahier des charges are published on jibaya.tn | `verified` | jibaya.tn | | |
| Specific TEJ operation code values and their conditions | `confirm` | `TEJRSCodesOperations_v1.0.xsd` and the cahier des charges, on disk in `schemas/` | | |

Read operation codes off the schema file in `schemas/`. Never from memory, never from a model, never from a blog post.

## Economy

| Fact | Status | Source to check | Checked by | Date |
|---|---|---|---|---|
| 836,808 registered private enterprises at end-2024 | `verified` | INS / RNE 2024 | | |
| Roughly 87 percent have no employees | `verified` | INS / RNE 2024 | | |
| 27,143 entries and 14,928 exits recorded in 2024 | `confirm` | INS / RNE 2024 | | |

## Banned

| Fact | Why |
|---|---|
| World Bank "144 hours per year to comply with taxes" | Doing Business was discontinued after an investigation into data manipulation. A judge who knows that discounts everything said after it. The INS figures are Tunisian, current, and stronger. |
| Attestation validity period | No Tunisian official source found. The figures circulating online are French and do not apply here. Do not state a validity period. |
| E-invoicing penalty amounts described as being enforced | The penalties exist in law but Tunisian sources indicate they are not yet being applied. If mentioned at all, phrase as provided by law, not as being applied. |

## Estimates, labelled as such on the slide

These are not facts and must never be presented as measured. They appear in the product as editable parameters so an agency representative can substitute their own.

| Parameter | Working value | Replace with |
|---|---|---|
| Time to process a paper file | 42 min | Figure from the field calls |
| Time to process a pre-qualified file | 11 min | Figure from the field calls |
| Rework rate on incomplete files | 28 percent | Figure from the field calls |
| Time cost of one round-trip | 25 min | Figure from the field calls |

International comparables (Estonia X-Road, the European once-only principle) are cited as orders of magnitude only, never as Tunisian measurements, and always named as such out loud.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial register |
