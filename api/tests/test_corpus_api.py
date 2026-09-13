import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.corpus.chunking import Page
from app.corpus.retrieval import MATCH_END, MATCH_START
from app.corpus.service import index_source
from app.db.models import CorpusChunk, Document, Finding, Organisation, Rule
from app.main import app
from tests.conftest import AuthHeaders
from tests.fixtures.corpus import TEST_CHECKER, make_source, verify

client = TestClient(app)


@pytest.fixture(autouse=True)
def _signed_in_as_msme(auth_headers: AuthHeaders) -> None:
    """Verified legal text is readable by every role; an MSME user shows it is not officer-only."""
    client.headers.update(auth_headers("msme"))


SOURCE_TEXT = (
    "ARTICLE 1 :\n"
    "I. Les honoraires servis aux personnes morales font l'objet d'une retenue.\n"
    "II. Les loyers d'hôtels servis aux personnes physiques font l'objet d'une retenue.\n"
    "III. Texte non verifie sur les honoraires, les hôtels et les loyers.\n"
)
UNVERIFIED_TEXT = "Texte non verifie"


def index_and_verify(db: Session, refs: tuple[str, ...] = ("I", "II")) -> dict:
    """Index the fixture article on page 7 and verify the given paragraphs."""
    index_source(db, make_source(), [Page(7, SOURCE_TEXT)])
    chunks = {c.paragraph_ref: c for c in db.query(CorpusChunk)}
    verify(db, [chunks[ref] for ref in refs])
    db.commit()
    return chunks


def test_search_returns_only_verified_passages_with_marked_excerpts(
    db: Session,
) -> None:
    index_and_verify(db)

    response = client.get("/api/v1/corpus/search", params={"q": "hotels"})

    assert response.status_code == 200
    body = response.json()
    assert [hit["paragraph_ref"] for hit in body] == ["II"]
    assert f"{MATCH_START}hôtels{MATCH_END}" in body[0]["excerpt"]
    assert body[0]["match"] in ("texte", "les deux")
    assert body[0]["verified_by"] == TEST_CHECKER
    assert body[0]["official_url"] == "https://example.test/code.pdf#page=7"
    assert UNVERIFIED_TEXT not in response.text


def test_search_without_a_verified_match_returns_an_empty_list(db: Session) -> None:
    index_and_verify(db)

    response = client.get("/api/v1/corpus/search", params={"q": "zzzz qwerty"})

    assert response.json() == []


def test_passage_comes_with_verified_neighbours_outline_and_source(
    db: Session,
) -> None:
    chunks = index_and_verify(db)

    first = client.get(f"/api/v1/corpus/chunks/{chunks['I'].id}").json()
    second = client.get(f"/api/v1/corpus/chunks/{chunks['II'].id}").json()

    assert first["passage"]["text"].startswith("I. Les honoraires")
    assert first["previous"] is None
    assert first["next"]["paragraph_ref"] == "II"
    assert [entry["paragraph_ref"] for entry in first["outline"]] == ["I", "II"]
    assert first["source"]["sha256"] == make_source().sha256
    assert second["next"] is None  # paragraph III exists but is not verified
    assert UNVERIFIED_TEXT not in str(first) + str(second)


def test_an_unverified_chunk_answers_404_like_a_missing_one(db: Session) -> None:
    chunks = index_and_verify(db)

    unverified = client.get(f"/api/v1/corpus/chunks/{chunks['III'].id}")
    missing = client.get(f"/api/v1/corpus/chunks/{uuid.uuid4()}")

    assert unverified.status_code == missing.status_code == 404
    assert unverified.json() == missing.json()


def test_sources_count_passages_and_name_the_rules_citing_them(db: Session) -> None:
    index_and_verify(db)
    db.add(
        Rule(
            code="TEST-001",
            citation_source="Code fictif",
            article_ref="Article 1, I",
            verbatim_text="I. Les honoraires servis aux personnes morales font l'objet d'une retenue.",
            url=make_source().url,
            logic_ref="app.rules.fixtures.test_001",
        )
    )
    db.commit()

    (source,) = client.get("/api/v1/corpus/sources").json()

    assert source["verified_passages"] == 2
    assert source["total_passages"] == 3
    assert source["citing_rules"] == ["TEST-001"]


def test_verification_queue_names_unverified_chunks_by_reference_only(
    db: Session, auth_headers: AuthHeaders
) -> None:
    chunks = index_and_verify(db)

    response = client.get(
        "/api/v1/corpus/verification-queue", headers=auth_headers("admin")
    )

    assert response.json() == [
        {
            "id": str(chunks["III"].id),
            "source_id": "fixture-code",
            "article_ref": "Article 1",
            "paragraph_ref": "III",
            "page": 7,
            "official_url": "https://example.test/code.pdf#page=7",
        }
    ]
    assert UNVERIFIED_TEXT not in response.text


def test_related_passages_leave_out_the_citation_and_unverified_text(
    db: Session,
) -> None:
    index_and_verify(db)
    organisation = Organisation(
        name="Entreprise de test", tax_id="0000000A", kind="msme"
    )
    db.add(organisation)
    db.flush()
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="test",
        filename="facture.pdf",
        storage_ref="facture.pdf",
        status="extracted",
    )
    rule = Rule(
        code="TEST-001",
        citation_source="Code fictif",
        article_ref="Article 1, I",
        verbatim_text="I. Les honoraires servis aux personnes morales font l'objet d'une retenue.",
        url=make_source().url,
        logic_ref="app.rules.fixtures.test_001",
    )
    db.add_all([document, rule])
    db.flush()
    finding = Finding(
        document_id=document.id,
        rule_id=rule.id,
        status="abstained",
        missing_fact="régime fiscal du fournisseur",
    )
    db.add(finding)
    db.commit()

    response = client.get(f"/api/v1/findings/{finding.id}/related")

    assert [hit["paragraph_ref"] for hit in response.json()] == ["II"]
    assert UNVERIFIED_TEXT not in response.text
    assert client.get(f"/api/v1/findings/{uuid.uuid4()}/related").status_code == 404
