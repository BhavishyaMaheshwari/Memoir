"""
Memoir — FastAPI Backend Entry Point

A local-first, privacy-first photo management API.
No cloud. No telemetry. No ads. Your memories stay yours.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import database
from api.routes import photos, search, indexing, people
from models.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — connect DB on startup, close on shutdown."""
    await database.connect()
    print(f"✦ Memoir v{settings.app_version}")
    print(f"  Database: {settings.db_path}")
    print(f"  Thumbnails: {settings.thumbnails_dir}")
    print(f"  Vectors: {settings.lancedb_dir}")
    yield
    await database.close()


app = FastAPI(
    title="Memoir API",
    description="Local-first AI-powered photo management",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.debug else None,
    redoc_url=None,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes under /api prefix
app.include_router(photos.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(indexing.router, prefix="/api")
app.include_router(people.router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db = database.db

    cursor = await db.execute("SELECT COUNT(*) FROM photos")
    total = (await cursor.fetchone())[0]

    cursor = await db.execute(
        "SELECT COUNT(*) FROM photos WHERE embedding_status = 'done'"
    )
    indexed = (await cursor.fetchone())[0]

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        photos_count=total,
        indexed_count=indexed,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
