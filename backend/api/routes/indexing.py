"""
Memoir — Indexing API Routes
Handles folder management and indexing job control.
"""

import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException

from core.database import database
from models.schemas import (
    AddFolderRequest,
    StartIndexingRequest,
    IndexingStatusResponse,
    FolderResponse,
    FolderListResponse,
)
from indexing.pipeline import run_indexing_pipeline

router = APIRouter(prefix="/indexing", tags=["indexing"])

# Track active background tasks
_active_tasks: dict[str, asyncio.Task] = {}


@router.get("/folders", response_model=FolderListResponse)
async def get_folders():
    """List all watched folders."""
    db = database.db
    cursor = await db.execute("SELECT * FROM watched_folders ORDER BY added_at DESC")
    rows = await cursor.fetchall()
    folders = [FolderResponse(**dict(row)) for row in rows]
    return FolderListResponse(folders=folders)


@router.post("/folders", response_model=FolderResponse)
async def add_folder(request: AddFolderRequest):
    """Add a new folder to watch."""
    folder_path = Path(request.path).expanduser().resolve()

    if not folder_path.exists():
        raise HTTPException(status_code=400, detail="Folder does not exist")
    if not folder_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    db = database.db

    # Check if already exists
    cursor = await db.execute(
        "SELECT id FROM watched_folders WHERE path = ?",
        (str(folder_path),),
    )
    if await cursor.fetchone():
        raise HTTPException(status_code=409, detail="Folder already watched")

    folder_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    await db.execute(
        "INSERT INTO watched_folders (id, path, added_at) VALUES (?, ?, ?)",
        (folder_id, str(folder_path), now),
    )
    await db.commit()

    return FolderResponse(id=folder_id, path=str(folder_path), added_at=now)


@router.delete("/folders/{folder_id}")
async def remove_folder(folder_id: str):
    """Remove a watched folder."""
    db = database.db
    cursor = await db.execute(
        "DELETE FROM watched_folders WHERE id = ?",
        (folder_id,),
    )
    await db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Folder not found")

    return {"status": "removed"}


@router.get("/status", response_model=IndexingStatusResponse)
async def get_status():
    """Get current indexing status."""
    db = database.db
    cursor = await db.execute(
        "SELECT * FROM indexing_jobs ORDER BY started_at DESC LIMIT 1"
    )
    row = await cursor.fetchone()

    if not row:
        return IndexingStatusResponse(status="idle")

    return IndexingStatusResponse(**dict(row))


@router.post("/start", response_model=IndexingStatusResponse)
async def start_indexing(request: StartIndexingRequest):
    """Start an indexing job for all watched folders (runs in background)."""
    db = database.db

    # Get folders to scan
    if request.folders:
        folders = request.folders
    else:
        cursor = await db.execute("SELECT path FROM watched_folders")
        rows = await cursor.fetchall()
        folders = [row["path"] for row in rows]

    if not folders:
        raise HTTPException(status_code=400, detail="No folders to index")

    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    await db.execute(
        "INSERT INTO indexing_jobs (id, status, started_at) VALUES (?, ?, ?)",
        (job_id, "scanning", now),
    )
    await db.commit()

    # Launch indexing in background — non-blocking
    task = asyncio.create_task(_run_pipeline(folders, job_id))
    _active_tasks[job_id] = task

    return IndexingStatusResponse(
        id=job_id,
        status="scanning",
        started_at=now,
    )


async def _run_pipeline(folders: list[str], job_id: str):
    """Background task wrapper for the indexing pipeline."""
    try:
        stats = await run_indexing_pipeline(folders, job_id)
        print(f"Indexing complete: {stats}")
    except Exception as e:
        print(f"Indexing error: {e}")
        db = database.db
        await db.execute(
            "UPDATE indexing_jobs SET status = 'failed', finished_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), job_id),
        )
        await db.commit()
    finally:
        _active_tasks.pop(job_id, None)
