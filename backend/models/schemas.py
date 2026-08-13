"""
Memoir — Pydantic Models
Request/response schemas for the API.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Photos ───

class PhotoResponse(BaseModel):
    id: str
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    indexed_at: Optional[str] = None
    thumbnail_path: Optional[str] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    focal_length: Optional[float] = None
    aperture: Optional[float] = None
    iso: Optional[int] = None
    exposure_time: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    ocr_text: Optional[str] = None
    is_screenshot: bool = False
    embedding_status: str = "pending"
    face_status: str = "pending"
    ocr_status: str = "pending"


class PhotoListResponse(BaseModel):
    photos: list[PhotoResponse]
    total: int
    offset: int
    limit: int


# ─── Search ───

class SearchRequest(BaseModel):
    query: str
    limit: int = 50


class SearchResultItem(BaseModel):
    photo: PhotoResponse
    score: float
    match_type: str = "semantic"


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    query: str


# ─── Indexing ───

class AddFolderRequest(BaseModel):
    path: str


class StartIndexingRequest(BaseModel):
    folders: list[str] = []


class IndexingStatusResponse(BaseModel):
    id: Optional[str] = None
    status: str = "idle"
    total: int = 0
    processed: int = 0
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


class FolderResponse(BaseModel):
    id: str
    path: str
    added_at: Optional[str] = None
    last_scan: Optional[str] = None


class FolderListResponse(BaseModel):
    folders: list[FolderResponse]


# ─── People ───

class PersonResponse(BaseModel):
    id: str
    name: Optional[str] = None
    photo_count: int = 0
    cover_face: Optional[str] = None
    created_at: Optional[str] = None


class PersonListResponse(BaseModel):
    people: list[PersonResponse]


class RenamePersonRequest(BaseModel):
    name: str


# ─── Health ───

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    photos_count: int = 0
    indexed_count: int = 0
