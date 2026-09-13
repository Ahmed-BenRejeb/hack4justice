"""The abstention resolution loop: a person answers, the rule decides (B3, B4, J4, J11)."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Extraction, Organisation, Rule, SupplierFact
from app.main import app
from app.rules.service import document_facts, evaluate_all_rules
from app.supplier.facts import (
    UnacceptedValue,
    UnanswerableFact,
    confirm_fact,
    current_facts,
)

client = TestClient(app)

CODE_RULE = {
    "code": "CIRPPIS-ART52-I-A-CODE",
    "citation_source": "Fixture Code, not a real legal text",
    "article_ref": "Art. 52",
    "verbatim_text": "Ceci est un texte de test.",
    "url": "https://example.test/fixture-article-52",
    "logic_ref": "app.rules.withholding_code_proposal.propose_withholding_code",
}

HONORAIRES_TEXT = "FACTURE 2026-1: honoraires de conseil, retenue a la source."


def _organisation(db: Session) -> Organisation:
    organisation = Organisation(
        name="Atelier Ben Salah", tax_id="9998887C", kind="msme"
    )
    db.add(organisation)
    db.commit()
    db.refresh(organisation)
    return organisation


def _document(
    db: Session, organisation: Organisation, fields: dict[str, str]
) -> Document:
    """A document whose extractions are `fields`, as the model would have left them."""
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        filename="facture.pdf",
        storage_ref="facture.pdf",
        status="extracted",
    )
    db.add(document)
    db.flush()
    for field_name, value in fields.items():
        db.add(
            Extraction(
                document_id=document.id,
                field_name=field_name,
                value=value,
                confidence=1.0 if field_name == "full_text" else 0.9,
                source="extracted" if field_name == "full_text" else "assisted",
            )
        )
    db.commit()
    db.refresh(document)
    return document


def _abstaining_document(db: Session, organisation: Organisation) -> Document:
    """Honoraires with an identified supplier, but no fiscal regime: the code rule abstains."""
    return _document(
        db,
        organisation,
        {
            "full_text": HONORAIRES_TEXT,
            "supplier_tax_id": "1234567A",
            "payment_category": "honoraires",
        },
    )


def test_confirm_fact_rejects_a_fact_that_is_not_answerable(db: Session) -> None:
    organisation = _organisation(db)

    with pytest.raises(UnanswerableFact):
        confirm_fact(
            db,
            organisation_id=organisation.id,
            supplier_tax_id="1234567A",
            fact_name="payment_category",
            value="honoraires",
            confirmed_by="owner@example.tn",
        )


def test_confirm_fact_rejects_a_value_the_fact_does_not_accept(db: Session) -> None:
    organisation = _organisation(db)

    with pytest.raises(UnacceptedValue):
        confirm_fact(
            db,
            organisation_id=organisation.id,
            supplier_tax_id="1234567A",
            fact_name="beneficiary_fiscal_regime",
            value="peut-etre",
            confirmed_by="owner@example.tn",
        )


def test_confirming_twice_replaces_the_answer(db: Session) -> None:
    organisation = _organisation(db)
    for value in ("forfait", "reel"):
        confirm_fact(
            db,
            organisation_id=organisation.id,
            supplier_tax_id="1234567A",
            fact_name="beneficiary_fiscal_regime",
            value=value,
            confirmed_by="owner@example.tn",
        )
    db.commit()

    rows = db.query(SupplierFact).all()
    assert len(rows) == 1
    assert rows[0].value == "reel"


def test_an_expired_fact_is_not_applied(db: Session) -> None:
    organisation = _organisation(db)
    today = datetime.now(UTC).date()
    confirm_fact(
        db,
        organisation_id=organisation.id,
        supplier_tax_id="1234567A",
        fact_name="beneficiary_fiscal_regime",
        value="reel",
        confirmed_by="owner@example.tn",
        valid_until=today - timedelta(days=1),
    )
    db.commit()

    assert current_facts(db, organisation.id, "1234567A", today) == {}


def test_document_facts_prefers_a_confirmed_fact_and_traces_the_person(
    db: Session,
) -> None:
    organisation = _organisation(db)
    document = _document(
        db,
        organisation,
        {
            "full_text": HONORAIRES_TEXT,
            "supplier_tax_id": "1234567A",
            "beneficiary_fiscal_regime": "forfait",
        },
    )
    confirm_fact(
        db,
        organisation_id=organisation.id,
        supplier_tax_id="1234567A",
        fact_name="beneficiary_fiscal_regime",
        value="reel",
        confirmed_by="owner@example.tn",
    )
    db.commit()

    facts = document_facts(db, document.id)

    # The person's answer overrides the model's, and the trace says who confirmed it.
    assert facts["beneficiary_fiscal_regime"] == "reel"
    step = facts.step("beneficiary_fiscal_regime")
    assert step.source == "person"
    assert step.confirmed_by == "owner@example.tn"
    assert step.confirmed_at == datetime.now(UTC).date().isoformat()
    assert step.confidence is None


def test_answerable_facts_lists_the_supplier_and_accepted_values(db: Session) -> None:
    organisation = _organisation(db)
    document = _abstaining_document(db, organisation)

    body = client.get(f"/api/v1/documents/{document.id}/answerable-facts").json()

    assert body["supplier_tax_id"] == "1234567A"
    assert body["facts"] == [
        {"fact_name": "beneficiary_fiscal_regime", "values": ["reel", "forfait"]}
    ]


def test_answerable_facts_unknown_document_returns_404() -> None:
    response = client.get(
        f"/api/v1/documents/{uuid.uuid4()}/answerable-facts",
    )
    assert response.status_code == 404


def test_answering_an_abstention_turns_it_into_a_decision(db: Session) -> None:
    organisation = _organisation(db)
    document = _abstaining_document(db, organisation)
    db.add(Rule(**CODE_RULE))
    db.commit()

    # Evaluated as it would be on upload, it abstains: the regime is not on the document.
    evaluate_all_rules(db, document.id)
    db.commit()
    before = client.get(f"/api/v1/documents/{document.id}/findings").json()
    assert [f["status"] for f in before] == ["abstained"]
    assert before[0]["missing_fact"] == "beneficiary_fiscal_regime"

    response = client.post(
        f"/api/v1/documents/{document.id}/supplier-facts",
        json={
            "fact_name": "beneficiary_fiscal_regime",
            "value": "reel",
            "confirmed_by": "owner@example.tn",
        },
    )

    assert response.status_code == 201
    after = client.get(f"/api/v1/documents/{document.id}/findings").json()
    assert len(after) == 1
    assert after[0]["status"] == "decided"
    assert after[0]["decided_code"] == "RS2_000002"
    confirmed = [step for step in after[0]["trace"] if step["source"] == "person"]
    assert len(confirmed) == 1
    assert confirmed[0]["fact"] == "beneficiary_fiscal_regime"
    assert confirmed[0]["confirmed_by"] == "owner@example.tn"


def test_answering_refuses_a_value_the_fact_does_not_accept(db: Session) -> None:
    organisation = _organisation(db)
    document = _abstaining_document(db, organisation)

    response = client.post(
        f"/api/v1/documents/{document.id}/supplier-facts",
        json={
            "fact_name": "beneficiary_fiscal_regime",
            "value": "peut-etre",
            "confirmed_by": "owner@example.tn",
        },
    )

    assert response.status_code == 422
    assert db.query(SupplierFact).count() == 0


def test_answering_without_an_identified_supplier_returns_409(db: Session) -> None:
    organisation = _organisation(db)
    document = _document(db, organisation, {"full_text": HONORAIRES_TEXT})

    response = client.post(
        f"/api/v1/documents/{document.id}/supplier-facts",
        json={
            "fact_name": "beneficiary_fiscal_regime",
            "value": "reel",
            "confirmed_by": "owner@example.tn",
        },
    )

    assert response.status_code == 409
    assert db.query(SupplierFact).count() == 0


def test_a_second_file_from_the_same_supplier_does_not_abstain(db: Session) -> None:
    """Supplier memory (J11): the answer is kept against the supplier, not the file."""
    organisation = _organisation(db)
    first = _abstaining_document(db, organisation)
    db.add(Rule(**CODE_RULE))
    db.commit()

    client.post(
        f"/api/v1/documents/{first.id}/supplier-facts",
        json={
            "fact_name": "beneficiary_fiscal_regime",
            "value": "reel",
            "confirmed_by": "owner@example.tn",
        },
    )

    second = _abstaining_document(db, organisation)
    evaluate_all_rules(db, second.id)
    db.commit()

    findings = client.get(f"/api/v1/documents/{second.id}/findings").json()
    assert [finding["status"] for finding in findings] == ["decided"]
    assert findings[0]["decided_code"] == "RS2_000002"
