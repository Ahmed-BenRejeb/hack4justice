"""Deterministic rule evaluation: facts, a rule's logic, and nothing else,
decide whether a finding exists (root CLAUDE.md design law). A fact may have
been supplied by a model with a confidence score (an assisted fact), but the
decision itself is always this deterministic dispatch, never the model.
"""

import importlib
from dataclasses import asdict, dataclass
from typing import Literal
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Citation, Finding, Rule


@dataclass(frozen=True)
class TraceStep:
    """One fact a rule used, where it came from, and the value the rule read (J1).

    A model-supplied fact carries its confidence and the threshold the rule
    required, so a reader sees why the rule accepted or refused it.
    """

    fact: str
    source: Literal["document", "model"]
    value: str | bool | None
    confidence: float | None = None
    threshold: float | None = None


@dataclass(frozen=True)
class Decision:
    code: str
    trace: tuple[TraceStep, ...] = ()


@dataclass(frozen=True)
class Abstention:
    missing_fact: str
    trace: tuple[TraceStep, ...] = ()


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
    finding.trace = [asdict(step) for step in outcome.trace]

    db.add(finding)
    db.flush()
    db.add(Citation(finding_id=finding.id, rule_id=rule.id))
    db.flush()
    return finding
