import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Citation, Document, Extraction, Finding, Organisation, Rule
from app.export.derive import derive_export_draft
from app.main import app
from tests.conftest import AuthHeaders

client = TestClient(app)


@pytest.fixture(autouse=True)
def _signed_in_as_officer(auth_headers: AuthHeaders) -> None:
    client.headers.update(auth_headers("officer"))


def _make_organisation(db: Session) -> Organisation:
    organisation = Organisation(
        name="Atelier Ben Salah", tax_id="1234567A", kind="msme"
    )
    db.add(organisation)
    db.commit()
    db.refresh(organisation)
    return organisation


def _make_document(db: Session, organisation: Organisation) -> Document:
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        filename="facture.pdf",
        storage_ref="facture.pdf",
        status="extracted",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def test_derive_export_draft_with_no_extractions_is_all_null_but_declarant(
    db: Session,
) -> None:
    organisation = _make_organisation(db)
    document = _make_document(db, organisation)

    draft = derive_export_draft(db, document)

    assert draft.values.declarant_matricule_fiscal == "1234567A"
    assert draft.values.beneficiary_name is None
    assert draft.values.amount_incl_tax is None
    assert draft.derived_fields == ["declarant_matricule_fiscal"]


def test_derive_export_draft_projects_extracted_fields(db: Session) -> None:
    organisation = _make_organisation(db)
    document = _make_document(db, organisation)
    extracted = {
        "supplier_name": "Karim Jlassi",
        "supplier_tax_id": "7654321B",
        "supplier_address": "12 rue de Marseille, Tunis",
        "invoice_date": "12/03/2026",
        "withholding_rate": "1.5",
        "amount_excl_tax": "1000.0",
        "amount_vat": "190.0",
        "amount_incl_tax": "1190.0",
        "withholding_amount": "17.85",
        "amount_net_paid": "1172.15",
        "invoice_reference": "2026-0910",
    }
    for field_name, value in extracted.items():
        db.add(
            Extraction(
                document_id=document.id,
                field_name=field_name,
                value=value,
                confidence=0.9,
                source="assisted",
            )
        )
    db.commit()

    draft = derive_export_draft(db, document)

    assert draft.values.beneficiary_name == "Karim Jlassi"
    assert draft.values.beneficiary_matricule_fiscal == "7654321B"
    assert draft.values.beneficiary_address == "12 rue de Marseille, Tunis"
    assert draft.values.invoice_year == "2026"
    assert draft.values.rate == "1.5"
    assert draft.values.amount_incl_tax == "1190.0"
    assert draft.values.reference == "2026-0910"
    # Nothing computed that was not read: no code proposal finding exists yet.
    assert draft.values.code is None
    assert "beneficiary_name" in draft.derived_fields
    assert "declarant_matricule_fiscal" in draft.derived_fields
    assert "code" not in draft.derived_fields


def test_derive_export_draft_prefills_code_from_a_decided_finding(db: Session) -> None:
    organisation = _make_organisation(db)
    document = _make_document(db, organisation)
    rule = Rule(
        code="CIRPPIS-ART52-I-A-CODE",
        citation_source="test fixture, not a real citation",
        article_ref="Art. 52",
        verbatim_text="texte de test",
        url="https://example.test/fixture",
        logic_ref="app.rules.withholding_code_proposal.propose_withholding_code",
    )
    db.add(rule)
    db.flush()
    finding = Finding(
        document_id=document.id,
        rule_id=rule.id,
        status="decided",
        decided_code="RS2_000002",
    )
    db.add(finding)
    db.flush()
    db.add(Citation(finding_id=finding.id, rule_id=rule.id))
    db.commit()

    draft = derive_export_draft(db, document)

    assert draft.values.code == "RS2_000002"
    assert "code" in draft.derived_fields


def test_get_export_draft_endpoint_returns_derived_values(db: Session) -> None:
    organisation = _make_organisation(db)
    document = _make_document(db, organisation)
    db.add(
        Extraction(
            document_id=document.id,
            field_name="supplier_name",
            value="Karim Jlassi",
            confidence=0.9,
            source="assisted",
        )
    )
    db.commit()

    response = client.get(f"/api/v1/documents/{document.id}/export-draft")

    assert response.status_code == 200
    body = response.json()
    assert body["values"]["beneficiary_name"] == "Karim Jlassi"
    assert body["values"]["declarant_matricule_fiscal"] == "1234567A"
    assert "beneficiary_name" in body["derived_fields"]


def test_get_export_draft_unknown_document_returns_404() -> None:
    response = client.get(
        "/api/v1/documents/00000000-0000-0000-0000-000000000000/export-draft"
    )
    assert response.status_code == 404
