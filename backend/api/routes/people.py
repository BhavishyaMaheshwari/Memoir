"""
Memoir — People API Routes
Handles face clusters and person management.
"""

from fastapi import APIRouter, HTTPException
from core.database import database
from models.schemas import (
    PersonResponse,
    PersonListResponse,
    RenamePersonRequest,
)

router = APIRouter(prefix="/people", tags=["people"])


@router.get("", response_model=PersonListResponse)
async def list_people():
    """List all people, ordered by photo count."""
    db = database.db
    cursor = await db.execute(
        "SELECT * FROM people ORDER BY photo_count DESC"
    )
    rows = await cursor.fetchall()
    people = [PersonResponse(**dict(row)) for row in rows]
    return PersonListResponse(people=people)


@router.patch("/{person_id}", response_model=PersonResponse)
async def rename_person(person_id: str, request: RenamePersonRequest):
    """Rename a person."""
    db = database.db

    cursor = await db.execute(
        "UPDATE people SET name = ? WHERE id = ?",
        (request.name, person_id),
    )
    await db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Person not found")

    cursor = await db.execute(
        "SELECT * FROM people WHERE id = ?",
        (person_id,),
    )
    row = await cursor.fetchone()
    return PersonResponse(**dict(row))
