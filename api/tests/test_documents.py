import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Export, OfficerDecision, Organisation, Rule
from app.extraction.fields import FIELD_QUESTIONS
from app.main import app
from tests.conftest import make_born_digital_pdf

client = TestClient(app)

FIXTURE_RULE = {
    "citation_source": "Fixture Code, not a real legal text",
    "article_ref": "Art. 0",
    "verbatim_text": "Ceci est un texte de test.",
    "url": "https://example.test/fixture-article-0",
}


def _make_organisation(db: Session) -> Organisation:
    organisation = Organisation(
        name="Atelier Ben Salah", tax_id="1234567A", kind="msme"
    )
    db.add(organisation)
    db.commit()
    db.refresh(organisation)
    return organisation


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_document_persists_and_extracts_it(db: Session) -> None:
    organisation = _make_organisation(db)
    pdf_bytes = make_born_digital_pdf("Certificat de retenue a la source: article 62.")

    response = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={"file": ("certificat.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["organisation_id"] == str(organisation.id)
    assert body["filename"] == "certificat.pdf"
    assert body["status"] == "extracted"
    assert body["storage_ref"].endswith(".pdf")

    detail = client.get(f"/api/v1/documents/{body['id']}")
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["organisation"]["name"] == "Atelier Ben Salah"
    assert detail_body["officer_decision"] is None
    assert detail_body["export"] is None
    extractions = detail_body["extractions"]
    # At least full_text; sparse source text may or may not yield structured
    # fields above the confidence threshold (live model call).
    assert len(extractions) >= 1
    full_text = next(e for e in extractions if e["field_name"] == "full_text")
    assert "article 62" in full_text["value"]


def test_upload_extracts_structured_fiscal_fields(db: Session) -> None:
    organisation = _make_organisation(db)
    pdf_bytes = make_born_digital_pdf(
        "Facture Atelier Ben Salah matricule fiscal 1234567A, "
        "honoraires de conseil, montant HT 1000.000 TND, regime reel."
    )

    upload = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={"file": ("facture.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    document_id = upload.json()["id"]

    detail = client.get(f"/api/v1/documents/{document_id}").json()
    extractions = detail["extractions"]

    assert len(extractions) > 1
    field_names = {e["field_name"] for e in extractions}
    # Every structured field name is either the full document text or from
    # the fixed vocabulary web/lib/labels.ts also carries.
    assert field_names <= {"full_text"} | set(FIELD_QUESTIONS)
    structured = [e for e in extractions if e["field_name"] != "full_text"]
    assert all(e["source"] == "assisted" for e in structured)
    assert all(e["confidence"] >= 0.5 for e in structured)


def test_document_detail_includes_decision_and_export(db: Session) -> None:
    organisation = _make_organisation(db)
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        filename="certificat.pdf",
        storage_ref="fixture.pdf",
        status="validated",
    )
    db.add(document)
    db.flush()
    db.add(
        OfficerDecision(
            document_id=document.id,
            officer_id="officer@dgi.tn",
            action="validated",
            note="ok",
        )
    )
    db.add(Export(document_id=document.id, xml_ref="decl.xml", xsd_validated=True))
    db.commit()

    body = client.get(f"/api/v1/documents/{document.id}").json()

    assert body["officer_decision"]["action"] == "validated"
    assert body["officer_decision"]["note"] == "ok"
    assert body["export"]["xml_ref"] == "decl.xml"
    assert body["export"]["xsd_validated"] is True


def test_upload_document_unsupported_type_marks_extraction_failed(db: Session) -> None:
    organisation = _make_organisation(db)

    response = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={"file": ("notes.txt", io.BytesIO(b"plain text notes"), "text/plain")},
    )

    assert response.status_code == 201
    assert response.json()["status"] == "extraction_failed"


def test_upload_document_unknown_organisation_returns_404() -> None:
    response = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": "00000000-0000-0000-0000-000000000000",
            "uploaded_by": "accountant@example.tn",
        },
        files={
            "file": ("certificat.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")
        },
    )

    assert response.status_code == 404


def test_get_document_unknown_id_returns_404() -> None:
    response = client.get("/api/v1/documents/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_findings_unknown_document_returns_404() -> None:
    response = client.get(
        "/api/v1/documents/00000000-0000-0000-0000-000000000000/findings"
    )
    assert response.status_code == 404


def test_upload_evaluates_registered_rules_and_abstains_when_fact_missing(
    db: Session,
) -> None:
    organisation = _make_organisation(db)
    db.add(
        Rule(
            **FIXTURE_RULE,
            code="TEST-ABSTAIN",
            logic_ref="tests.fixtures.rule_logic.decide_by_status",
        )
    )
    db.commit()
    pdf_bytes = make_born_digital_pdf("Une facture quelconque, sans rapport.")

    upload = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={"file": ("facture.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    document_id = upload.json()["id"]

    findings = client.get(f"/api/v1/documents/{document_id}/findings").json()

    assert len(findings) == 1
    assert findings[0]["status"] == "abstained"
    assert findings[0]["rule_code"] == "TEST-ABSTAIN"
    assert findings[0]["missing_fact"] == "status"
    assert findings[0]["citation"]["article_ref"] == "Art. 0"


def test_upload_evaluates_registered_rules_and_decides_when_fact_present(
    db: Session,
) -> None:
    organisation = _make_organisation(db)
    db.add(
        Rule(
            **FIXTURE_RULE,
            code="TEST-DECIDE",
            logic_ref="tests.fixtures.rule_logic.decide_if_mentions_article_62",
        )
    )
    db.commit()
    pdf_bytes = make_born_digital_pdf("Certificat de retenue a la source: article 62.")

    upload = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={"file": ("certificat.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    document_id = upload.json()["id"]

    findings = client.get(f"/api/v1/documents/{document_id}/findings").json()

    assert len(findings) == 1
    assert findings[0]["status"] == "decided"
    assert findings[0]["rule_code"] == "TEST-DECIDE"
    assert findings[0]["decided_code"] == "TEST-B"
    assert findings[0]["citation"]["verbatim_text"] == "Ceci est un texte de test."
