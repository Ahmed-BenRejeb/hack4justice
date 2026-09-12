"""Deterministic rule evaluation: facts, a rule's logic, and nothing else,
decide whether a finding exists (root CLAUDE.md design law). A fact may have
been supplied by a model with a confidence score (an assisted fact), but the
decision itself is always this deterministic dispatch, never the model.
"""

import importlib
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Citation, Finding, Rule


@dataclass(frozen=True)
class Decision:
    code: str


@dataclass(frozen=True)
class Abstention:
    missing_fact: str


RuleOutcome = Decision | Abstention


def _load_logic(logic_ref: str):
    module_path, function_name = logic_ref.rsplit(".", 1)
    module = importlib.import_module(module_path)
    return getattr(module, function_name)


def evaluate(
    db: Session, document_id: UUID, rule: Rule, facts: dict[str, str]
) -> Finding:
    """Run rule.logic_ref against facts and record the resulting finding."""
    logic = _load_logic(rule.logic_ref)
    outcome = logic(facts)

    if isinstance(outcome, Decision):
        finding = Finding(
            document_id=document_id,
            rule_id=rule.id,
            status="decided",
            decided_code=outcome.code,
        )
    elif isinstance(outcome, Abstention):
        finding = Finding(
            document_id=document_id,
            rule_id=rule.id,
            status="abstained",
            missing_fact=outcome.missing_fact,
        )
    else:
        raise TypeError(
            f"rule logic {rule.logic_ref} returned {type(outcome)!r}, "
            "expected Decision or Abstention"
        )

    db.add(finding)
    db.flush()
    db.add(Citation(finding_id=finding.id, rule_id=rule.id))
    db.flush()
    return finding
