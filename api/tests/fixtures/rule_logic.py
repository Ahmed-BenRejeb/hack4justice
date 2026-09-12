"""Fixture rule logic for testing the evaluation engine. Not a real rule."""

from app.rules.engine import Abstention, Decision, RuleOutcome


def decide_by_status(facts: dict[str, str]) -> RuleOutcome:
    """Decide code TEST-A if status is 'known', else abstain naming the fact."""
    if facts.get("status") == "known":
        return Decision(code="TEST-A")
    return Abstention(missing_fact="status")


def always_wrong_return_type(facts: dict[str, str]) -> str:
    return "not a valid outcome"
