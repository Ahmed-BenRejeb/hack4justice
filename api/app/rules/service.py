"""Runs every registered rule against a document's currently known facts."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Extraction, Finding, Rule
from app.rules.engine import evaluate


def evaluate_all_rules(db: Session, document_id: UUID) -> list[Finding]:
    """Evaluate every rule in the registry against the document's extractions.

    With an empty registry (no verified citation yet) this is a no-op that
    returns an empty list; it is real, tested infrastructure regardless.
    """
    facts = {
        extraction.field_name: extraction.value
        for extraction in db.query(Extraction).filter_by(document_id=document_id).all()
    }
    return [evaluate(db, document_id, rule, facts) for rule in db.query(Rule).all()]
