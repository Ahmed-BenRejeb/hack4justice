"""Placement of refused TEJ values on request fields (J7), against the real DGI schema, and the export arithmetic (C3)."""

from dataclasses import replace

import pytest

from app.export.field_errors import arithmetic_field_errors, schema_field_errors
from app.export.tej import build_and_validate
from app.export.xsd import SchemaError, SchemaValidationError
from tests.test_tej import BENEFICIAIRE, CERTIFICAT, DECLARANT, OPERATION


def _refused(**overrides: object) -> list[tuple[tuple, str]]:
    arguments = {
        "declarant": DECLARANT,
        "annee_depot": "2026",
        "mois_depot": "03",
        "certificats": [CERTIFICAT],
        **overrides,
    }
    with pytest.raises(SchemaValidationError) as raised:
        build_and_validate(**arguments)
    return [
        (error.loc, error.type) for error in schema_field_errors(raised.value.errors)
    ]


def test_declaration_fields_are_placed() -> None:
    assert _refused(
        declarant=replace(DECLARANT, matricule_fiscal="12"), mois_depot="13"
    ) == [
        (("declarant_matricule_fiscal",), "xsd.SCHEMAV_CVC_PATTERN_VALID"),
        (("mois_depot",), "xsd.SCHEMAV_CVC_ENUMERATION_VALID"),
    ]


def test_a_later_certificate_is_placed_by_its_index() -> None:
    wrong = replace(
        CERTIFICAT, beneficiaire=replace(BENEFICIAIRE, matricule_fiscal="123A")
    )

    assert _refused(certificats=[CERTIFICAT, wrong]) == [
        (
            ("certificats", 1, "beneficiaire", "matricule_fiscal"),
            "xsd.SCHEMAV_CVC_PATTERN_VALID",
        )
    ]


def test_operation_code_and_a_later_operation_are_placed() -> None:
    certificat = replace(
        CERTIFICAT,
        operations=[
            replace(OPERATION, code="RS99"),
            replace(OPERATION, taux_rs="10.123"),
        ],
    )

    assert _refused(certificats=[certificat]) == [
        (
            ("certificats", 0, "operations", 0, "code"),
            "xsd.SCHEMAV_CVC_ENUMERATION_VALID",
        ),
        (
            ("certificats", 0, "operations", 1, "taux_rs"),
            "xsd.SCHEMAV_CVC_FRACTIONDIGITS_VALID",
        ),
    ]


def test_an_error_naming_no_request_field_keeps_an_empty_loc() -> None:
    [error] = schema_field_errors(
        [
            SchemaError(
                path="/DeclarationsRS/ModifierCertificats", type_name="X", message="m"
            )
        ]
    )

    assert error.loc == ()


def test_arithmetic_accepts_amounts_that_add_up() -> None:
    assert arithmetic_field_errors([CERTIFICAT]) == []


def test_arithmetic_names_the_sum_that_fails() -> None:
    vat_off = replace(OPERATION, montant_tva=100000)
    net_off = replace(OPERATION, montant_net_servi=1)

    errors = arithmetic_field_errors(
        [replace(CERTIFICAT, operations=[vat_off, net_off])]
    )

    assert [(error.loc, error.type) for error in errors] == [
        (("certificats", 0, "operations", 0, "montant_ttc"), "arithmetic.ht_plus_tva"),
        (
            ("certificats", 0, "operations", 1, "montant_net_servi"),
            "arithmetic.rs_plus_net",
        ),
    ]


def test_arithmetic_counts_an_absent_vat_as_zero() -> None:
    no_vat = replace(OPERATION, taux_tva=None, montant_tva=None)
    balanced = replace(no_vat, montant_ttc=1000000, montant_net_servi=985000)

    assert arithmetic_field_errors([replace(CERTIFICAT, operations=[balanced])]) == []
    # HT alone is not TTC once the VAT line is left out.
    assert [
        error.type
        for error in arithmetic_field_errors([replace(CERTIFICAT, operations=[no_vat])])
    ] == ["arithmetic.ht_plus_tva"]
