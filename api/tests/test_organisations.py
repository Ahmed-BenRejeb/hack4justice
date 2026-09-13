from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_then_list_organisation() -> None:
    created = client.post(
        "/api/v1/organisations",
        json={"name": "  Atelier Ben Salah ", "tax_id": "1234567A"},
    )

    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Atelier Ben Salah"
    assert body["kind"] == "msme"

    listed = client.get("/api/v1/organisations")
    assert listed.status_code == 200
    assert [organisation["id"] for organisation in listed.json()] == [body["id"]]


def test_list_organisations_is_alphabetical() -> None:
    client.post("/api/v1/organisations", json={"name": "Zitouna", "tax_id": "2222222B"})
    client.post("/api/v1/organisations", json={"name": "Atlas", "tax_id": "1111111A"})

    names = [item["name"] for item in client.get("/api/v1/organisations").json()]

    assert names == ["Atlas", "Zitouna"]


def test_create_organisation_duplicate_tax_id_returns_409() -> None:
    payload = {"name": "Atelier Ben Salah", "tax_id": "1234567A"}
    assert client.post("/api/v1/organisations", json=payload).status_code == 201

    second = client.post(
        "/api/v1/organisations", json={**payload, "name": "Another name"}
    )

    assert second.status_code == 409


def test_create_organisation_rejects_blank_fields() -> None:
    response = client.post("/api/v1/organisations", json={"name": "   ", "tax_id": ""})

    assert response.status_code == 422
