import io
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from httpx import Response
from sqlalchemy.orm import Session

from app.db.models import CaptureLink, Document, Organisation
from app.main import app
from tests.conftest import AuthHeaders, make_text_image

client = TestClient(app)


def _organisation(db: Session, name: str, tax_id: str) -> Organisation:
    organisation = Organisation(name=name, tax_id=tax_id, kind="msme")
    db.add(organisation)
    db.commit()
    db.refresh(organisation)
    return organisation


def _create_link(headers: dict[str, str], organisation: Organisation) -> Response:
    return client.post(
        "/api/v1/capture/links",
        params={"organisation_id": str(organisation.id)},
        headers=headers,
    )


def _send_photo(token: str) -> Response:
    # No session header: the phone's only permission is the token.
    photo = io.BytesIO(make_text_image("Facture honoraires"))
    return client.post(
        f"/api/v1/capture/{token}/documents",
        files=[("file", ("page-1.png", photo, "image/png"))],
    )


def test_a_phone_files_one_document_for_the_person_who_made_the_link(
    db: Session, auth_headers: AuthHeaders
) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "1234567A")
    headers = auth_headers("msme", organisation)
    link = _create_link(headers, organisation).json()
    assert link["document_id"] is None

    invite = client.get(f"/api/v1/capture/{link['token']}")
    assert invite.status_code == 200
    assert invite.json()["organisation_name"] == "Atelier Ben Salah"

    filed = _send_photo(link["token"])
    assert filed.status_code == 201
    assert filed.json()["status"] == "extracted"

    status = client.get(f"/api/v1/capture/links/{link['id']}", headers=headers)
    document_id = status.json()["document_id"]
    detail = client.get(f"/api/v1/documents/{document_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["uploaded_by"].startswith("msme-")

    # One link files one document.
    assert client.get(f"/api/v1/capture/{link['token']}").status_code == 404
    assert _send_photo(link["token"]).status_code == 404


def test_an_expired_link_files_nothing(db: Session, auth_headers: AuthHeaders) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "1234567A")
    token = _create_link(auth_headers("msme", organisation), organisation).json()[
        "token"
    ]
    db.query(CaptureLink).update(
        {CaptureLink.expires_at: datetime.now(UTC) - timedelta(minutes=1)}
    )
    db.commit()

    assert client.get(f"/api/v1/capture/{token}").status_code == 404
    assert _send_photo(token).status_code == 404
    assert db.query(Document).count() == 0


def test_a_link_is_made_and_read_only_by_a_filer_of_its_organisation(
    db: Session, auth_headers: AuthHeaders
) -> None:
    organisation = _organisation(db, "Atelier Ben Salah", "1234567A")
    other = _organisation(db, "Cabinet Jlassi", "7654321B")
    headers = auth_headers("msme", organisation)

    assert _create_link(auth_headers("officer"), organisation).status_code == 403
    assert _create_link(headers, other).status_code == 404
    link_id = _create_link(headers, organisation).json()["id"]
    colleague = auth_headers("msme", organisation)
    assert (
        client.get(f"/api/v1/capture/links/{link_id}", headers=colleague).status_code
        == 404
    )
    assert client.get("/api/v1/capture/not-a-real-token").status_code == 404
