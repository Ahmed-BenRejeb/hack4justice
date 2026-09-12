from pathlib import Path

import pytest

from app.export.xsd import SchemaValidationError, validate

FIXTURE_XSD = """<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="declaration">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="amount" type="xs:decimal"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
"""


@pytest.fixture
def xsd_path(tmp_path: Path) -> Path:
    path = tmp_path / "fixture.xsd"
    path.write_text(FIXTURE_XSD)
    return path


def test_validate_accepts_conforming_xml(xsd_path: Path) -> None:
    xml = b"<declaration><amount>150.000</amount></declaration>"
    validate(xml, xsd_path)  # does not raise


def test_validate_rejects_wrong_element(xsd_path: Path) -> None:
    xml = b"<declaration><wrong_field>150.000</wrong_field></declaration>"
    with pytest.raises(SchemaValidationError):
        validate(xml, xsd_path)


def test_validate_rejects_wrong_type(xsd_path: Path) -> None:
    xml = b"<declaration><amount>not-a-number</amount></declaration>"
    with pytest.raises(SchemaValidationError):
        validate(xml, xsd_path)
