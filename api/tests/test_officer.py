import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Finding, Organisation, Rule
from app.main import app
from tests.conftest import AuthHeaders

client = TestClient(app)


@pytest.fixture(autouse=True)
def _signed_in_as_officer(auth_headers: AuthHeaders) -> None:
    client.headers.update(auth_headers("officer"))


def _make_extracted_document(db: Session) -> Document:
    organisation = Organisation(
        name="Atelier Ben Salah", tax_id="1234567A", kind="msme"
    )
    db.add(organisation)
    db.flush()
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        filename="certificat.pdf",
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
    [item] = response.json()
    assert item["id"] == str(document.id)
    assert item["filename"] == "certificat.pdf"
    assert item["organisation_name"] == "Atelier Ben Salah"
    assert (item["decided_count"], item["abstained_count"]) == (0, 0)
    assert item["missing_facts"] == []


def _make_rule(db: Session) -> Rule:
    rule = Rule(
        code="TEST-COUNT",
        citation_source="Fixture Code, not a real legal text",
        article_ref="Art. 0",
        verbatim_text="Ceci est un texte de test.",
        url="https://example.test/fixture-article-0",
        logic_ref="tests.fixtures.rule_logic.decide_by_status",
    )
    db.add(rule)
    db.flush()
    return rule


def test_queue_names_each_missing_fact_once_per_file(db: Session) -> None:
    document = _make_extracted_document(db)
    rule = _make_rule(db)
    db.add_all(
        [
            Finding(
                document_id=document.id,
                rule_id=rule.id,
                status="abstained",
                missing_fact=fact,
            )
            for fact in ("status", "beneficiary_fiscal_regime", "status")
        ]
        + [
            Finding(
                document_id=document.id,
                rule_id=rule.id,
                status="decided",
                decided_code="TEST-A",
            )
        ]
    )
    db.commit()

    [item] = client.get("/api/v1/officer/queue").json()

    assert item["missing_facts"] == ["beneficiary_fiscal_regime", "status"]


def test_queue_counts_findings_per_status(db: Session) -> None:
    document = _make_extracted_document(db)
    rule = _make_rule(db)
    db.add_all(
        [
            Finding(
                document_id=document.id,
                rule_id=rule.id,
                status="decided",
                decided_code="TEST-A",
            ),
            Finding(
                document_id=document.id,
                rule_id=rule.id,
                status="decided",
                decided_code="TEST-B",
            ),
            Finding(
                document_id=document.id,
                rule_id=rule.id,
                status="abstained",
                missing_fact="status",
            ),
        ]
    )
    db.commit()

    [item] = client.get("/api/v1/officer/queue").json()

    assert (item["decided_count"], item["abstained_count"]) == (2, 1)


def test_decision_removes_document_from_queue(db: Session) -> None:
    document = _make_extracted_document(db)

    response = client.post(
        "/api/v1/officer/decisions",
        json={
            "document_id": str(document.id),
            "action": "validated",
            "note": "ok",
        },
    )
    assert response.status_code == 201
    assert response.json()["action"] == "validated"
    # The deciding officer is the signed-in user, not a value the request supplies.
    assert response.json()["officer_id"].startswith("officer-")

    queue = client.get("/api/v1/officer/queue").json()
    assert str(document.id) not in [item["id"] for item in queue]

    db.refresh(document)
    assert document.status == "validated"


def test_decision_on_unknown_document_returns_404() -> None:
    response = client.post(
        "/api/v1/officer/decisions",
        json={
            "document_id": "00000000-0000-0000-0000-000000000000",
            "action": "flagged",
        },
    )
    assert response.status_code == 404


def test_second_decision_on_same_document_returns_409(db: Session) -> None:
    document = _make_extracted_document(db)
    payload = {
        "document_id": str(document.id),
        "action": "flagged",
    }

    first = client.post("/api/v1/officer/decisions", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/officer/decisions", json=payload)
    assert second.status_code == 409
