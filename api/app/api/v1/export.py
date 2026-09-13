"""Produces and validates the TEJ export for a validated document.

The caller supplies every field the real DGI schema requires (see
app/export/tej.py): field-level extraction (parties, amounts, rates) is not
built yet, so nothing here is inferred or defaulted from guesswork.
"""

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Document, Export, OfficerDecision
from app.db.session import get_db
from app.export import tej
from app.export.codes import operation_codes
from app.export.derive import derive_export_draft
from app.export.xsd import SchemaValidationError
from app.storage import save_upload

router = APIRouter(prefix="/documents", tags=["export"])
codes_router = APIRouter(prefix="/export", tags=["export"])


class BeneficiaireIn(BaseModel):
    matricule_fiscal: str
    categorie: Literal["PP", "PM"]
    nom_ou_raison_sociale: str
    adresse: str
    email: str
    telephone: str
    resident: bool = True


class OperationIn(BaseModel):
    code: str
    annee_facturation: str
    montant_ht: int
    taux_rs: str
    montant_ttc: int
    montant_rs: int
    montant_net_servi: int
    montant_tva: int | None = None
    cnpc: bool = False
    p_charge: bool = False


class CertificatIn(BaseModel):
    beneficiaire: BeneficiaireIn
    date_payement: str
    reference: str
    operations: list[OperationIn]


class ExportRequest(BaseModel):
    declarant_matricule_fiscal: str
    declarant_categorie: Literal["PP", "PM"]
    annee_depot: str
    mois_depot: str
    acte_depot: Literal["0", "1"] = "0"
    certificats: list[CertificatIn]


class ExportOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    xml_ref: str
    xsd_validated: bool
    validated_at: datetime

    model_config = {"from_attributes": True}


class OperationCodeOut(BaseModel):
    code: str
    description: str


class ExportDraftValuesOut(BaseModel):
    declarant_matricule_fiscal: str | None
    beneficiary_name: str | None
    beneficiary_matricule_fiscal: str | None
    beneficiary_address: str | None
    invoice_year: str | None
    code: str | None
    rate: str | None
    amount_excl_tax: str | None
    amount_vat: str | None
    amount_incl_tax: str | None
    amount_withheld: str | None
    amount_net_paid: str | None
    reference: str | None


class ExportDraftOut(BaseModel):
    """A pre-fill for the officer's export form, in officer units (dinars,
    ISO dates). Every value stays editable; `derived_fields` names which
    ones came from the document rather than being typed by the officer.
    """

    values: ExportDraftValuesOut
    derived_fields: list[str]


def _to_tej_certificat(certificat: CertificatIn) -> tej.Certificat:
    return tej.Certificat(
        beneficiaire=tej.Beneficiaire(**certificat.beneficiaire.model_dump()),
        date_payement=certificat.date_payement,
        reference=certificat.reference,
        operations=[
            tej.Operation(**operation.model_dump())
            for operation in certificat.operations
        ],
    )


@router.post("/{document_id}/export", response_model=ExportOut, status_code=201)
def export_document(
    document_id: uuid.UUID, payload: ExportRequest, db: Session = Depends(get_db)
) -> Export:
    """Build and validate the TEJ declaration for a validated document."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")

    decision = (
        db.query(OfficerDecision).filter_by(document_id=document_id).one_or_none()
    )
    if decision is None or decision.action != "validated":
        raise HTTPException(
            status_code=409,
            detail="document has no officer decision with action 'validated'",
        )

    declarant = tej.Declarant(
        matricule_fiscal=payload.declarant_matricule_fiscal,
        categorie=payload.declarant_categorie,
    )
    certificats = [_to_tej_certificat(c) for c in payload.certificats]

    try:
        xml_bytes = tej.build_and_validate(
            declarant=declarant,
            annee_depot=payload.annee_depot,
            mois_depot=payload.mois_depot,
            certificats=certificats,
            acte_depot=payload.acte_depot,
        )
    except SchemaValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors) from error

    xml_ref = save_upload("declaration.xml", xml_bytes)

    export = Export(document_id=document_id, xml_ref=xml_ref, xsd_validated=True)
    db.add(export)
    db.commit()
    db.refresh(export)
    return export


@router.get("/{document_id}/export-draft", response_model=ExportDraftOut)
def get_export_draft(
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> ExportDraftOut:
    """A pre-filled TEJ export draft, projected from the document's extractions.

    Available regardless of officer decision (the form only renders it
    after validation); nothing is inferred beyond what was extracted.
    """
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")

    draft = derive_export_draft(db, document)
    return ExportDraftOut(
        values=ExportDraftValuesOut(**draft.values.__dict__),
        derived_fields=draft.derived_fields,
    )


@codes_router.get("/operation-codes", response_model=list[OperationCodeOut])
def list_operation_codes() -> list[OperationCodeOut]:
    """The withholding operation codes the TEJ schema accepts, with the DGI's description of each."""
    return [
        OperationCodeOut(code=entry.code, description=entry.description)
        for entry in operation_codes()
    ]
