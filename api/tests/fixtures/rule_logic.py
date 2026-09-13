"""Fixture rule logic for testing the evaluation engine. Not a real rule."""

from app.rules.engine import Abstention, Decision, RuleOutcome, TraceStep


def decide_by_status(facts: dict[str, str]) -> RuleOutcome:
    """Decide code TEST-A if status is 'known', else abstain naming the fact."""
    trace = (TraceStep(fact="status", source="document", value=facts.get("status")),)
    if facts.get("status") == "known":
        return Decision(code="TEST-A", trace=trace)
    return Abstention(missing_fact="status", trace=trace)


def always_wrong_return_type(facts: dict[str, str]) -> str:
    return "not a valid outcome"


def decide_if_mentions_article_62(facts: dict[str, str]) -> RuleOutcome:
    """Decide TEST-B if the extracted full text mentions "article 62"."""
    if "article 62" in facts.get("full_text", "").lower():
        return Decision(code="TEST-B")
    return Abstention(missing_fact="full_text")
