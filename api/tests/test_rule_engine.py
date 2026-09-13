import pytest
from sqlalchemy.orm import Session

from app.db.models import Citation, Document, Organisation, Rule
from app.rules.engine import evaluate

FIXTURE_RULE = {
    "code": "TEST-001",
    "citation_source": "Fixture Code, not a real legal text",
    "article_ref": "Art. 0",
    "verbatim_text": "Ceci est un texte de test.",
    "url": "https://example.test/fixture-article-0",
}


def _make_document(db: Session) -> Document:
    organisation = Organisation(name="Atelier Test", tax_id="1234567A", kind="msme")
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
    db.flush()
    return document


def _make_rule(db: Session, logic_ref: str) -> Rule:
    rule = Rule(**FIXTURE_RULE, logic_ref=logic_ref)
    db.add(rule)
    db.flush()
    return rule


def test_evaluate_decides_when_facts_are_sufficient(db: Session) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.decide_by_status")

    finding = evaluate(db, document.id, rule, {"status": "known"})

    assert finding.status == "decided"
    assert finding.decided_code == "TEST-A"
    citation = db.query(Citation).filter_by(finding_id=finding.id).one()
    assert citation.rule_id == rule.id


def test_evaluate_records_the_trace_the_rule_returned(db: Session) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.decide_by_status")

    finding = evaluate(db, document.id, rule, {"status": "known"})
    db.commit()
    db.refresh(finding)

    assert finding.trace == [
        {
            "fact": "status",
            "source": "document",
            "value": "known",
            "confidence": None,
            "threshold": None,
        }
    ]


def test_evaluate_records_an_empty_trace_when_the_rule_returns_none(
    db: Session,
) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.decide_if_mentions_article_62")

    finding = evaluate(db, document.id, rule, {"full_text": "article 62"})
    db.commit()
    db.refresh(finding)

    assert finding.trace == []


def test_evaluate_abstains_and_names_the_missing_fact(db: Session) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.decide_by_status")

    finding = evaluate(db, document.id, rule, {})

    assert finding.status == "abstained"
    assert finding.missing_fact == "status"
    assert finding.decided_code is None
    assert finding.trace[0]["value"] is None


def test_evaluate_rejects_a_rule_that_returns_the_wrong_type(db: Session) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.always_wrong_return_type")

    with pytest.raises(TypeError):
        evaluate(db, document.id, rule, {})
