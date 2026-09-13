"""Loads rule definitions from JSON files into the rule registry.

Enforces the root CLAUDE.md rule: a rule without a citation (source, article
reference, verbatim text, url) does not enter the registry. This module
checks completeness only; promoting a citation to `verified` status in
docs/facts.md is a human step this code cannot and does not perform.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.models import Rule

REQUIRED_FIELDS = (
    "code",
    "citation_source",
    "article_ref",
    "verbatim_text",
    "url",
    "logic_ref",
)

# Declared by the rule's author, not required: which of the rule's decided codes
# report a problem found, so the impact panel can count errors intercepted without
# inferring meaning from code names (J9). A rule that declares none counts none.
OPTIONAL_FIELDS = ("error_codes",)


class InvalidRuleDefinition(ValueError):
    pass


@dataclass(frozen=True)
class RuleDefinition:
    code: str
    citation_source: str
    article_ref: str
    verbatim_text: str
    url: str
    logic_ref: str
    error_codes: tuple[str, ...] = ()


def parse_rule_definition(raw: dict) -> RuleDefinition:
    """Validate a raw rule dict has every required citation field, non-empty."""
    missing = [field for field in REQUIRED_FIELDS if not raw.get(field)]
    if missing:
        raise InvalidRuleDefinition(
            f"rule definition rejected, missing or empty field(s): {', '.join(missing)}"
        )

    error_codes = raw.get("error_codes", [])
    if not isinstance(error_codes, list) or not all(
        isinstance(code, str) and code for code in error_codes
    ):
        raise InvalidRuleDefinition(
            "rule definition rejected, error_codes must be a list of non-empty strings"
        )

    return RuleDefinition(
        **{field: raw[field] for field in REQUIRED_FIELDS},
        error_codes=tuple(error_codes),
    )


def load_rule_file(path: Path) -> RuleDefinition:
    """Read and validate one rule definition file."""
    raw = json.loads(path.read_text())
    try:
        return parse_rule_definition(raw)
    except InvalidRuleDefinition as error:
        raise InvalidRuleDefinition(f"{path}: {error}") from error


def upsert_rule(db: Session, definition: RuleDefinition) -> Rule:
    """Insert a rule by code, or update it in place if the code already exists."""
    fields = {field: getattr(definition, field) for field in REQUIRED_FIELDS}
    fields["error_codes"] = list(definition.error_codes)

    existing = db.query(Rule).filter_by(code=definition.code).one_or_none()
    if existing is None:
        rule = Rule(**fields)
        db.add(rule)
    else:
        for field, value in fields.items():
            setattr(existing, field, value)
        rule = existing
    db.flush()
    return rule
