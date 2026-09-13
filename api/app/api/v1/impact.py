"""What the pipeline itself measured, for the impact panel (J9, F1).

Every count here is computed from this database, so the panel states the
dataset it describes rather than implying a national figure. The two
calculation inputs are returned with their basis, so an unsourced one is
labelled an estimate on screen (`docs/facts.md`, estimates rule; D-016).
"""

import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import current_user, member_of
from app.db.models import User
from app.db.session import get_db
from app.impact.activity import activity
from app.impact.measurement import measure

router = APIRouter(prefix="/impact", tags=["impact"])


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


def _check_scope(user: User, organisation_id: uuid.UUID | None) -> None:
    """An officer reads the whole deployment or any one organisation; a filer only one of their own.

    The deployment-wide figures stay the administration's (D-053).
    """
    if not (
        user.role == "officer"
        or (organisation_id is not None and member_of(user, organisation_id))
    ):
        raise HTTPException(status_code=403, detail="this role may not use this route")


@router.get("", response_model=MeasurementOut)
def get_impact(
    organisation_id: uuid.UUID | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> MeasurementOut:
    """Counts observed in this deployment, and the benefit figures derived from them."""
    _check_scope(user, organisation_id)
    return MeasurementOut.model_validate(measure(db, organisation_id))


class DayCountOut(BaseModel):
    day: date
    count: int

    model_config = {"from_attributes": True}


class RecentDocumentOut(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    organisation_name: str
    filename: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityOut(BaseModel):
    documents_by_status: dict[str, int]
    documents_by_day: list[DayCountOut]
    documents_exported: int
    recent_documents: list[RecentDocumentOut]

    model_config = {"from_attributes": True}


@router.get("/activity", response_model=ActivityOut)
def get_activity(
    organisation_id: uuid.UUID | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> ActivityOut:
    """Files by status and by Tunisian day, exported files and the latest files, for the dashboards."""
    _check_scope(user, organisation_id)
    return ActivityOut.model_validate(activity(db, organisation_id))
