# Facts register

Every fact stated on a slide or on screen must have a row here with status `verified`. Nothing is promoted to `verified` from a model's output or from memory; a person checks it against the cited source and updates the status and the checked-by/checked-on fields.

Status values: `verified`, `to verify`, `banned` (a claim we explicitly do not make, kept here so it is not reintroduced by accident).

---

## Legal basis

| Claim | Source | Status | Notes |
|---|---|---|---|
| Withholding certificates must be issued via the DGI platform, code selected from a list | Code de l'IRPP et de l'IS, Article 55(I), and `schemas/tej/TEJRSCodesOperations_v1.0.xsd` | to verify | Candidate found 2026-09-13 (D-027): Article 55(I) requires the debtor to deliver a "certificat de retenue" at each payment and states (added by decret-loi n. 2021-21, 2021-12-28) that it is issued "a travers une plateforme electronique mise en place par le ministere des finances", almost certainly the TEJ platform itself. The code list (36 codes) is the real schema found in D-019. Still `to verify`: a person must confirm the platform reference is TEJ specifically, not a different DGI system |
| The obligation has been in force since January (approx. eight months before the hackathon) | DGI instruction / official gazette, exact date pending | to verify | Exact entry-into-force date is explicitly flagged in the v2 description as unverified |
| The DGI doctrine was updated in the days before the hackathon | DGI communication, date and content pending | to verify | If a DGI officer attends, this is the first thing tested; content of the update must be known precisely, not just its existence |
| Number of withholding codes ("plus de 40") | `schemas/tej/TEJRSCodesOperations_v1.0.xsd` (see `schemas/tej/SOURCE.md`), downloaded 2026-09-12 from jibaya.tn | to verify | Candidate answer found: exactly 36 distinct codes enumerated in the real DGI TEJ schema, RS1_000001 through RS11_000001, with two numbering gaps (RS3_000002, RS6_000004 absent) and no RS10 category. Still `to verify`: a person must confirm this is the current schema version and that the gaps are not a download/parsing error before this count goes on a slide |
| Article 62 (the anchor case: a prestataire unpaid due to a certificate error) | Code de l'IRPP/IS, Article 62, checked 2026-09-13 (D-027) | to verify | **Checked directly: the real Article 62 governs bookkeeping/accounting record obligations, not withholding certificates or code selection. It does not match the anchor case.** Real candidates in the same code: Article 52(I)(a) for the rate/category basis (now the verified row below), Article 55(I) for the certificate-delivery obligation (see the row above). The anchor case's article number needs correcting before it reaches a slide or a rule citation |
| Article 52, paragraphe I, a): honoraires, commissions, courtages, loyers et rémunérations des activités non commerciales payés par l'Etat, les collectivités locales, les personnes morales et les personnes physiques au régime réel font l'objet d'une retenue à la source (grounds rule `CIRPPIS-ART52-I-A`) | Code de l'IRPP et de l'IS, édition 2026, DGI, `https://jibaya.tn/wp-content/uploads/2026/03/11.pdf`, PDF page 84 (sha256 `49f6e72c...ceb4b7f`, full hash in `corpus/sources/SOURCE.md`) | verified | Checked by team on 2026-09-13 against the DGI PDF. Verbatim text in `rules/cirppis-art52-i-a.json`. Identical in the DGI 2025 edition. The "10%(1)" rate carries footnote (1) "Ce taux s'applique aux montants payés à partir du 1 er janvier 2021"; the rate itself is not asserted by any rule and is not verified here for use on a slide |
| Verified legal passages (the only corpus text an API may return, D-029) | `corpus/verified-passages.json`, one entry per passage: source PDF sha256, article, paragraph, page, text sha256, checked by, checked on | verified | The register extends this file to passage level (D-032). Seeded 2026-09-13 with one entry, "Article 52, I" (page 84): its indexed text lies verbatim inside the verified Article 52 I a) citation in the row above, so the entry carries that row's check (team, 2026-09-13). "Article 52, I, a)" as indexed also holds sentences nobody has checked and stays unverified. A new entry needs a person who read the passage on the official page (`python -m app.corpus.verification`) |

## Administration systems

| Claim | Source | Status | Notes |
|---|---|---|---|
| E-Sit-Fisc is the DGI's existing filing channel; this product feeds it clean data, does not replace it | DGI public documentation | to verify | Positioning claim, must be accurate about what E-Sit-Fisc does and does not do |
| RNE (Registre National des Entreprises) is queryable for counterparty registration facts | `home.registre-entreprises.tn` and `www.registre-entreprises.tn` | to verify | Re-checked 2026-09-12 from a different network: `home.registre-entreprises.tn` still returns HTTP 503, but `www.registre-entreprises.tn/rne-public` loads (real Angular portal). Its own JS bundle names four real API bases (`rne-api`, `rne-auth-api`, `rne-bor-api`, `rne-subscription-api`) and a real search endpoint (`GET /api/rne-api/front-office/entites`, params include `idUnique`, `denomination`, `nomCommercialFr`, `cnssNumPM`, etc., read directly from the client code, not guessed). Confirmed live: this endpoint returns `401 Access is denied` unauthenticated. Auth is OAuth2 via `/api/rne-auth-api/oauth/token`, requiring a real registered user account (the client's Basic auth is just the SPA's own client id, not a bypass). No unauthenticated public-search path was found in the served client code. `counterparty/` stays unbuilt: this is an account/subscription gate, not a network gate, and creating an account on a government portal is a real-world action requiring a person's decision, not something to do unilaterally |
| DGI TEJ export has a published XSD schema | `schemas/tej/*.xsd` (see `schemas/tej/SOURCE.md`), downloaded 2026-09-12 from jibaya.tn | to verify | The real schema is now in the repo and `api/app/export/tej.py` generates and validates against it directly (not a paraphrase). Still `to verify`: a person must confirm jibaya.tn's file is the current, non-draft version before relying on it for a real filing |

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
| 2026-09-12 | team | Found real DGI TEJ schema (jibaya.tn); added as candidate source for code count and schema facts, per D-019 |
| 2026-09-12 | team | Checked RNE reachability: domain returns 503, API appears contract-gated; counterparty/ stays unbuilt |
| 2026-09-12 | team | Re-checked RNE from a different network: portal now loads, real search API found in its own JS but returns 401 unauthenticated; confirmed account-gated, not network-gated, per D-020 |
| 2026-09-13 | team | Checked Article 62 directly: does not match the anchor case (it governs bookkeeping, not certificates); found real candidates (Article 52, Article 55), per D-027 |
| 2026-09-13 | team | Added Article 52(I)(a) as `verified`, checked against the DGI 2026 edition; grounds rule CIRPPIS-ART52-I-A, per D-026 |
| 2026-09-13 | team | Added the verified passage register row, seeded from the Article 52(I)(a) check, per D-032 |
