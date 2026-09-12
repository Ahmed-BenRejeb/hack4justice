import pytest

from app.export.tej import (
    Beneficiaire,
    Certificat,
    Declarant,
    Operation,
    build_and_validate,
    build_declaration,
)
from app.export.xsd import SchemaValidationError

DECLARANT = Declarant(matricule_fiscal="1234567A", categorie="PM")

BENEFICIAIRE = Beneficiaire(
    matricule_fiscal="7654321B",
    categorie="PP",
    nom_ou_raison_sociale="Prestataire Test",
    adresse="Rue de Test, Tunis",
    email="contact@example.tn",
    telephone="+21611222333",
)

OPERATION = Operation(
    code="RS7_000001",
    annee_facturation="2026",
    montant_ht=1000000,
    taux_rs="1.50",
    montant_ttc=1190000,
    montant_rs=15000,
    montant_net_servi=1175000,
)

CERTIFICAT = Certificat(
    beneficiaire=BENEFICIAIRE,
    date_payement="15/03/2026",
    reference="CERT-001",
    operations=[OPERATION],
)


def test_build_and_validate_produces_schema_valid_xml() -> None:
    xml_bytes = build_and_validate(
        declarant=DECLARANT,
        annee_depot="2026",
        mois_depot="03",
        certificats=[CERTIFICAT],
    )

    assert b"RS7_000001" in xml_bytes
    assert b"1234567A" in xml_bytes


def test_build_and_validate_rejects_an_invalid_withholding_code() -> None:
    bad_operation = Operation(**{**OPERATION.__dict__, "code": "NOT-A-REAL-CODE"})
    bad_certificat = Certificat(
        beneficiaire=BENEFICIAIRE,
        date_payement="15/03/2026",
        reference="CERT-002",
        operations=[bad_operation],
    )

    with pytest.raises(SchemaValidationError):
        build_and_validate(
            declarant=DECLARANT,
            annee_depot="2026",
            mois_depot="03",
            certificats=[bad_certificat],
        )


def test_build_and_validate_rejects_a_malformed_matricule_fiscal() -> None:
    bad_declarant = Declarant(matricule_fiscal="not-a-matricule", categorie="PM")

    with pytest.raises(SchemaValidationError):
        build_and_validate(
            declarant=bad_declarant,
            annee_depot="2026",
            mois_depot="03",
            certificats=[CERTIFICAT],
        )


def test_build_declaration_without_validation_still_produces_parseable_xml() -> None:
    from lxml import etree

    xml_bytes = build_declaration(
        declarant=DECLARANT,
        annee_depot="2026",
        mois_depot="03",
        certificats=[CERTIFICAT],
    )

    parsed = etree.fromstring(xml_bytes)
    assert parsed.tag == "DeclarationsRS"
    assert parsed.get("VersionSchema") == "1.0"
