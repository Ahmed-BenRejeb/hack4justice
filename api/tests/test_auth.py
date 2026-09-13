"""Sign-up, sign-in, sessions, and the role and organisation gates (A3)."""

import io
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth.create_user import main as create_user_command
from app.auth.passwords import verify_password
from app.auth.service import AccountError, create_user
from app.db.models import Document, Organisation, UserSession
from app.main import app
from tests.conftest import TEST_PASSWORD, TEST_PASSWORD_HASH, AuthHeaders

client = TestClient(app)

SIGNUP = {
    "email": " Owner@Atelier.tn ",
    "password": "a long enough password",
    "organisation": {"name": "Atelier Ben Salah", "tax_id": "1234567A"},
}


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _two_organisations(db: Session) -> tuple[Organisation, Organisation]:
    own = Organisation(name="Atelier Ben Salah", tax_id="1234567A", kind="msme")
    other = Organisation(name="Menuiserie Fedaa", tax_id="7654321B", kind="msme")
    db.add_all([own, other])
    db.commit()
    return own, other


def test_password_verifies_only_itself() -> None:
    assert verify_password(TEST_PASSWORD, TEST_PASSWORD_HASH)
    assert not verify_password(TEST_PASSWORD.upper(), TEST_PASSWORD_HASH)


def test_signup_creates_an_msme_user_and_signs_them_in() -> None:
    response = client.post("/api/v1/auth/signup", json=SIGNUP)

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "owner@atelier.tn"
    assert body["user"]["role"] == "msme"
    assert [o["tax_id"] for o in body["user"]["organisations"]] == ["1234567A"]
    me = client.get("/api/v1/auth/me", headers=_bearer(body["token"]))
    assert me.status_code == 200
    assert me.json() == body["user"]


def test_signup_refuses_a_taken_email_or_tax_id() -> None:
    assert client.post("/api/v1/auth/signup", json=SIGNUP).status_code == 201

    same_email = {**SIGNUP, "organisation": {"name": "Autre", "tax_id": "7654321B"}}
    same_tax_id = {**SIGNUP, "email": "other@atelier.tn"}

    assert client.post("/api/v1/auth/signup", json=same_email).status_code == 409
    assert client.post("/api/v1/auth/signup", json=same_tax_id).status_code == 409


def test_signup_refuses_a_short_password() -> None:
    response = client.post("/api/v1/auth/signup", json={**SIGNUP, "password": "short"})

    assert response.status_code == 422


def test_logout_ends_the_session() -> None:
    client.post("/api/v1/auth/signup", json=SIGNUP)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "OWNER@atelier.tn", "password": SIGNUP["password"]},
    )
    assert login.status_code == 200
    headers = _bearer(login.json()["token"])

    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_login_answers_a_wrong_password_and_an_unknown_email_alike() -> None:
    client.post("/api/v1/auth/signup", json=SIGNUP)

    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@atelier.tn", "password": "not the password"},
    )
    unknown_email = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@atelier.tn", "password": SIGNUP["password"]},
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_an_expired_session_is_refused(db: Session, auth_headers: AuthHeaders) -> None:
    headers = auth_headers("officer")
    db.query(UserSession).update(
        {"expires_at": datetime.now(UTC) - timedelta(minutes=1)}
    )
    db.commit()

    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_routes_refuse_a_request_without_a_session() -> None:
    assert client.get("/api/v1/officer/queue").status_code == 401
    assert client.get("/api/v1/corpus/sources").status_code == 401
    assert (
        client.get("/api/v1/auth/me", headers=_bearer("not-a-token")).status_code == 401
    )


@pytest.mark.parametrize(
    ("role", "path"),
    [
        ("msme", "/api/v1/officer/queue"),
        ("accountant", "/api/v1/export/operation-codes"),
        ("admin", "/api/v1/impact"),
        ("officer", "/api/v1/rules"),
        ("officer", "/api/v1/corpus/verification-queue"),
    ],
)
def test_a_role_outside_a_route_is_forbidden(
    auth_headers: AuthHeaders, role: str, path: str
) -> None:
    assert client.get(path, headers=auth_headers(role)).status_code == 403


def test_a_document_is_read_by_its_filers_and_officers_only(
    db: Session, auth_headers: AuthHeaders
) -> None:
    own, other = _two_organisations(db)
    document = Document(
        organisation_id=other.id,
        uploaded_by="contact@fedaa.tn",
        filename="facture.pdf",
        storage_ref="facture.pdf",
        status="extracted",
    )
    db.add(document)
    db.commit()
    path = f"/api/v1/documents/{document.id}"

    assert client.get(path, headers=auth_headers("msme", own)).status_code == 404
    assert client.get(path, headers=auth_headers("admin")).status_code == 404
    assert (
        client.get(path, headers=auth_headers("accountant", own, other)).status_code
        == 200
    )
    assert client.get(path, headers=auth_headers("officer")).status_code == 200


def test_a_filer_cannot_upload_for_another_organisation(
    db: Session, auth_headers: AuthHeaders
) -> None:
    own, other = _two_organisations(db)

    response = client.post(
        "/api/v1/documents",
        params={"organisation_id": str(other.id)},
        files={"file": ("facture.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
        headers=auth_headers("msme", own),
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    ("role", "organisation_count"),
    [("msme", 0), ("msme", 2), ("accountant", 0), ("officer", 1), ("admin", 1)],
)
def test_create_user_enforces_the_organisations_each_role_holds(
    db: Session, role: str, organisation_count: int
) -> None:
    organisations = [
        Organisation(name=f"Organisation {i}", tax_id=f"{i}000000A", kind="msme")
        for i in range(organisation_count)
    ]

    with pytest.raises(AccountError):
        create_user(
            db,
            email="someone@example.tn",
            password=TEST_PASSWORD,
            role=role,
            organisations=organisations,
        )


def test_create_user_command_grants_an_accountant_their_organisations(
    db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    _two_organisations(db)
    monkeypatch.setattr("sys.stdin", io.StringIO(f"{TEST_PASSWORD}\n"))

    exit_code = create_user_command(
        [
            "cabinet@example.tn",
            "accountant",
            "--organisation",
            "1234567A",
            "--organisation",
            "7654321B",
        ]
    )

    assert exit_code == 0
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "cabinet@example.tn", "password": TEST_PASSWORD},
    )
    assert login.json()["user"]["role"] == "accountant"
    assert [o["tax_id"] for o in login.json()["user"]["organisations"]] == [
        "1234567A",
        "7654321B",
    ]
