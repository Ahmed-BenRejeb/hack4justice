"""Masking before provider calls (A1): each identifier kind, stable placeholders, known names, and what stays."""

from app.extraction.masking import (
    mask,
    mask_with_originals,
    unmask,
    unmasked_identifiers,
)


def test_fixed_format_identifiers_are_replaced_by_kind() -> None:
    text = (
        "MF 1234567A/A/M/000, contact: compta@atelier.tn, "
        "IBAN TN59 1000 6035 1835 9847 8831, RIB 08006012345678901234, "
        "tel: 71 234 567, +216 98 765 432, CIN n° 01234567, ref 12345678"
    )

    masked = mask(text)

    assert masked == (
        "MF [MATRICULE_1], contact: [EMAIL_1], "
        "IBAN [IBAN_1], RIB [RIB_1], "
        # International numbers are replaced before labelled ones, so they are numbered first.
        "tel: [TELEPHONE_2], [TELEPHONE_1], CIN n° [CIN_1], ref [NUMERO_1]"
    )
    assert unmasked_identifiers(masked) == []


def test_the_same_value_keeps_its_placeholder_and_a_new_one_counts_up() -> None:
    masked = mask("1234567A paie 7654321B, puis 1234567 A de nouveau.")

    assert masked == "[MATRICULE_1] paie [MATRICULE_2], puis [MATRICULE_1] de nouveau."


def test_known_names_are_replaced_whole_and_case_insensitively() -> None:
    masked = mask(
        "Facture de ATELIER BEN SALAH pour Atelier Ben Salahs et Ben Salah.",
        known_names=["Atelier Ben Salah", "Ben Salah", "SA"],
    )

    # "Salahs" is another word, and a name under 3 characters is never used.
    assert masked == "Facture de [NOM_1] pour Atelier Ben Salahs et [NOM_2]."


def test_amounts_dates_and_invoice_numbers_are_left_readable() -> None:
    text = "FACTURE N. 2026-0342 du 15/03/2026, Montant HT: 1 000.000 TND, taux 1.5%"

    assert mask(text) == text
    assert unmasked_identifiers(text) == []


def test_originals_read_a_model_answer_back_in_memory() -> None:
    masked, originals = mask_with_originals(
        "Atelier Ben Salah, MF 1234567A/A/M/000", known_names=["atelier ben salah"]
    )

    assert masked == "[NOM_1], MF [MATRICULE_1]"
    # Each value as first written in the document, not as the known name was spelled.
    assert originals == {
        "[NOM_1]": "Atelier Ben Salah",
        "[MATRICULE_1]": "1234567A/A/M/000",
    }
    assert (
        unmask("Fournisseur [NOM_1] ([MATRICULE_1]), [EMAIL_9]", originals)
        == "Fournisseur Atelier Ben Salah (1234567A/A/M/000), [EMAIL_9]"
    )


def test_unmasked_identifiers_names_each_kind_left_in_the_text() -> None:
    assert unmasked_identifiers("MF 1234567A, gsm 22 333 444") == [
        "MATRICULE",
        "LABELLED_NUMBER",
    ]
