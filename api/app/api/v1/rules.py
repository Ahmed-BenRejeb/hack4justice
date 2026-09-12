"""Read access to the rule registry. Rules are written by the loader in
app/rules, not over HTTP: there is no admin auth yet to gate a write route,
so rule management stays a seed/migration-time operation, per the cut list
in docs/plan.md section 9.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Rule
from app.db.session import get_db

router = APIRouter(prefix="/rules", tags=["rules"])


class RuleOut(BaseModel):
    id: uuid.UUID
    code: str
    citation_source: str
    article_ref: str
    verbatim_text: str
    url: str
    logic_ref: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[RuleOut])
def list_rules(db: Session = Depends(get_db)) -> list[Rule]:
    """Every rule currently in the registry, each carrying its full citation."""
    return db.query(Rule).order_by(Rule.code).all()
