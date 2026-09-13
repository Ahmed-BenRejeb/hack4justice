"""Deterministic rule evaluation: facts, a rule's logic, and nothing else,
decide whether a finding exists (root CLAUDE.md design law). A fact may have
been supplied by a model with a confidence score (an assisted fact), but the
decision itself is always this deterministic dispatch, never the model.
"""

import importlib
from collections.abc import Mapping
from dataclasses import asdict, dataclass
from typing import Literal
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Citation, Finding, Rule


@dataclass(frozen=True)
class TraceStep:
    """One fact a rule used, where it came from, and the value the rule read (J1).

    A model-supplied fact carries its confidence and the threshold the rule
    required, so a reader sees why the rule accepted or refused it. A fact a
    person confirmed carries who confirmed it and when (J4).
    """

    fact: str
    source: Literal["document", "model", "person"]
    value: str | bool | None
    confidence: float | None = None
    threshold: float | None = None
    confirmed_by: str | None = None
    # ISO date, not a datetime: the trace is stored as JSON on the finding.
    confirmed_at: str | None = None


@dataclass(frozen=True)
class PersonFact:
    """A fact a person confirmed, as a rule's trace reports it (J4)."""

    value: str
    confirmed_by: str
    confirmed_at: str


class Facts(dict[str, str]):
    """Fact values by name, remembering where each fact came from (J1, J4, D-046).

    Rules read it as the plain dict of values it is; `step()` turns one fact
    into its trace step, so a model-supplied fact is always traced with its
    confidence and the threshold extraction applied, a person-confirmed fact
    with who confirmed it, and no rule restates where a fact came from.
    """

    def __init__(
        self,
        values: Mapping[str, str] | None = None,
        model_confidences: Mapping[str, float | None] | None = None,
        threshold: float | None = None,
        person_facts: Mapping[str, PersonFact] | None = None,
    ) -> None:
        super().__init__(values or {})
        # Every fact the model is asked for: its confidence, or None when it was not established.
        self.model_confidences = dict(model_confidences or {})
        self.threshold = threshold
        # Facts a person confirmed; these take precedence over a model answer.
        self.person_facts = dict(person_facts or {})

    def step(self, name: str) -> TraceStep:
        """The trace step for one fact: its value (None when absent) and where it came from."""
        value = self.get(name) or None
        confirmed = self.person_facts.get(name)
        if confirmed is not None:
            return TraceStep(
                fact=name,
                source="person",
                value=value,
                confirmed_by=confirmed.confirmed_by,
                confirmed_at=confirmed.confirmed_at,
            )
        if name in self.model_confidences:
            return TraceStep(
                fact=name,
                source="model",
                value=value,
                confidence=self.model_confidences[name],
                threshold=self.threshold,
            )
        return TraceStep(fact=name, source="document", value=value)


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


def evaluate(db: Session, document_id: UUID, rule: Rule, facts: Facts) -> Finding:
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
