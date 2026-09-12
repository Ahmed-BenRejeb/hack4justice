# Chahed

Regulatory compliance for Tunisian MSMEs, and a verification desk for the administration.

A business uploads the documents it already holds. Chahed reads them, checks them against Tunisian fiscal and registry law with every conclusion tied to a cited article, verifies the counterparties against the RNE, and produces a pre-qualified file plus a TEJ withholding export that validates against the DGI's published schema. A public officer receives the file with every automated check already performed and every conclusion replayable.

Built for Hack4Justice 2026, Challenge A.

## Why it exists

Article 62 of the 2014 Finance Law conditions every public payment of 1,000 DT TTC or above on an attestation that the supplier has filed its due declarations. Assembling that file is manual on both sides. The DGI's e-sit-fisc tells a public body whether a supplier filed. It does not tell anyone whether the file itself is complete and correct, and the business cannot use it. Chahed is the missing half.

## Documentation

| Document | What it covers |
|---|---|
| [docs/plan.md](docs/plan.md) | Scope, roles, phases and gates. Source of truth. |
| [docs/design.md](docs/design.md) | Visual system, motion, screen specs. Binding. |
| [docs/facts.md](docs/facts.md) | Every fact we may state publicly, with verification status. |
| [docs/decision-log.md](docs/decision-log.md) | Every significant decision, dated. |
| [CLAUDE.md](CLAUDE.md) | Working rules for this repository. |

## Getting started

```
cp .env.example .env    # then fill every value; there are no defaults
npm install
npm run dev
```

Copying `.env.example` to `.env` and filling it must produce a working run. If a variable is missing the process fails loudly and names it.

## Design law

Compliance judgement is deterministic code. The model extracts facts, explains, and drafts text. It never decides whether a finding exists.

Assisted rules are the one nuance: the model supplies a fact the documents do not state, with a confidence, and the deterministic rule judges from that fact. When it cannot establish the fact, the rule escalates a specific question to a human rather than guessing.

No finding without a citation. No fact on a slide that is not verified in docs/facts.md.
