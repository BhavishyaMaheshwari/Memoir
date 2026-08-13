"""
Memoir — Backend Configuration
All paths and settings for local-first operation.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings — all local, no cloud."""

    # App
    app_name: str = "Memoir"
    app_version: str = "0.1.0"
    debug: bool = False

    # Server
    host: str = "127.0.0.1"
    port: int = 8484

    # Paths
    data_dir: Path = Path.home() / ".memoir"
    db_path: Path = Path("")  # Set in post_init
    thumbnails_dir: Path = Path("")
    lancedb_dir: Path = Path("")

    # Thumbnails
    thumbnail_sizes: dict = {
        "small": 150,
        "medium": 400,
        "large": 800,
    }
    thumbnail_quality: int = 85
    thumbnail_format: str = "WEBP"

    # Indexing
    batch_size: int = 32
    supported_extensions: set = {
        ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
        ".tiff", ".tif", ".bmp", ".gif", ".raw", ".cr2",
        ".nef", ".arw", ".dng",
    }

    # AI
    embedding_model: str = "google/siglip-base-patch16-224"
    embedding_dim: int = 768

    def model_post_init(self, __context) -> None:
        """Resolve dependent paths after init."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.data_dir / "memoir.db"
        self.thumbnails_dir = self.data_dir / "thumbnails"
        self.thumbnails_dir.mkdir(parents=True, exist_ok=True)
        self.lancedb_dir = self.data_dir / "vectors"
        self.lancedb_dir.mkdir(parents=True, exist_ok=True)

    class Config:
        env_prefix = "MEMOIR_"


settings = Settings()
