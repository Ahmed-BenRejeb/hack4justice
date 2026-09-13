import pytest
from sqlalchemy.orm import Session

from app.db.models import Citation, Document, Extraction, Organisation, Rule
from app.extraction.fields import FIELD_CONFIDENCE_THRESHOLD
from app.rules.engine import Facts, TraceStep, evaluate
from app.rules.service import document_facts

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

    # A document fact carries no confidence and no confirmation: those belong to a
    # model-supplied and a person-confirmed fact respectively.
    assert finding.trace == [
        {
            "fact": "status",
            "source": "document",
            "value": "known",
            "confidence": None,
            "threshold": None,
            "confirmed_by": None,
            "confirmed_at": None,
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


def test_facts_step_traces_model_facts_with_their_confidence() -> None:
    facts = Facts(
        {"payment_category": "honoraires", "status": "known"},
        model_confidences={"payment_category": 0.86, "beneficiary_fiscal_regime": None},
        threshold=0.5,
    )

    assert facts["status"] == "known"
    assert facts.step("payment_category") == TraceStep(
        fact="payment_category",
        source="model",
        value="honoraires",
        confidence=0.86,
        threshold=0.5,
    )
    # Asked of the model but not established: still traced as the model's, with no value.
    assert facts.step("beneficiary_fiscal_regime") == TraceStep(
        fact="beneficiary_fiscal_regime",
        source="model",
        value=None,
        confidence=None,
        threshold=0.5,
    )
    assert facts.step("status") == TraceStep(
        fact="status", source="document", value="known"
    )


def test_document_facts_mark_every_field_the_model_is_asked_for(db: Session) -> None:
    document = _make_document(db)
    db.add_all(
        [
            Extraction(
                document_id=document.id,
                field_name="full_text",
                value="texte",
                confidence=1.0,
                source="extracted",
            ),
            Extraction(
                document_id=document.id,
                field_name="payment_category",
                value="honoraires",
                confidence=0.8,
                source="assisted",
            ),
        ]
    )
    db.flush()

    facts = document_facts(db, document.id)

    assert facts.step("full_text").source == "document"
    assert facts.step("payment_category").confidence == 0.8
    assert facts.step("supplier_tax_id") == TraceStep(
        fact="supplier_tax_id",
        source="model",
        value=None,
        confidence=None,
        threshold=FIELD_CONFIDENCE_THRESHOLD,
    )


def test_evaluate_rejects_a_rule_that_returns_the_wrong_type(db: Session) -> None:
    document = _make_document(db)
    rule = _make_rule(db, "tests.fixtures.rule_logic.always_wrong_return_type")

    with pytest.raises(TypeError):
        evaluate(db, document.id, rule, {})
