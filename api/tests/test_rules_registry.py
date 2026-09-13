import json
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.rules.engine import _load_logic
from app.rules.load_rules import main as load_rules_main
from app.rules.registry import (
    InvalidRuleDefinition,
    load_rule_file,
    parse_rule_definition,
    upsert_rule,
)

REPOSITORY_RULES_DIR = Path(__file__).resolve().parents[2] / "rules"

VALID_RULE = {
    "code": "TEST-001",
    "citation_source": "Fixture Code, not a real legal text",
    "article_ref": "Art. 0",
    "verbatim_text": "Ceci est un texte de test.",
    "url": "https://example.test/fixture-article-0",
    "logic_ref": "app.rules.fixtures.test_001",
}


def test_every_repository_rule_loads_and_its_logic_resolves() -> None:
    """A rule file that fails here would be rejected or crash at evaluation time."""
    paths = sorted(REPOSITORY_RULES_DIR.glob("*.json"))
    assert paths

    for path in paths:
        definition = load_rule_file(path)
        assert callable(_load_logic(definition.logic_ref)), path.name


def test_parse_rule_definition_accepts_complete_citation() -> None:
    definition = parse_rule_definition(VALID_RULE)
    assert definition.code == "TEST-001"


@pytest.mark.parametrize("missing_field", list(VALID_RULE.keys()))
def test_parse_rule_definition_rejects_missing_field(missing_field: str) -> None:
    incomplete = {**VALID_RULE, missing_field: ""}
    with pytest.raises(InvalidRuleDefinition, match=missing_field):
        parse_rule_definition(incomplete)


def test_load_rule_file_names_the_offending_file(tmp_path: Path) -> None:
    path = tmp_path / "bad.json"
    path.write_text(json.dumps({**VALID_RULE, "url": ""}))

    with pytest.raises(InvalidRuleDefinition, match="bad.json"):
        load_rule_file(path)


def test_upsert_rule_inserts_then_updates_by_code(db: Session) -> None:
    definition = parse_rule_definition(VALID_RULE)
    upsert_rule(db, definition)
    db.commit()

    updated = parse_rule_definition({**VALID_RULE, "verbatim_text": "Texte modifie."})
    upsert_rule(db, updated)
    db.commit()

    from app.db.models import Rule

    rows = db.query(Rule).filter_by(code="TEST-001").all()
    assert len(rows) == 1
    assert rows[0].verbatim_text == "Texte modifie."


def test_load_rules_main_loads_valid_and_skips_invalid(
    tmp_path: Path, db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "valid.json").write_text(json.dumps(VALID_RULE))
    (tmp_path / "invalid.json").write_text(
        json.dumps({**VALID_RULE, "code": "", "verbatim_text": ""})
    )

    load_rules_main(tmp_path)

    from app.db.models import Rule

    assert db.query(Rule).filter_by(code="TEST-001").one_or_none() is not None
    output = capsys.readouterr()
    assert "rejected" in output.err
