"""
Memoir — Photos API Routes
Handles photo listing, retrieval, and thumbnail serving.
"""

import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from core.database import database
from core.config import settings
from models.schemas import PhotoResponse, PhotoListResponse

router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("", response_model=PhotoListResponse)
async def list_photos(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List photos, ordered by creation date descending."""
    db = database.db

    # Get total count
    cursor = await db.execute("SELECT COUNT(*) FROM photos")
    row = await cursor.fetchone()
    total = row[0] if row else 0

    # Fetch page
    cursor = await db.execute(
        "SELECT * FROM photos ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    )
    rows = await cursor.fetchall()

    photos = [PhotoResponse(**dict(row)) for row in rows]

    return PhotoListResponse(
        photos=photos,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(photo_id: str):
    """Get a single photo by ID."""
    db = database.db
    cursor = await db.execute("SELECT * FROM photos WHERE id = ?", (photo_id,))
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")

    return PhotoResponse(**dict(row))


@router.get("/{photo_id}/thumbnail")
async def get_thumbnail(photo_id: str, size: str = "medium"):
    """Serve a photo thumbnail."""
    db = database.db
    cursor = await db.execute(
        "SELECT thumbnail_path, file_path FROM photos WHERE id = ?",
        (photo_id,),
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")

    thumb_path = row["thumbnail_path"]

    if thumb_path and Path(thumb_path).exists():
        return FileResponse(
            thumb_path,
            media_type="image/webp",
            headers={"Cache-Control": "public, max-age=31536000"},
        )

    # Fallback: serve original
    original = row["file_path"]
    if original and Path(original).exists():
        mime = mimetypes.guess_type(original)[0] or "image/jpeg"
        return FileResponse(original, media_type=mime)

    raise HTTPException(status_code=404, detail="Image file not found")


@router.get("/{photo_id}/full")
async def get_full_photo(photo_id: str):
    """Serve the full-resolution photo."""
    db = database.db
    cursor = await db.execute(
        "SELECT file_path FROM photos WHERE id = ?",
        (photo_id,),
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = row["file_path"]
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    mime = mimetypes.guess_type(file_path)[0] or "image/jpeg"
    return FileResponse(file_path, media_type=mime)
