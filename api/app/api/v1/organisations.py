"""Organisation listing and creation.

There is no authentication yet, so the MSME upload screen picks an existing
organisation or creates one. Organisations created over HTTP are always MSMEs:
the administration side never uploads documents.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.models import Organisation
from app.db.session import get_db

router = APIRouter(prefix="/organisations", tags=["organisations"])


class OrganisationIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    tax_id: str = Field(min_length=1, max_length=50)

    model_config = {"str_strip_whitespace": True}


class OrganisationOut(BaseModel):
    id: uuid.UUID
    name: str
    tax_id: str
    kind: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[OrganisationOut])
def list_organisations(db: Session = Depends(get_db)) -> list[Organisation]:
    """Every organisation, alphabetically."""
    return db.query(Organisation).order_by(Organisation.name).all()


@router.post("", response_model=OrganisationOut, status_code=201)
def create_organisation(
    payload: OrganisationIn, db: Session = Depends(get_db)
) -> Organisation:
    """Create an MSME. A tax id identifies one organisation, so a duplicate is a conflict."""
    existing = db.query(Organisation).filter_by(tax_id=payload.tax_id).one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=409, detail="an organisation with this tax id already exists"
        )

    organisation = Organisation(name=payload.name, tax_id=payload.tax_id, kind="msme")
    db.add(organisation)
    db.commit()
    db.refresh(organisation)
    return organisation
