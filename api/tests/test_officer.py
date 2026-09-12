from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Organisation
from app.main import app

client = TestClient(app)


def _make_extracted_document(db: Session) -> Document:
    organisation = Organisation(
        name="Atelier Ben Salah", tax_id="1234567A", kind="msme"
    )
    db.add(organisation)
    db.flush()
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        storage_ref="fixture.pdf",
        status="extracted",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def test_queue_is_empty_with_no_extracted_documents() -> None:
    response = client.get("/api/v1/officer/queue")
    assert response.status_code == 200
    assert response.json() == []


def test_queue_lists_extracted_documents_awaiting_decision(db: Session) -> None:
    document = _make_extracted_document(db)

    response = client.get("/api/v1/officer/queue")

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert str(document.id) in ids


def test_decision_removes_document_from_queue(db: Session) -> None:
    document = _make_extracted_document(db)

    response = client.post(
        "/api/v1/officer/decisions",
        json={
            "document_id": str(document.id),
            "officer_id": "officer@dgi.tn",
            "action": "validated",
            "note": "ok",
        },
    )
    assert response.status_code == 201
    assert response.json()["action"] == "validated"

    queue = client.get("/api/v1/officer/queue").json()
    assert document.id not in [item["id"] for item in queue]

    db.refresh(document)
    assert document.status == "validated"


def test_decision_on_unknown_document_returns_404() -> None:
    response = client.post(
        "/api/v1/officer/decisions",
        json={
            "document_id": "00000000-0000-0000-0000-000000000000",
            "officer_id": "officer@dgi.tn",
            "action": "flagged",
        },
    )
    assert response.status_code == 404


def test_second_decision_on_same_document_returns_409(db: Session) -> None:
    document = _make_extracted_document(db)
    payload = {
        "document_id": str(document.id),
        "officer_id": "officer@dgi.tn",
        "action": "flagged",
    }

    first = client.post("/api/v1/officer/decisions", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/officer/decisions", json=payload)
    assert second.status_code == 409
