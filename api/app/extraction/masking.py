"""Replaces identifiers with typed placeholders before any text reaches a model (A1, D-013).

Deterministic, no model and no dependency: fixed-format identifiers are found by
pattern (e-mail, IBAN, RIB, matricule fiscal, telephone, CIN, bare 8-digit
numbers) and names by exact match against the names the system already holds.
The same value always gets the same placeholder, so the model can still tell
two parties apart. Each placeholder's original value is kept in memory only, so
a model's answer naming a placeholder can be read back locally (`unmask`); it is
never stored or sent (D-046).

Known ceiling (D-042): a person or company name the system does not hold, a street
address, and an 8-digit phone number written in groups without a label match no
pattern and stay in the text.
"""

import re
from collections.abc import Iterable, Mapping

_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# Tunisian IBAN: TN, 2 check digits, then the 20-digit RIB.
_IBAN = re.compile(r"\bTN\d{2}(?:\s?\d){20}\b")
_RIB = re.compile(r"\b\d(?:\s?\d){19}\b")
# 7 digits and a control letter (the TEJ schema's pattern), optionally followed by
# the VAT code, category and establishment number, as in 1234567A/A/M/000.
_MATRICULE = re.compile(
    r"\b\d{7}\s?[A-Za-z](?:\s?/?\s?[A-Za-z]\s?/?\s?[A-Za-z]\s?/?\s?\d{3})?\b"
)
_TELEPHONE_INTERNATIONAL = re.compile(
    r"(?:\+|00)216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b"
)
# A label decides what an 8-digit number is: a telephone or a national identity card.
_LABELLED_NUMBER = re.compile(
    r"(?i)\b(t[ée]l(?:[ée]phone)?|gsm|mobile|fax|c\.?\s?i\.?\s?n\.?)"
    r"(\s*(?:n°|no\.?|:|\.)?\s*)"
    r"(\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b"
)
_BARE_EIGHT_DIGITS = re.compile(r"\b\d{8}\b")

# Order matters: an IBAN contains a RIB, and a RIB contains 8-digit runs.
_FIXED_FORMATS = (
    ("EMAIL", _EMAIL),
    ("IBAN", _IBAN),
    ("RIB", _RIB),
    ("MATRICULE", _MATRICULE),
    ("TELEPHONE", _TELEPHONE_INTERNATIONAL),
)
MIN_NAME_CHARS = 3
_PLACEHOLDER = re.compile(r"\[[A-Z]+_\d+\]")


def _normalise(value: str) -> str:
    return re.sub(r"[\s./-]", "", value).upper()


def mask(text: str, known_names: Iterable[str] = ()) -> str:
    """The text with each identifier and known name replaced by a placeholder such as [MATRICULE_1]."""
    return mask_with_originals(text, known_names)[0]


def unmask(text: str, originals: Mapping[str, str]) -> str:
    """The text with each placeholder `originals` knows replaced by its value; any other stays as written."""
    return _PLACEHOLDER.sub(
        lambda match: originals.get(match.group(), match.group()), text
    )


def mask_with_originals(
    text: str, known_names: Iterable[str] = ()
) -> tuple[str, dict[str, str]]:
    """The masked text, and each placeholder's value as first written in the text.

    The originals are for the caller to read a model's answer back in memory;
    they are never stored or sent (D-046).
    """
    placeholders: dict[tuple[str, str], str] = {}
    originals: dict[str, str] = {}

    def placeholder(kind: str, value: str) -> str:
        key = (kind, _normalise(value))
        if key not in placeholders:
            number = sum(1 for existing, _ in placeholders if existing == kind) + 1
            placeholders[key] = f"[{kind}_{number}]"
            originals[placeholders[key]] = value
        return placeholders[key]

    for kind, pattern in _FIXED_FORMATS:
        text = pattern.sub(
            lambda match, kind=kind: placeholder(kind, match.group()), text
        )
    text = _LABELLED_NUMBER.sub(
        lambda match: (
            match.group(1)
            + match.group(2)
            + placeholder(
                "CIN" if match.group(1).lower().startswith("c") else "TELEPHONE",
                match.group(3),
            )
        ),
        text,
    )
    text = _BARE_EIGHT_DIGITS.sub(
        lambda match: placeholder("NUMERO", match.group()), text
    )

    # Longest first, so "Atelier Ben Salah" is replaced before a shorter name inside it.
    names = {
        name.strip() for name in known_names if len(name.strip()) >= MIN_NAME_CHARS
    }
    for name in sorted(names, key=len, reverse=True):
        text = re.sub(
            rf"(?<!\w){re.escape(name)}(?!\w)",
            lambda match: placeholder("NOM", match.group()),
            text,
            flags=re.IGNORECASE,
        )
    return text, originals


def unmasked_identifiers(text: str) -> list[str]:
    """Kinds of fixed-format identifier still present in the text, for a last check at the provider boundary."""
    kinds = [kind for kind, pattern in _FIXED_FORMATS if pattern.search(text)]
    if _LABELLED_NUMBER.search(text):
        kinds.append("LABELLED_NUMBER")
    if _BARE_EIGHT_DIGITS.search(text):
        kinds.append("NUMERO")
    return kinds
