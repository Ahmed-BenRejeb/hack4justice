"""CLI entry point: load every rule definition from a directory into the registry.

Usage: uv run python -m app.rules.load_rules [directory]
Defaults to the repository's root `rules/` directory.
"""

import sys
from pathlib import Path

from app.config import settings
from app.db.session import SessionLocal
from app.rules.registry import InvalidRuleDefinition, load_rule_file, upsert_rule

DEFAULT_RULES_DIR = Path(settings.rules_dir)


def main(rules_dir: Path = DEFAULT_RULES_DIR) -> int:
    definition_files = sorted(rules_dir.glob("*.json")) if rules_dir.is_dir() else []
    if not definition_files:
        print(f"no rule definitions found in {rules_dir}")
        return 0

    loaded = 0
    with SessionLocal() as db:
        for path in definition_files:
            try:
                definition = load_rule_file(path)
            except InvalidRuleDefinition as error:
                print(f"rejected: {error}", file=sys.stderr)
                continue
            upsert_rule(db, definition)
            loaded += 1
            print(f"loaded: {definition.code} ({path.name})")
        db.commit()

    print(f"{loaded}/{len(definition_files)} rule definitions loaded")
    return 0


if __name__ == "__main__":
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_RULES_DIR
    raise SystemExit(main(directory))
