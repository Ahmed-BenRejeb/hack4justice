from app.extraction.fields import (
    extract_document_fields,
    normalize_amount,
)

INVOICE_TEXT = """
FACTURE N. 2026-0910
Fournisseur: Atelier Ben Salah, matricule fiscal 1234567A
Client: SARL Nexsol, matricule fiscal 7654321B
Objet: Honoraires de conseil en gestion, regime reel (BNC)
Date de facture: 12/03/2026
Montant HT: 1 000.000 TND
Montant TVA: 190.000 TND
Montant TTC: 1 190.000 TND
Taux de retenue a la source: 1.5%
Montant retenue: 17.850 TND
Montant net servi: 1 172.150 TND
"""


def test_normalize_amount_strips_currency_and_spaces() -> None:
    assert normalize_amount("1 190.000 TND") == "1190.0"


def test_normalize_amount_accepts_a_comma_decimal_separator() -> None:
    assert normalize_amount("1190,500") == "1190.5"


def test_normalize_amount_treats_a_non_trailing_comma_as_a_thousands_separator() -> (
    None
):
    assert normalize_amount("1,190.500") == "1190.5"


def test_normalize_amount_returns_none_for_unparsable_input() -> None:
    assert normalize_amount("aucun montant") is None


def test_normalize_amount_strips_a_percent_sign() -> None:
    # withholding_rate is read as written, "%" included ("1.5%"); the caller
    # (web/lib/tej.ts:formatRate()) needs a bare number.
    assert normalize_amount("1.5%") == "1.5"


def test_extract_document_fields_returns_empty_for_blank_text() -> None:
    assert extract_document_fields("") == {}
    assert extract_document_fields("   ") == {}


def test_extract_document_fields_reads_a_realistic_invoice() -> None:
    fields = extract_document_fields(INVOICE_TEXT)

    assert "supplier_name" in fields
    assert "ben salah" in fields["supplier_name"].value.lower()
    assert fields["supplier_tax_id"].value.upper() == "1234567A"
    assert fields["payment_category"].value.strip().lower().startswith("honoraires")
    assert "reel" in fields["beneficiary_fiscal_regime"].value.lower() or (
        "réel" in fields["beneficiary_fiscal_regime"].value.lower()
    )
    # Amounts survive normalisation to a plain decimal string, usable with Decimal().
    assert float(fields["amount_excl_tax"].value) == 1000.0
    assert float(fields["amount_incl_tax"].value) == 1190.0
    # The rate is numeric too: no leftover "%" (a real end-to-end run once
    # produced "1.5%" here, which broke web/lib/tej.ts:formatRate() downstream).
    assert float(fields["withholding_rate"].value) == 1.5
    for field in fields.values():
        assert field.confidence >= 0.5
