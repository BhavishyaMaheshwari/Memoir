"""
Memoir — Indexing Pipeline Orchestrator
Coordinates the full indexing workflow:
  Scan → EXIF → Thumbnails → Store → (AI later)
"""

import uuid
import mimetypes
from pathlib import Path
from datetime import datetime

import xxhash

from core.config import settings
from core.database import database
from indexing.scanner import scan_folder
from indexing.exif import extract_exif
from indexing.thumbnails import generate_thumbnail


async def run_indexing_pipeline(folders: list[str], job_id: str) -> dict:
    """
    Run the complete indexing pipeline for given folders.
    
    Steps per file:
    1. Check if already indexed (by file_hash)
    2. Extract EXIF metadata
    3. Generate thumbnail
    4. Store in SQLite
    5. Mark for AI processing (embeddings, faces, OCR)
    
    Returns stats dict with total/processed/errors counts.
    """
    db = database.db
    stats = {"total": 0, "processed": 0, "skipped": 0, "errors": 0}

    # Discover all files
    all_files: list[Path] = []
    for folder in folders:
        all_files.extend(scan_folder(folder))

    stats["total"] = len(all_files)

    # Update job with total count
    await db.execute(
        "UPDATE indexing_jobs SET total = ?, status = 'indexing' WHERE id = ?",
        (stats["total"], job_id),
    )
    await db.commit()

    # Process in batches
    batch_size = settings.batch_size

    for i in range(0, len(all_files), batch_size):
        batch = all_files[i:i + batch_size]

        for filepath in batch:
            try:
                # Compute file hash for deduplication
                file_hash = _compute_hash(filepath)

                # Check if already indexed
                cursor = await db.execute(
                    "SELECT id FROM photos WHERE file_hash = ?",
                    (file_hash,),
                )
                if await cursor.fetchone():
                    stats["skipped"] += 1
                    stats["processed"] += 1
                    continue

                # Extract metadata
                exif = extract_exif(filepath)

                # Generate ID
                photo_id = str(uuid.uuid4())

                # Generate thumbnail
                thumb_path = generate_thumbnail(filepath, photo_id, "medium")

                # Detect mime type
                mime = mimetypes.guess_type(str(filepath))[0] or "image/jpeg"

                # Detect screenshots (heuristic: check filename patterns)
                is_screenshot = _is_screenshot(filepath)

                # Insert into database
                await db.execute(
                    """
                    INSERT INTO photos (
                        id, file_path, file_name, file_size, file_hash,
                        mime_type, width, height, created_at, modified_at,
                        indexed_at, thumbnail_path,
                        camera_make, camera_model, focal_length, aperture,
                        iso, exposure_time, gps_lat, gps_lng,
                        is_screenshot, embedding_status, face_status, ocr_status
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?,
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, 'pending', 'pending', ?
                    )
                    """,
                    (
                        photo_id,
                        str(filepath),
                        filepath.name,
                        filepath.stat().st_size,
                        file_hash,
                        mime,
                        exif["width"],
                        exif["height"],
                        exif["created_at"],
                        datetime.fromtimestamp(filepath.stat().st_mtime).isoformat(),
                        datetime.utcnow().isoformat(),
                        str(thumb_path) if thumb_path else None,
                        exif["camera_make"],
                        exif["camera_model"],
                        exif["focal_length"],
                        exif["aperture"],
                        exif["iso"],
                        exif["exposure_time"],
                        exif["gps_lat"],
                        exif["gps_lng"],
                        is_screenshot,
                        'pending' if is_screenshot else 'skipped',
                    ),
                )

                stats["processed"] += 1

            except Exception as e:
                print(f"Error indexing {filepath}: {e}")
                stats["errors"] += 1
                stats["processed"] += 1

        # Commit each batch of metadata
        await db.commit()

        # Generate and store AI embeddings for the batch
        batch_paths = [Path(p) for p in batch]
        # We need the photo_ids that were just created for this batch
        # Let's extract them from the successful inserts
        # To keep it simple, we can query back the batch by file_hash
        file_hashes = [_compute_hash(p) for p in batch_paths]
        placeholders = ",".join("?" * len(file_hashes))
        cursor = await db.execute(f"SELECT id, file_path FROM photos WHERE file_hash IN ({placeholders}) AND embedding_status = 'pending'", file_hashes)
        pending_rows = await cursor.fetchall()
        
        if pending_rows:
            pending_ids = [row["id"] for row in pending_rows]
            pending_paths = [Path(row["file_path"]) for row in pending_rows]

            from ai.embeddings import embedding_engine
            from storage.vector_store import vector_store

            embeddings = embedding_engine.embed_images_batch(pending_paths)
            
            vector_records = []
            done_ids = []
            error_ids = []

            for pid, emb in zip(pending_ids, embeddings):
                if emb is not None:
                    vector_records.append({"photo_id": pid, "vector": emb})
                    done_ids.append(pid)
                else:
                    error_ids.append(pid)

            if vector_records:
                vector_store.add_embeddings_batch(vector_records)

            if done_ids:
                d_placeholders = ",".join("?" * len(done_ids))
                await db.execute(f"UPDATE photos SET embedding_status = 'done' WHERE id IN ({d_placeholders})", done_ids)
            
            if error_ids:
                e_placeholders = ",".join("?" * len(error_ids))
                await db.execute(f"UPDATE photos SET embedding_status = 'failed' WHERE id IN ({e_placeholders})", error_ids)

            await db.commit()

        # Update job progress
        await db.execute(
            "UPDATE indexing_jobs SET processed = ? WHERE id = ?",
            (stats["processed"], job_id),
        )
        await db.commit()

    # Mark job complete
    await db.execute(
        "UPDATE indexing_jobs SET status = 'done', finished_at = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), job_id),
    )
    await db.commit()

    return stats


def _compute_hash(filepath: Path) -> str:
    """Compute xxHash of file contents for fast deduplication."""
    hasher = xxhash.xxh64()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def _is_screenshot(filepath: Path) -> bool:
    """Heuristic: detect if a file is likely a screenshot."""
    name = filepath.name.lower()
    patterns = [
        "screenshot", "screen shot", "screen_shot",
        "capture", "snip", "clipboard",
    ]
    return any(p in name for p in patterns)
