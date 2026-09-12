import pytest


def test_missing_database_url_fails_loudly(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    from app.config import load_settings

    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        load_settings()


def test_document_storage_dir_has_documented_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@localhost/db")
    monkeypatch.delenv("DOCUMENT_STORAGE_DIR", raising=False)

    from app.config import DOCUMENT_STORAGE_DIR_DEFAULT, load_settings

    settings = load_settings()
    assert settings.document_storage_dir == DOCUMENT_STORAGE_DIR_DEFAULT
