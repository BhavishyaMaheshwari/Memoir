"""
Memoir — Filesystem Scanner
Discovers image files in watched folders incrementally.
"""

import os
from pathlib import Path
from typing import Generator

from core.config import settings


def scan_folder(folder_path: str) -> Generator[Path, None, None]:
    """
    Recursively scan a folder for supported image files.
    
    Yields Path objects for each discovered image.
    Skips hidden files/directories, system directories, and
    files with unsupported extensions.
    """
    root = Path(folder_path)

    if not root.exists() or not root.is_dir():
        return

    for dirpath, dirnames, filenames in os.walk(root):
        # Skip hidden directories
        dirnames[:] = [
            d for d in dirnames
            if not d.startswith('.')
            and d not in {'__pycache__', 'node_modules', '.git'}
        ]

        for filename in filenames:
            # Skip hidden files
            if filename.startswith('.'):
                continue

            filepath = Path(dirpath) / filename
            ext = filepath.suffix.lower()

            if ext in settings.supported_extensions:
                yield filepath


def count_images(folder_path: str) -> int:
    """Count total supported images in a folder."""
    return sum(1 for _ in scan_folder(folder_path))
