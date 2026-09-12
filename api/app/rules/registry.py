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


def parse_rule_definition(raw: dict) -> RuleDefinition:
    """Validate a raw rule dict has every required citation field, non-empty."""
    missing = [field for field in REQUIRED_FIELDS if not raw.get(field)]
    if missing:
        raise InvalidRuleDefinition(
            f"rule definition rejected, missing or empty field(s): {', '.join(missing)}"
        )
    return RuleDefinition(**{field: raw[field] for field in REQUIRED_FIELDS})


def load_rule_file(path: Path) -> RuleDefinition:
    """Read and validate one rule definition file."""
    raw = json.loads(path.read_text())
    try:
        return parse_rule_definition(raw)
    except InvalidRuleDefinition as error:
        raise InvalidRuleDefinition(f"{path}: {error}") from error


def upsert_rule(db: Session, definition: RuleDefinition) -> Rule:
    """Insert a rule by code, or update it in place if the code already exists."""
    existing = db.query(Rule).filter_by(code=definition.code).one_or_none()
    if existing is None:
        rule = Rule(**definition.__dict__)
        db.add(rule)
    else:
        for field in REQUIRED_FIELDS:
            setattr(existing, field, getattr(definition, field))
        rule = existing
    db.flush()
    return rule
