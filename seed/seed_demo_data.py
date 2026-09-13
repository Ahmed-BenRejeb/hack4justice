"""Seeds the demo dataset through the real pipeline: organisations, the five
hero uploads, one abstention answered, the officer decisions, and one export.

Nothing here inserts a Finding or an Extraction directly. Every document goes
through POST /documents exactly as the web app's upload screen would, so OCR,
masking, the model field extraction, and rule evaluation all run for real
(docs/feature-research.md section 6.6: "seeded, not staged"). This script is a
developer tool, not one of the two configured processes (root CLAUDE.md), so
it reads CHAHED_API_BASE_URL directly rather than through app/config.py or
web/lib/env.ts; unlike those two processes it is safe to default, since a
wrong value here fails every request loudly rather than silently.

Requires: fixtures/hero/ already generated (seed/generate_fixtures.py), and
the API reachable, migrated, with its rule registry loaded (docker compose up,
or `uv run uvicorn app.main:app` after `alembic upgrade head` and
`python -m app.rules.load_rules`). A real OPENROUTER_API_KEY is required: the
model reads each invoice's fiscal fields, exactly as it would for a real
upload.

Run from the repository root:

    api/.venv/bin/python seed/seed_demo_data.py
"""

import os
import sys
from pathlib import Path

import httpx

API_BASE_URL = os.environ.get("CHAHED_API_BASE_URL", "http://localhost:8000/api/v1")
FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures" / "hero"

UPLOADED_BY = "contact@nexsol-consulting.tn"
CONFIRMED_BY = "contact@nexsol-consulting.tn"

ORGANISATIONS = {
    "nexsol": {"name": "Nexsol Consulting SARL", "tax_id": "1122334M"},
    "fedaa": {"name": "Atelier Menuiserie Fedaa", "tax_id": "2233445N"},
}

# Each hero file, which organisation uploads it, and what happens to it once
# the pipeline has run. "answer" resolves an abstention before the officer
# decision; "decision" is the officer's validate/flag action.
DOCUMENTS = [
    {
        "file": "hero-01-honoraires-clean.pdf",
        "org": "nexsol",
        "answer": None,
        "decision": "validated",
        "export": True,
    },
    {
        "file": "hero-02-honoraires-abstain.pdf",
        "org": "nexsol",
        "answer": {"fact_name": "beneficiary_fiscal_regime", "value": "reel"},
        "decision": "validated",
        "export": False,
    },
    {
        "file": "hero-03-honoraires-same-supplier.pdf",
        "org": "nexsol",
        "answer": None,
        "decision": "validated",
        "export": False,
    },
    {
        "file": "hero-04-matricule-invalide.pdf",
        "org": "fedaa",
        "answer": None,
        "decision": "flagged",
        "export": False,
    },
    {
        "file": "hero-05-net-incoherent.pdf",
        "org": "fedaa",
        "answer": None,
        "decision": "flagged",
        "export": False,
    },
]

OFFICER_ID = "officer@dgi.tn"

# The full export for hero-01, in the officer's own words: the officer types
# the beneficiary's contact details and the invoice year themselves (D-008,
# not extracted), while the amounts and the code match what the document
# states and the code proposal decided.
HERO_01_EXPORT = {
    "declarant_matricule_fiscal": "1122334M",
    "declarant_categorie": "PM",
    "annee_depot": "2026",
    "mois_depot": "01",
    "certificats": [
        {
            "beneficiaire": {
                "matricule_fiscal": "5566778A",
                "categorie": "PM",
                "nom_ou_raison_sociale": "Cabinet Fiscal Ben Ammar",
                "adresse": "12 Rue de Marseille, Tunis 1000",
                "email": "contact@cabinet-benammar.tn",
                "telephone": "+21671234567",
            },
            "date_payement": "15/01/2026",
            "reference": "FA-2026-0142",
            "operations": [
                {
                    "code": "RS2_000002",
                    "annee_facturation": "2026",
                    "montant_ht": 1_000_000,
                    "taux_rs": "15.00",
                    "taux_tva": "19.00",
                    "montant_tva": 190_000,
                    "montant_ttc": 1_190_000,
                    "montant_rs": 150_000,
                    "montant_net_servi": 1_040_000,
                }
            ],
        }
    ],
}


def _fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def _get_or_create_organisation(client: httpx.Client, name: str, tax_id: str) -> str:
    response = client.post("/organisations", json={"name": name, "tax_id": tax_id})
    if response.status_code == 201:
        return response.json()["id"]
    if response.status_code == 409:
        existing = client.get("/organisations").raise_for_status().json()
        match = next(org for org in existing if org["tax_id"] == tax_id)
        return match["id"]
    response.raise_for_status()
    raise AssertionError("unreachable")


def _upload(client: httpx.Client, path: Path, organisation_id: str) -> dict:
    with path.open("rb") as handle:
        response = client.post(
            "/documents",
            params={"organisation_id": organisation_id, "uploaded_by": UPLOADED_BY},
            files={"file": (path.name, handle, "application/pdf")},
        )
    response.raise_for_status()
    return response.json()


def _findings(client: httpx.Client, document_id: str) -> list[dict]:
    response = client.get(f"/documents/{document_id}/findings")
    response.raise_for_status()
    return response.json()


def _summarise(findings: list[dict]) -> str:
    parts = []
    for finding in findings:
        if finding["status"] == "abstained":
            parts.append(f"abstains ({finding['missing_fact']})")
        else:
            parts.append(finding["decided_code"])
    return ", ".join(parts) if parts else "no findings"


def main() -> None:
    if not FIXTURES_DIR.exists():
        _fail(
            f"{FIXTURES_DIR} does not exist; run seed/generate_fixtures.py first"
        )

    with httpx.Client(base_url=API_BASE_URL, timeout=60.0) as client:
        organisation_ids = {
            key: _get_or_create_organisation(client, **fields)
            for key, fields in ORGANISATIONS.items()
        }
        print(f"organisations: {organisation_ids}")

        for entry in DOCUMENTS:
            path = FIXTURES_DIR / entry["file"]
            if not path.exists():
                _fail(f"missing fixture: {path}")

            document = _upload(client, path, organisation_ids[entry["org"]])
            document_id = document["id"]
            print(f"{entry['file']}: uploaded as {document_id}")

            findings = _findings(client, document_id)
            print(f"  before answer: {_summarise(findings)}")

            if entry["answer"] is not None:
                answerable = client.get(
                    f"/documents/{document_id}/answerable-facts"
                ).raise_for_status().json()
                if answerable["supplier_tax_id"] is None:
                    _fail(f"{entry['file']}: supplier not identified, cannot answer")
                response = client.post(
                    f"/documents/{document_id}/supplier-facts",
                    json={**entry["answer"], "confirmed_by": CONFIRMED_BY},
                )
                response.raise_for_status()
                findings = _findings(client, document_id)
                print(f"  after answer: {_summarise(findings)}")

            decision = client.post(
                "/officer/decisions",
                json={
                    "document_id": document_id,
                    "officer_id": OFFICER_ID,
                    "action": entry["decision"],
                },
            )
            decision.raise_for_status()
            print(f"  officer decision: {entry['decision']}")

            if entry["export"]:
                export = client.post(
                    f"/documents/{document_id}/export", json=HERO_01_EXPORT
                )
                if export.status_code != 201:
                    _fail(f"{entry['file']}: export failed: {export.text}")
                print(f"  exported: {export.json()['xml_ref']}")

        impact = client.get("/impact").raise_for_status().json()
        print(f"impact: {impact}")


if __name__ == "__main__":
    main()
