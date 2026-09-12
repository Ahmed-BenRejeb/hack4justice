import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Organisation
from app.main import app
from tests.conftest import make_born_digital_pdf

client = TestClient(app)


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
    assert body["status"] == "extracted"
    assert body["storage_ref"].endswith(".pdf")

    detail = client.get(f"/api/v1/documents/{body['id']}")
    assert detail.status_code == 200
    extractions = detail.json()["extractions"]
    assert len(extractions) == 1
    assert extractions[0]["field_name"] == "full_text"
    assert "article 62" in extractions[0]["value"]


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
