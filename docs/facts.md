# Facts register

Every fact stated on a slide or on screen must have a row here with status `verified`. Nothing is promoted to `verified` from a model's output or from memory; a person checks it against the cited source and updates the status and the checked-by/checked-on fields.

Status values: `verified`, `to verify`, `banned` (a claim we explicitly do not make, kept here so it is not reintroduced by accident).

---

## Legal basis

| Claim | Source | Status | Notes |
|---|---|---|---|
| Withholding certificates must be issued via the DGI platform, code selected from a list | DGI platform documentation / instruction, exact reference pending | to verify | Foundational claim for the whole pitch; must be checked first |
| The obligation has been in force since January (approx. eight months before the hackathon) | DGI instruction / official gazette, exact date pending | to verify | Exact entry-into-force date is explicitly flagged in the v2 description as unverified |
| The DGI doctrine was updated in the days before the hackathon | DGI communication, date and content pending | to verify | If a DGI officer attends, this is the first thing tested; content of the update must be known precisely, not just its existence |
| Number of withholding codes ("plus de 40") | Official DGI code list | to verify | v2 description explicitly says: do not state "more than 40" until the codes are counted |
| Article 62 (the anchor case: a prestataire unpaid due to a certificate error) | Code de l'IRPP/IS or relevant fiscal code, article 62, exact text pending | to verify | Verbatim article text required before it appears in the pitch narrative or on any rule citation |

## Administration systems

| Claim | Source | Status | Notes |
|---|---|---|---|
| E-Sit-Fisc is the DGI's existing filing channel; this product feeds it clean data, does not replace it | DGI public documentation | to verify | Positioning claim, must be accurate about what E-Sit-Fisc does and does not do |
| RNE (Registre National des Entreprises) is queryable for counterparty registration facts | RNE public access documentation | to verify | Confirms the counterparty-verification feature is buildable as scoped, not just assumed |
| DGI TEJ export has a published XSD schema | DGI schema publication | to verify | Underlies the export feature; the schema file itself must be the one actually validated against, not a paraphrase |

## Economy / market

| Claim | Source | Status | Notes |
|---|---|---|---|
| "The overwhelming majority" of Tunisian MSMEs have no in-house accountant | Source not yet identified | to verify | v2 description explicitly flags this: find a source, or fall back to the qualitative "overwhelming majority" phrasing, which is presented as free and uncontestable |
| e-Tafakna (Tunis, founded circa 2022) covers private legal documents, not fiscal/DGI compliance | e-Tafakna public materials | to verify | Positioning claim against a named competitor; must be accurate, not just favorable |

## Impact calculation inputs

| Claim | Source | Status | Notes |
|---|---|---|---|
| Annual volume of withholding certificates issued nationally | DGI statistics, if published | to verify | First multiplicand in the national projection formula |
| Observed error rate on withholding certificates | DGI statistics or pilot-observed rate | to verify | Second multiplicand; pilot data may be the only available source pre-launch |
| Average downstream interventions triggered per error (corrected declaration, cross-check investigation, support call) | DGI process documentation or estimate, labelled as an estimate if not sourced | to verify | Third multiplicand; if not sourced, must be visibly labelled as an estimate on the slide, per the estimates rule below |
| Average officer time per downstream intervention (hours) | DGI process documentation or estimate, labelled as an estimate if not sourced | to verify | Fourth multiplicand, used only to derive the mandatory Agency Benefit slide's hours-saved figure from the interventions-removed count (D-016); never used as a standalone or primary headline |

## Banned claims

| Claim | Why banned |
|---|---|
| Any claim that the product detects or scores fraud | Explicit scope refusal (D-003): fraud detection is fiscal policing, not this product |
| Any supplier reputation score or "risk score" | Explicit product decision (D-007): practitioners attached no value to it, feature was withdrawn |
| "We replace E-Sit-Fisc" or any DGI filing channel | Positioning is "we feed clean data into existing channels," not replacement |
| Any "hours saved" or "time saved" figure presented as the primary metric, or not derived from the sourced errors-prevented calculation | D-009: the primary metric is errors prevented and downstream interventions removed, not time saved. D-016's exception: the mandatory Agency Benefit slide may show one hours-saved figure, derived from this calculation and labelled per the estimates rule, shown alongside it, never standalone |

## Estimates, to be labelled as such on any slide

Any number in the impact calculation that does not have a `verified` source by presentation time must appear on screen with a visible "estimate" label and the basis for the estimate stated next to it. An unlabelled estimate is treated the same as an unverified fact: it does not go on a slide.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Facts register regenerated from description-projet-v2.md; all entries seeded at `to verify` |
| 2026-09-12 | team | Added officer-time-per-intervention input and narrowed the hours-saved ban, per D-016 |
