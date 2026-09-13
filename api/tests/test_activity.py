"""The dashboards' activity counts: by status, by Tunisian day, exports, latest files (F1)."""

from datetime import UTC, date, datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Document, Export, Organisation
from app.impact.activity import ACTIVITY_DAYS, activity
from app.main import app
from tests.conftest import AuthHeaders

client = TestClient(app)

TODAY = date(2026, 9, 13)


def _organisation(db: Session, name: str, tax_id: str) -> Organisation:
    organisation = Organisation(name=name, tax_id=tax_id, kind="msme")
    db.add(organisation)
    db.flush()
    return organisation


def _document(
    db: Session, organisation: Organisation, status: str, created_at: datetime
) -> Document:
    document = Document(
        organisation_id=organisation.id,
        uploaded_by="owner@example.tn",
        filename=f"{status}.pdf",
        storage_ref=f"{status}.pdf",
        status=status,
        created_at=created_at,
    )
    db.add(document)
    db.flush()
    return document


def test_files_are_counted_by_status_and_by_tunisian_day(db: Session) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    _document(db, organisation, "extracted", datetime(2026, 9, 13, 9, 0, tzinfo=UTC))
    # 23:30 UTC on the 12th is 00:30 on the 13th in Tunis (UTC+1).
    _document(db, organisation, "validated", datetime(2026, 9, 12, 23, 30, tzinfo=UTC))
    _document(db, organisation, "flagged", datetime(2026, 9, 1, 12, 0, tzinfo=UTC))
    # Outside the window: counted by status, not by day.
    _document(db, organisation, "extracted", datetime(2026, 8, 1, 12, 0, tzinfo=UTC))
    db.commit()

    result = activity(db, today=TODAY)

    assert result.documents_by_status == {"extracted": 2, "validated": 1, "flagged": 1}
    assert len(result.documents_by_day) == ACTIVITY_DAYS
    assert result.documents_by_day[0].day == date(2026, 8, 31)
    assert result.documents_by_day[-1].day == TODAY
    by_day = {entry.day: entry.count for entry in result.documents_by_day}
    assert by_day[TODAY] == 2
    assert by_day[date(2026, 9, 12)] == 0
    assert by_day[date(2026, 9, 1)] == 1


def test_a_file_exported_twice_counts_once_and_only_when_schema_valid(
    db: Session,
) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "9998887C")
    exported = _document(db, organisation, "validated", datetime.now(UTC))
    refused = _document(db, organisation, "validated", datetime.now(UTC))
    for document, valid in ((exported, True), (exported, True), (refused, False)):
        db.add(Export(document_id=document.id, xml_ref="x.xml", xsd_validated=valid))
    db.commit()

    assert activity(db, today=TODAY).documents_exported == 1


def test_latest_files_come_newest_first_and_stay_in_their_organisation(
    db: Session,
) -> None:
    first = _organisation(db, "Atelier Ben Salah", "9998887C")
    second = _organisation(db, "SARL Nexsol", "1112223D")
    older = _document(db, first, "extracted", datetime(2026, 9, 10, tzinfo=UTC))
    newer = _document(db, first, "flagged", datetime(2026, 9, 11, tzinfo=UTC))
    _document(db, second, "extracted", datetime(2026, 9, 12, tzinfo=UTC))
    db.commit()

    scoped = activity(db, organisation_id=first.id, today=TODAY)

    assert [entry.id for entry in scoped.recent_documents] == [newer.id, older.id]
    assert scoped.recent_documents[0].organisation_name == "Atelier Ben Salah"
    assert sum(scoped.documents_by_status.values()) == 2
    assert sum(activity(db, today=TODAY).documents_by_status.values()) == 3


def test_activity_endpoint_follows_the_impact_gate(
    db: Session, auth_headers: AuthHeaders
) -> None:
    own = _organisation(db, "Atelier Ben Salah", "9998887C")
    other = _organisation(db, "SARL Nexsol", "1112223D")
    _document(db, own, "extracted", datetime.now(UTC))
    db.commit()
    filer = auth_headers("msme", own)

    def status(headers: dict[str, str], **params: str) -> int:
        return client.get(
            "/api/v1/impact/activity", params=params, headers=headers
        ).status_code

    assert status(filer, organisation_id=str(own.id)) == 200
    assert status(filer, organisation_id=str(other.id)) == 403
    assert status(filer) == 403
    assert status(auth_headers("admin")) == 403

    body = client.get("/api/v1/impact/activity", headers=auth_headers("officer")).json()
    assert body["documents_by_status"] == {"extracted": 1}
    assert len(body["documents_by_day"]) == ACTIVITY_DAYS
    assert body["recent_documents"][0]["filename"] == "extracted.pdf"
