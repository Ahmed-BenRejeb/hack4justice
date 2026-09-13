"""Runs every registered rule against a document's currently known facts."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Extraction, Finding, Rule
from app.extraction.fields import FIELD_CONFIDENCE_THRESHOLD, FIELD_QUESTIONS
from app.rules.engine import Facts, evaluate


def document_facts(db: Session, document_id: UUID) -> Facts:
    """The document's extractions as rule facts.

    Every field the model is asked for (`FIELD_QUESTIONS`) is marked as
    model-supplied, with its confidence when it was extracted and None when it
    was not, so a rule's trace says the model could not establish it (D-046).
    """
    extractions = db.query(Extraction).filter_by(document_id=document_id).all()
    confidences = {
        extraction.field_name: extraction.confidence
        for extraction in extractions
        if extraction.source == "assisted"
    }
    return Facts(
        {extraction.field_name: extraction.value for extraction in extractions},
        model_confidences={name: confidences.get(name) for name in FIELD_QUESTIONS},
        threshold=FIELD_CONFIDENCE_THRESHOLD,
    )


def evaluate_all_rules(db: Session, document_id: UUID) -> list[Finding]:
    """Evaluate every rule in the registry against the document's extractions.

    With an empty registry (no verified citation yet) this is a no-op that
    returns an empty list; it is real, tested infrastructure regardless.
    """
    facts = document_facts(db, document_id)
    return [evaluate(db, document_id, rule, facts) for rule in db.query(Rule).all()]
