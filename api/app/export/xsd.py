"""Validates an XML document against an XSD schema.

Schema-agnostic: it knows nothing about the TEJ format specifically. The
DGI's actual TEJ XSD is not in this repository yet (schemas/ is empty); once
it lands, this same function validates against it.
"""

from pathlib import Path

from lxml import etree


class SchemaValidationError(ValueError):
    def __init__(self, errors: list[str]) -> None:
        super().__init__("; ".join(errors))
        self.errors = errors


def validate(xml_bytes: bytes, xsd_path: Path) -> None:
    """Raise SchemaValidationError if xml_bytes does not conform to xsd_path."""
    schema = etree.XMLSchema(etree.parse(str(xsd_path)))
    document = etree.fromstring(xml_bytes)
    if not schema.validate(document):
        raise SchemaValidationError([str(error) for error in schema.error_log])
