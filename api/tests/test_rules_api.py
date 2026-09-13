from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Rule
from app.main import app

client = TestClient(app)


def test_list_rules_returns_full_citation(db: Session) -> None:
    rule = Rule(
        code="TEST-001",
        citation_source="Fixture Code, not a real legal text",
        article_ref="Art. 0",
        verbatim_text="Ceci est un texte de test.",
        url="https://example.test/fixture-article-0",
        logic_ref="app.rules.fixtures.test_001",
    )
    db.add(rule)
    db.commit()

    response = client.get("/api/v1/rules")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["code"] == "TEST-001"
    assert body[0]["verbatim_text"] == "Ceci est un texte de test."
