"""FastAPI app factory and router registration."""

from fastapi import FastAPI

from app.api.v1.documents import router as documents_router
from app.api.v1.export import router as export_router
from app.api.v1.officer import router as officer_router
from app.api.v1.rules import router as rules_router


def create_app() -> FastAPI:
    app = FastAPI(title="Chahed API")

    @app.get("/api/v1/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(rules_router, prefix="/api/v1")
    app.include_router(officer_router, prefix="/api/v1")
    app.include_router(export_router, prefix="/api/v1")
    return app


app = create_app()
