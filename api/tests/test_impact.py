"""The impact panel's numbers: counted here, with the calculation inputs labelled (J9, D-016)."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Finding, Organisation, Rule, SupplierFact
from app.impact.measurement import (
    INTERVENTIONS_PER_ERROR,
    OFFICER_HOURS_PER_INTERVENTION,
    measure,
)
from app.main import app
from tests.conftest import AuthHeaders

client = TestClient(app)

CITATION = {
    "citation_source": "Fixture Code, not a real legal text",
    "verbatim_text": "Ceci est un texte de test.",
    "url": "https://example.test/fixture",
    "logic_ref": "tests.fixtures.rule_logic.decide_by_status",
}


def _organisation(db: Session, name: str, tax_id: str) -> Organisation:
    organisation = Organisation(name=name, tax_id=tax_id, kind="msme")
    db.add(organisation)
    db.flush()
    return organisation


def _document(db: Session, organisation: Organisation) -> Document:
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="accountant@example.tn",
        filename="facture.pdf",
        storage_ref="facture.pdf",
        status="extracted",
    )
    db.add(document)
    db.flush()
    return document


def _rule(db: Session, code: str, error_codes: list[str]) -> Rule:
    rule = Rule(
        **CITATION, code=code, article_ref=f"Art. {code}", error_codes=error_codes
    )
    db.add(rule)
    db.flush()
    return rule


def _finding(
    db: Session,
    document: Document,
    rule: Rule,
    status: str,
    decided_code: str | None = None,
    missing_fact: str | None = None,
) -> None:
    db.add(
        Finding(
            document_id=document.id,
            rule_id=rule.id,
            status=status,
            decided_code=decided_code,
            missing_fact=missing_fact,
        )
    )
    db.flush()


def test_measure_counts_nothing_on_an_empty_database(db: Session) -> None:
    measurement = measure(db)

    assert measurement.documents == 0
    assert measurement.errors_intercepted == 0
    assert measurement.officer_hours_saved == 0
    # The inputs are still reported, so a panel showing zero still shows its basis.
    assert [entry.basis for entry in measurement.inputs] == ["estimate", "estimate"]


def test_only_codes_a_rule_declares_as_errors_are_counted(db: Session) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    document = _document(db, organisation)
    reporting = _rule(db, "RULE-ERRORS", ["ART52_WITHHOLDING_MISSING"])
    proposing = _rule(db, "RULE-PROPOSES", [])

    _finding(
        db, document, reporting, "decided", decided_code="ART52_WITHHOLDING_MISSING"
    )
    _finding(
        db, document, reporting, "decided", decided_code="ART52_WITHHOLDING_PRESENT"
    )
    # A proposal is an outcome, not an error, however many the rule reaches.
    _finding(db, document, proposing, "decided", decided_code="RS2_000002")
    db.commit()

    measurement = measure(db)

    assert measurement.findings_decided == 3
    assert measurement.errors_intercepted == 1
    by_rule = {count.rule_code: count for count in measurement.by_rule}
    assert by_rule["RULE-ERRORS"].errors_intercepted == 1
    assert by_rule["RULE-ERRORS"].decided == 2
    assert by_rule["RULE-PROPOSES"].errors_intercepted == 0


def test_abstentions_are_counted_by_the_fact_they_name(db: Session) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    document = _document(db, organisation)
    rule = _rule(db, "RULE-ABSTAINS", [])
    _finding(db, document, rule, "abstained", missing_fact="beneficiary_fiscal_regime")
    _finding(db, document, rule, "abstained", missing_fact="beneficiary_fiscal_regime")
    _finding(db, document, rule, "abstained", missing_fact="supplier_address")
    db.commit()

    measurement = measure(db)

    assert measurement.findings_abstained == 3
    # Most frequent first: the panel leads with what blocks the most files.
    assert [
        (entry.fact_name, entry.count)
        for entry in measurement.abstentions_by_missing_fact
    ] == [
        ("beneficiary_fiscal_regime", 2),
        ("supplier_address", 1),
    ]


def test_benefit_is_derived_from_the_counted_errors(db: Session) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    document = _document(db, organisation)
    rule = _rule(db, "RULE-ERRORS", ["ART55_NET_INCOHERENT"])
    for _ in range(3):
        _finding(db, document, rule, "decided", decided_code="ART55_NET_INCOHERENT")
    db.commit()

    measurement = measure(db)

    assert measurement.errors_intercepted == 3
    assert measurement.interventions_removed == 3 * INTERVENTIONS_PER_ERROR
    assert measurement.officer_hours_saved == (
        3 * INTERVENTIONS_PER_ERROR * OFFICER_HOURS_PER_INTERVENTION
    )


def test_measurement_can_be_scoped_to_one_organisation(db: Session) -> None:
    first = _organisation(db, "Atelier Ben Salah", "9998887C")
    second = _organisation(db, "SARL Nexsol", "1112223D")
    rule = _rule(db, "RULE-ERRORS", ["ART55_NET_INCOHERENT"])
    _finding(
        db, _document(db, first), rule, "decided", decided_code="ART55_NET_INCOHERENT"
    )
    _finding(
        db, _document(db, second), rule, "decided", decided_code="ART55_NET_INCOHERENT"
    )
    db.add(
        SupplierFact(
            organisation_id=first.id,
            supplier_tax_id="1234567A",
            fact_name="beneficiary_fiscal_regime",
            value="reel",
            confirmed_by="owner@example.tn",
        )
    )
    db.commit()

    scoped = measure(db, organisation_id=first.id)

    assert scoped.documents == 1
    assert scoped.errors_intercepted == 1
    assert scoped.facts_confirmed_by_people == 1
    assert measure(db).errors_intercepted == 2


def test_impact_endpoint_returns_counts_and_labelled_inputs(
    db: Session, auth_headers: AuthHeaders
) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    document = _document(db, organisation)
    rule = _rule(db, "RULE-ERRORS", ["TEJ_MATRICULE_INVALID"])
    _finding(db, document, rule, "decided", decided_code="TEJ_MATRICULE_INVALID")
    db.commit()

    body = client.get("/api/v1/impact", headers=auth_headers("officer")).json()

    assert body["documents"] == 1
    assert body["errors_intercepted"] == 1
    assert body["by_rule"][0]["rule_code"] == "RULE-ERRORS"
    assert {entry["name"]: entry["basis"] for entry in body["inputs"]} == {
        "interventions_per_error": "estimate",
        "officer_hours_per_intervention": "estimate",
    }
