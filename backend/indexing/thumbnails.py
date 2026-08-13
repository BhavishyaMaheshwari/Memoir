"""
Memoir — Thumbnail Generation
Creates optimized WEBP thumbnails in multiple sizes.
"""

from pathlib import Path
from PIL import Image

from core.config import settings


def generate_thumbnail(
    source_path: Path,
    photo_id: str,
    size_name: str = "medium",
) -> Path | None:
    """
    Generate a thumbnail for a photo.
    
    Uses WEBP format for optimal quality/size ratio.
    Returns the path to the generated thumbnail, or None on failure.
    """
    max_dim = settings.thumbnail_sizes.get(size_name, 400)
    
    # Output path: ~/.memoir/thumbnails/{id}_{size}.webp
    output_dir = settings.thumbnails_dir / photo_id[:2]
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{photo_id}_{size_name}.webp"

    # Skip if already exists
    if output_path.exists():
        return output_path

    try:
        with Image.open(source_path) as img:
            # Convert RGBA → RGB for WEBP
            if img.mode in ('RGBA', 'P', 'LA'):
                img = img.convert('RGB')

            # Maintain aspect ratio
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            img.save(
                output_path,
                format=settings.thumbnail_format,
                quality=settings.thumbnail_quality,
                method=4,  # WEBP compression method (0-6, 4 is good balance)
            )

        return output_path

    except Exception as e:
        # Don't fail the pipeline for a single bad thumbnail
        print(f"Thumbnail error for {source_path}: {e}")
        return None


def generate_all_sizes(source_path: Path, photo_id: str) -> dict[str, Path | None]:
    """Generate thumbnails in all configured sizes."""
    return {
        size_name: generate_thumbnail(source_path, photo_id, size_name)
        for size_name in settings.thumbnail_sizes
    }
