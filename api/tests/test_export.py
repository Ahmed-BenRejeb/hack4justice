from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, OfficerDecision, Organisation
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


def test_export_rejects_an_invalid_withholding_code(db: Session) -> None:
    document = _make_validated_document(db)
    bad_payload = {
        **VALID_PAYLOAD,
        "certificats": [
            {
                **VALID_PAYLOAD["certificats"][0],
                "operations": [
                    {
                        **VALID_PAYLOAD["certificats"][0]["operations"][0],
                        "code": "NOT-A-REAL-CODE",
                    }
                ],
            }
        ],
    }

    response = client.post(f"/api/v1/documents/{document.id}/export", json=bad_payload)

    assert response.status_code == 422


def test_export_unknown_document_returns_404() -> None:
    response = client.post(
        "/api/v1/documents/00000000-0000-0000-0000-000000000000/export",
        json=VALID_PAYLOAD,
    )
    assert response.status_code == 404
