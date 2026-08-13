"""
Memoir — SQLite Database Layer
Handles schema creation, migrations, and connection management.
"""

import aiosqlite
from pathlib import Path
from core.config import settings


SCHEMA_SQL = """
-- Core photo metadata
CREATE TABLE IF NOT EXISTS photos (
    id              TEXT PRIMARY KEY,
    file_path       TEXT NOT NULL UNIQUE,
    file_name       TEXT NOT NULL,
    file_size       INTEGER,
    file_hash       TEXT,
    mime_type       TEXT,
    width           INTEGER,
    height          INTEGER,
    created_at      TIMESTAMP,
    modified_at     TIMESTAMP,
    indexed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thumbnail_path  TEXT,
    -- EXIF fields
    camera_make     TEXT,
    camera_model    TEXT,
    focal_length    REAL,
    aperture        REAL,
    iso             INTEGER,
    exposure_time   TEXT,
    gps_lat         REAL,
    gps_lng         REAL,
    -- AI fields
    ocr_text        TEXT,
    is_screenshot   BOOLEAN DEFAULT FALSE,
    embedding_status TEXT DEFAULT 'pending',
    face_status     TEXT DEFAULT 'pending',
    ocr_status      TEXT DEFAULT 'pending'
);

-- Face detections
CREATE TABLE IF NOT EXISTS faces (
    id          TEXT PRIMARY KEY,
    photo_id    TEXT REFERENCES photos(id) ON DELETE CASCADE,
    person_id   TEXT REFERENCES people(id),
    bbox_x      REAL,
    bbox_y      REAL,
    bbox_w      REAL,
    bbox_h      REAL,
    confidence  REAL,
    thumbnail   TEXT
);

-- People (clustered faces)
CREATE TABLE IF NOT EXISTS people (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    photo_count INTEGER DEFAULT 0,
    cover_face  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips (time+location clusters)
CREATE TABLE IF NOT EXISTS trips (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    start_date  TIMESTAMP,
    end_date    TIMESTAMP,
    location    TEXT,
    photo_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trip_photos (
    trip_id  TEXT REFERENCES trips(id) ON DELETE CASCADE,
    photo_id TEXT REFERENCES photos(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, photo_id)
);

-- Watched folders
CREATE TABLE IF NOT EXISTS watched_folders (
    id         TEXT PRIMARY KEY,
    path       TEXT NOT NULL UNIQUE,
    added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_scan  TIMESTAMP
);

-- Indexing jobs
CREATE TABLE IF NOT EXISTS indexing_jobs (
    id          TEXT PRIMARY KEY,
    status      TEXT DEFAULT 'pending',
    total       INTEGER DEFAULT 0,
    processed   INTEGER DEFAULT 0,
    started_at  TIMESTAMP,
    finished_at TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_hash ON photos(file_hash);
CREATE INDEX IF NOT EXISTS idx_photos_embedding ON photos(embedding_status);
CREATE INDEX IF NOT EXISTS idx_faces_person ON faces(person_id);
CREATE INDEX IF NOT EXISTS idx_faces_photo ON faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_path ON photos(file_path);
"""


class Database:
    """Async SQLite database wrapper."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._db: aiosqlite.Connection | None = None

    async def connect(self):
        """Open the database and create schema."""
        self._db = await aiosqlite.connect(str(self.db_path))
        self._db.row_factory = aiosqlite.Row
        # Enable WAL mode for concurrent reads during indexing
        await self._db.execute("PRAGMA journal_mode=WAL")
        await self._db.execute("PRAGMA foreign_keys=ON")
        await self._db.executescript(SCHEMA_SQL)
        await self._db.commit()

    async def close(self):
        """Close the database."""
        if self._db:
            await self._db.close()

    @property
    def db(self) -> aiosqlite.Connection:
        if self._db is None:
            raise RuntimeError("Database not connected")
        return self._db


# Global instance
database = Database(settings.db_path)
