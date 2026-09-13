"""What the system itself observed, and the benefit calculation derived from it (J9, F1).

Two kinds of number live here and are never mixed:

- **Counts**, computed from this database. They are facts about this
  deployment's own data, so they need no entry in docs/facts.md. They are
  reported with the dataset they come from, which on the demo is a
  demonstration set, not production.
- **Calculation inputs**, which are not observed here: how many downstream
  interventions one error causes, and how long an officer spends on one. Each
  carries its own basis, so an unsourced input is labelled an estimate wherever
  it is shown (`docs/facts.md`, estimates rule; D-016).

Impact is errors prevented, not time saved (D-009). The hours figure exists
only because the hackathon brief requires one, and it is returned beside the
counts that produce it, never alone (D-016).

No national projection is computed here: its multiplicands (annual certificate
volume, observed national error rate) are not in this database and are not
verified, and an unsourced figure does not go on a screen.
"""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Document, Finding, Rule, SupplierFact

# Calculation inputs, documented defaults rather than identity values (root
# CLAUDE.md configuration rule). Both are unsourced: every response marks them
# as estimates so no screen can show them as established.
INTERVENTIONS_PER_ERROR = 2.0
"""Downstream interventions one uncorrected error causes: a corrected declaration, a
cross-check investigation, a support call. Unsourced (`docs/facts.md`, to verify)."""

OFFICER_HOURS_PER_INTERVENTION = 0.5
"""Officer time spent on one downstream intervention. Unsourced (`docs/facts.md`, to verify)."""


@dataclass(frozen=True)
class RuleCount:
    """One rule's outcomes over the dataset."""

    rule_code: str
    article_ref: str
    decided: int
    abstained: int
    # Decided findings whose code the rule declares as reporting a problem found.
    errors_intercepted: int


@dataclass(frozen=True)
class MissingFactCount:
    fact_name: str
    count: int


@dataclass(frozen=True)
class CalculationInput:
    """One multiplicand, with the basis a screen must show next to it."""

    name: str
    value: float
    # "estimate" until a person sources it and promotes it in docs/facts.md.
    basis: str


@dataclass(frozen=True)
class Measurement:
    """Counts observed here, then the benefit calculation derived from them."""

    documents: int
    documents_analysed: int
    findings_decided: int
    findings_abstained: int
    errors_intercepted: int
    facts_confirmed_by_people: int
    by_rule: list[RuleCount]
    abstentions_by_missing_fact: list[MissingFactCount]
    inputs: list[CalculationInput]
    interventions_removed: float
    officer_hours_saved: float


def measure(db: Session, organisation_id: UUID | None = None) -> Measurement:
    """Count what this database holds, then derive the benefit figures from it.

    Scoped to one organisation when given, so a pilot reports its own files.
    """
    documents = db.query(Document)
    if organisation_id is not None:
        documents = documents.filter(Document.organisation_id == organisation_id)
    document_ids = [document.id for document in documents.all()]

    findings = db.query(Finding, Rule).join(Rule, Rule.id == Finding.rule_id)
    if organisation_id is not None:
        findings = findings.filter(Finding.document_id.in_(document_ids or [None]))
    rows = findings.all()

    per_rule: dict[str, RuleCount] = {}
    missing: dict[str, int] = {}
    analysed: set[UUID] = set()
    for finding, rule in rows:
        analysed.add(finding.document_id)
        current = per_rule.get(
            rule.code, RuleCount(rule.code, rule.article_ref, 0, 0, 0)
        )
        if finding.status == "decided":
            intercepted = finding.decided_code in (rule.error_codes or [])
            per_rule[rule.code] = RuleCount(
                rule.code,
                rule.article_ref,
                current.decided + 1,
                current.abstained,
                current.errors_intercepted + (1 if intercepted else 0),
            )
        else:
            per_rule[rule.code] = RuleCount(
                rule.code,
                rule.article_ref,
                current.decided,
                current.abstained + 1,
                current.errors_intercepted,
            )
            if finding.missing_fact:
                missing[finding.missing_fact] = missing.get(finding.missing_fact, 0) + 1

    by_rule = sorted(
        per_rule.values(),
        key=lambda count: (-count.errors_intercepted, count.rule_code),
    )
    errors_intercepted = sum(count.errors_intercepted for count in by_rule)

    confirmed = db.query(func.count(SupplierFact.id))
    if organisation_id is not None:
        confirmed = confirmed.filter(SupplierFact.organisation_id == organisation_id)

    interventions_removed = errors_intercepted * INTERVENTIONS_PER_ERROR
    return Measurement(
        documents=len(document_ids),
        documents_analysed=len(analysed),
        findings_decided=sum(count.decided for count in by_rule),
        findings_abstained=sum(count.abstained for count in by_rule),
        errors_intercepted=errors_intercepted,
        facts_confirmed_by_people=confirmed.scalar() or 0,
        by_rule=by_rule,
        abstentions_by_missing_fact=[
            MissingFactCount(fact_name=name, count=count)
            for name, count in sorted(
                missing.items(), key=lambda item: (-item[1], item[0])
            )
        ],
        inputs=[
            CalculationInput(
                name="interventions_per_error",
                value=INTERVENTIONS_PER_ERROR,
                basis="estimate",
            ),
            CalculationInput(
                name="officer_hours_per_intervention",
                value=OFFICER_HOURS_PER_INTERVENTION,
                basis="estimate",
            ),
        ],
        interventions_removed=interventions_removed,
        officer_hours_saved=interventions_removed * OFFICER_HOURS_PER_INTERVENTION,
    )
