"""What happened to filed documents over time, for the dashboards (F1).

Counts only, computed from this database like `measurement.py`: files per
status, files filed per day, files exported with a schema-valid declaration,
and the latest files. Days are counted in Tunisian local time, the time every
screen shows (`web/lib/format.ts`), so a file filed at 00:30 in Tunis counts on
that day, not on the UTC day before.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Query, Session

from app.db.models import Document, Export

ACTIVITY_DAYS = 14
"""How many days, today included, the filings-per-day series covers."""

RECENT_DOCUMENTS = 8
"""How many of the latest files a dashboard lists."""

TIME_ZONE = "Africa/Tunis"


@dataclass(frozen=True)
class DayCount:
    day: date
    count: int


@dataclass(frozen=True)
class RecentDocument:
    id: UUID
    organisation_id: UUID
    organisation_name: str
    filename: str
    status: str
    created_at: datetime


@dataclass(frozen=True)
class Activity:
    """Files by status and by day, exported files, and the latest files."""

    documents_by_status: dict[str, int]
    # Always ACTIVITY_DAYS entries, oldest first, a day without a filing counted as zero.
    documents_by_day: list[DayCount]
    documents_exported: int
    recent_documents: list[RecentDocument]


def activity(
    db: Session, organisation_id: UUID | None = None, today: date | None = None
) -> Activity:
    """Count this database's files by status and by local day, and list the latest.

    Scoped to one organisation when given. `today` defaults to the database's
    current date in Tunisian time; the database, not the host, holds the time
    zone rules, so the result does not depend on the container's tzdata.
    """

    def scoped(query: Query) -> Query:
        if organisation_id is None:
            return query
        return query.filter(Document.organisation_id == organisation_id)

    local_day = func.date(func.timezone(TIME_ZONE, Document.created_at))
    if today is None:
        today = db.scalar(select(func.date(func.timezone(TIME_ZONE, func.now()))))
    first_day = today - timedelta(days=ACTIVITY_DAYS - 1)

    by_status = scoped(db.query(Document.status, func.count())).group_by(
        Document.status
    )
    per_day = dict(
        scoped(db.query(local_day, func.count()))
        .filter(local_day >= first_day, local_day <= today)
        .group_by(local_day)
        .all()
    )
    # A file can be exported more than once; it counts once.
    exported = (
        scoped(
            db.query(func.count(func.distinct(Export.document_id)))
            .select_from(Export)
            .join(Document, Document.id == Export.document_id)
        )
        .filter(Export.xsd_validated.is_(True))
        .scalar()
    )
    recent = (
        scoped(db.query(Document))
        .order_by(Document.created_at.desc())
        .limit(RECENT_DOCUMENTS)
        .all()
    )

    days = [first_day + timedelta(days=offset) for offset in range(ACTIVITY_DAYS)]
    return Activity(
        documents_by_status=dict(by_status.all()),
        documents_by_day=[DayCount(day=day, count=per_day.get(day, 0)) for day in days],
        documents_exported=exported or 0,
        recent_documents=[
            RecentDocument(
                id=document.id,
                organisation_id=document.organisation_id,
                organisation_name=document.organisation.name,
                filename=document.filename,
                status=document.status,
                created_at=document.created_at,
            )
            for document in recent
        ],
    )
