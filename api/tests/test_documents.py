import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Organisation
from app.main import app

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


def test_upload_document_persists_and_returns_it(db: Session) -> None:
    organisation = _make_organisation(db)

    response = client.post(
        "/api/v1/documents",
        params={
            "organisation_id": str(organisation.id),
            "uploaded_by": "accountant@example.tn",
        },
        files={
            "file": ("certificat.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["organisation_id"] == str(organisation.id)
    assert body["status"] == "uploaded"
    assert body["storage_ref"].endswith(".pdf")


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
