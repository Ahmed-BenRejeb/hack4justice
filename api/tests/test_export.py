from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Export, OfficerDecision, Organisation
from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
    "declarant_matricule_fiscal": "1234567A",
    "declarant_categorie": "PM",
    "annee_depot": "2026",
    "mois_depot": "03",
    "certificats": [
        {
            "beneficiaire": {
                "matricule_fiscal": "7654321B",
                "categorie": "PP",
                "nom_ou_raison_sociale": "Prestataire Test",
                "adresse": "Rue de Test, Tunis",
                "email": "contact@example.tn",
                "telephone": "+21611222333",
            },
            "date_payement": "15/03/2026",
            "reference": "CERT-001",
            "operations": [
                {
                    "code": "RS7_000001",
                    "annee_facturation": "2026",
                    "montant_ht": 1000000,
                    "taux_rs": "1.50",
                    "taux_tva": "19.00",
                    "montant_tva": 190000,
                    "montant_ttc": 1190000,
                    "montant_rs": 15000,
                    "montant_net_servi": 1175000,
                }
            ],
        }
    ],
}


def _make_validated_document(db: Session) -> Document:
    organisation = Organisation(name="Atelier Test", tax_id="1234567A", kind="msme")
    db.add(organisation)
    db.flush()
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
            document_id=document.id, officer_id="officer@dgi.tn", action="validated"
        )
    )
    db.commit()
    db.refresh(document)
    return document


def test_export_produces_real_valid_tej_xml(db: Session) -> None:
    document = _make_validated_document(db)

    response = client.post(
        f"/api/v1/documents/{document.id}/export", json=VALID_PAYLOAD
    )

    assert response.status_code == 201
    body = response.json()
    assert body["document_id"] == str(document.id)
    assert body["xsd_validated"] is True
    assert body["xml_ref"].endswith(".xml")


def test_export_rejects_a_document_without_validated_decision(db: Session) -> None:
    organisation = Organisation(name="Atelier Test", tax_id="7777777C", kind="msme")
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

    response = client.post(
        f"/api/v1/documents/{document.id}/export", json=VALID_PAYLOAD
    )

    assert response.status_code == 409


def _with_operation(**changes: object) -> dict:
    certificat = VALID_PAYLOAD["certificats"][0]
    return {
        **VALID_PAYLOAD,
        "certificats": [
            {
                **certificat,
                "operations": [{**certificat["operations"][0], **changes}],
            }
        ],
    }


def test_export_rejects_an_invalid_withholding_code_on_its_field(db: Session) -> None:
    document = _make_validated_document(db)

    response = client.post(
        f"/api/v1/documents/{document.id}/export",
        json=_with_operation(code="NOT-A-REAL-CODE"),
    )

    assert response.status_code == 422
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", "certificats", 0, "operations", 0, "code"]
    assert error["type"] == "xsd.SCHEMAV_CVC_ENUMERATION_VALID"
    assert "NOT-A-REAL-CODE" in error["msg"]


def test_export_refuses_amounts_that_do_not_add_up_and_stores_nothing(
    db: Session,
) -> None:
    document = _make_validated_document(db)

    response = client.post(
        f"/api/v1/documents/{document.id}/export",
        json=_with_operation(montant_ttc=1200000),
    )

    assert response.status_code == 422
    assert [(e["loc"][-1], e["type"]) for e in response.json()["detail"]] == [
        ("montant_ttc", "arithmetic.ht_plus_tva"),
        ("montant_net_servi", "arithmetic.rs_plus_net"),
    ]
    assert db.query(Export).filter_by(document_id=document.id).count() == 0


def test_export_reports_schema_and_arithmetic_errors_together(db: Session) -> None:
    document = _make_validated_document(db)
    payload = _with_operation(montant_net_servi=1)
    payload["declarant_matricule_fiscal"] = "12"

    response = client.post(f"/api/v1/documents/{document.id}/export", json=payload)

    assert response.status_code == 422
    assert [e["loc"][1:] for e in response.json()["detail"]] == [
        ["declarant_matricule_fiscal"],
        ["certificats", 0, "operations", 0, "montant_net_servi"],
    ]


def test_export_unknown_document_returns_404() -> None:
    response = client.post(
        "/api/v1/documents/00000000-0000-0000-0000-000000000000/export",
        json=VALID_PAYLOAD,
    )
    assert response.status_code == 404


def test_operation_codes_come_from_the_real_schema() -> None:
    response = client.get("/api/v1/export/operation-codes")

    assert response.status_code == 200
    codes = response.json()
    values = [item["code"] for item in codes]
    assert values[0] == "RS1_000001"
    assert codes[0]["description"].startswith("Loyers d’hôtels")
    assert "RS7_000001" in values
    assert len(values) == len(set(values))
    assert all(item["description"] for item in codes)
