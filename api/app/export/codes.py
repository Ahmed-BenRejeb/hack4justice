"""The withholding operation codes the DGI TEJ schema accepts, with their administrative descriptions.

Read from the real schema (schemas/tej/TEJRSCodesOperations_v1.0.xsd), so the list
offered to an officer is exactly the list an export is validated against.
"""

from dataclasses import dataclass
from functools import cache
from pathlib import Path

from lxml import etree

from app.config import settings

CODES_SCHEMA_PATH = Path(settings.schemas_dir) / "tej" / "TEJRSCodesOperations_v1.0.xsd"
XS = "{http://www.w3.org/2001/XMLSchema}"


@dataclass(frozen=True)
class OperationCode:
    code: str
    description: str


@cache
def operation_codes(schema_path: Path = CODES_SCHEMA_PATH) -> tuple[OperationCode, ...]:
    """Every TypeCodesOperations value, in schema order, with whitespace-normalised descriptions."""
    code_type = etree.parse(str(schema_path)).find(
        f"{XS}simpleType[@name='TypeCodesOperations']"
    )
    return tuple(
        OperationCode(
            code=enumeration.get("value"),
            description=" ".join(
                (
                    enumeration.findtext(f"{XS}annotation/{XS}documentation") or ""
                ).split()
            ),
        )
        for enumeration in code_type.iter(f"{XS}enumeration")
    )
