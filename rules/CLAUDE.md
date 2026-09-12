# CLAUDE.md - rules/

The rule registry. This is the part of the product that decides whether a document is compliant, and the part a public officer will be most sceptical of. Treat every rule as something that will be read aloud on stage.

## Two kinds of rule

**Deterministic.** Presence, format, cross-field equality, date ordering, threshold comparison. Pure code over already-extracted values. No model involvement. These are the majority.

**Assisted.** The model supplies a fact the documents do not state (a supplier's tax regime, legal form, residency, or a semantic match between a free-text contract object and an RNE nomenclature entry), with a confidence. The deterministic part of the rule then judges compliance from that fact.

The model never judges compliance. It establishes a premise. The rule judges.

## Escalation is part of the rule

When an assisted rule cannot establish its fact above the confidence threshold, it does not fire and it does not guess. It emits an escalation: one specific question for a human, the reason it matters, and what changes depending on the answer.

An assisted rule without a written escalation question is incomplete and does not land.

## Every rule carries

- `id`, stable and never reused
- `version`, incremented on any change to the check or the citation
- `applies_to`, the document types it runs against
- `severity`: blocking, attention, or informational
- `citation`: source, article, verbatim text, URL
- `remediation`: what the user must actually do, in plain French
- `weight`, for the explainable grid

## Hard rules

- **No rule without a verified verbatim citation.** The citation is checked by a person against the official source and recorded in docs/facts.md before the rule lands.
- **Never compute an opaque score.** The output is a grid: each criterion, its result, its weight, its legal basis. An officer must be able to reconstruct and contest the reasoning line by line.
- **Rules are versioned, never edited in place** once they have produced a finding in a stored file. The audit trail records which version produced which conclusion.
- Rule identifiers are referenced by findings in the database. Renaming one is a migration, not an edit.

## Priority order if time runs short

Keep the withholding determination assisted rule. It is the demo's proof that this is not a checklist app, because the correct code depends on facts that are not on the invoice. The other two assisted rules are cuttable.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
