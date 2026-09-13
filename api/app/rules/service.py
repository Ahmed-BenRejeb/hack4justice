"""Runs every registered rule against a document's currently known facts."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Citation, Document, Extraction, Finding, Rule
from app.extraction.fields import FIELD_CONFIDENCE_THRESHOLD, FIELD_QUESTIONS
from app.rules.engine import Facts, PersonFact, evaluate
from app.supplier.facts import current_facts


def document_facts(db: Session, document_id: UUID) -> Facts:
    """The document's extractions, plus what a person confirmed about its supplier.

    Every field the model is asked for (`FIELD_QUESTIONS`) is marked as
    model-supplied, with its confidence when it was extracted and None when it
    was not, so a rule's trace says the model could not establish it (D-046).

    A fact a person confirmed about this supplier overrides the model's answer
    and is traced as confirmed by that person (J4): it is the more
    authoritative of the two, and it is exactly what the abstention asked for.
    """
    extractions = db.query(Extraction).filter_by(document_id=document_id).all()
    values = {extraction.field_name: extraction.value for extraction in extractions}
    confidences = {
        extraction.field_name: extraction.confidence
        for extraction in extractions
        if extraction.source == "assisted"
    }

    person_facts: dict[str, PersonFact] = {}
    document = db.get(Document, document_id)
    supplier_tax_id = values.get("supplier_tax_id")
    if document is not None and supplier_tax_id:
        for name, fact in current_facts(
            db, document.organisation_id, supplier_tax_id, datetime.now(UTC).date()
        ).items():
            values[name] = fact.value
            person_facts[name] = PersonFact(
                value=fact.value,
                confirmed_by=fact.confirmed_by,
                confirmed_at=fact.confirmed_at.date().isoformat(),
            )

    return Facts(
        values,
        model_confidences={name: confidences.get(name) for name in FIELD_QUESTIONS},
        threshold=FIELD_CONFIDENCE_THRESHOLD,
        person_facts=person_facts,
    )


def evaluate_all_rules(db: Session, document_id: UUID) -> list[Finding]:
    """Evaluate every rule in the registry against the document's extractions.

    With an empty registry (no verified citation yet) this is a no-op that
    returns an empty list; it is real, tested infrastructure regardless.
    """
    facts = document_facts(db, document_id)
    return [evaluate(db, document_id, rule, facts) for rule in db.query(Rule).all()]


def reevaluate_document(db: Session, document_id: UUID) -> list[Finding]:
    """Replace a document's findings with a fresh evaluation (B4, J4).

    Run after a person answers what a rule was missing. The previous findings
    are removed rather than kept beside the new ones: a finding states the
    current outcome for its rule, and showing an abstention next to the
    decision that replaced it would say the rule reached both. The history of
    replaced findings belongs to the audit trail (A2), which is not built yet.
    """
    finding_ids = [
        finding.id
        for finding in db.query(Finding).filter_by(document_id=document_id).all()
    ]
    if finding_ids:
        db.query(Citation).filter(Citation.finding_id.in_(finding_ids)).delete(
            synchronize_session=False
        )
        db.query(Finding).filter(Finding.id.in_(finding_ids)).delete(
            synchronize_session=False
        )
        db.flush()
    return evaluate_all_rules(db, document_id)
