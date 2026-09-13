"""Validates an XML document against an XSD schema.

Schema-agnostic: it knows nothing about the TEJ format specifically. Each
refusal keeps the offending element's path and lxml's error type, so a caller
can tell which value was refused (app/export/field_errors.py does this for TEJ).
"""

from dataclasses import dataclass
from pathlib import Path

from lxml import etree


@dataclass(frozen=True)
class SchemaError:
    """One refusal: the element's XPath, lxml's error type name, and its message."""

    path: str
    type_name: str
    message: str


class SchemaValidationError(ValueError):
    def __init__(self, errors: list[SchemaError]) -> None:
        super().__init__("; ".join(error.message for error in errors))
        self.errors = errors


def validate(xml_bytes: bytes, xsd_path: Path) -> None:
    """Raise SchemaValidationError if xml_bytes does not conform to xsd_path."""
    schema = etree.XMLSchema(etree.parse(str(xsd_path)))
    document = etree.fromstring(xml_bytes)
    if not schema.validate(document):
        raise SchemaValidationError(
            [
                SchemaError(
                    path=error.path, type_name=error.type_name, message=error.message
                )
                for error in schema.error_log
            ]
        )
