"""What the pipeline itself measured, for the impact panel (J9, F1).

Every count here is computed from this database, so the panel states the
dataset it describes rather than implying a national figure. The two
calculation inputs are returned with their basis, so an unsourced one is
labelled an estimate on screen (`docs/facts.md`, estimates rule; D-016).
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import require_officer
from app.db.session import get_db
from app.impact.measurement import measure

router = APIRouter(
    prefix="/impact", tags=["impact"], dependencies=[Depends(require_officer)]
)


class RuleCountOut(BaseModel):
    rule_code: str
    article_ref: str
    decided: int
    abstained: int
    errors_intercepted: int

    model_config = {"from_attributes": True}


class MissingFactCountOut(BaseModel):
    fact_name: str
    count: int

    model_config = {"from_attributes": True}


class CalculationInputOut(BaseModel):
    """A multiplicand and its basis; "estimate" must be shown as such."""

    name: str
    value: float
    basis: str

    model_config = {"from_attributes": True}


class MeasurementOut(BaseModel):
    documents: int
    documents_analysed: int
    findings_decided: int
    findings_abstained: int
    errors_intercepted: int
    facts_confirmed_by_people: int
    by_rule: list[RuleCountOut]
    abstentions_by_missing_fact: list[MissingFactCountOut]
    inputs: list[CalculationInputOut]
    interventions_removed: float
    officer_hours_saved: float

    model_config = {"from_attributes": True}


@router.get("", response_model=MeasurementOut)
def get_impact(
    organisation_id: uuid.UUID | None = None, db: Session = Depends(get_db)
) -> MeasurementOut:
    """Counts observed in this deployment, and the benefit figures derived from them."""
    return MeasurementOut.model_validate(measure(db, organisation_id))
