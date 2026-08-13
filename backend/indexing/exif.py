"""
Memoir — EXIF Extraction
Extracts metadata from image files using Pillow.
"""

from pathlib import Path
from datetime import datetime
from typing import Optional
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def extract_exif(filepath: Path) -> dict:
    """
    Extract EXIF metadata from an image file.
    
    Returns a flat dict with standardized field names matching
    the database schema.
    """
    result = {
        "width": None,
        "height": None,
        "created_at": None,
        "camera_make": None,
        "camera_model": None,
        "focal_length": None,
        "aperture": None,
        "iso": None,
        "exposure_time": None,
        "gps_lat": None,
        "gps_lng": None,
    }

    try:
        with Image.open(filepath) as img:
            result["width"] = img.width
            result["height"] = img.height

            exif_data = img.getexif()
            if not exif_data:
                result["created_at"] = _file_date(filepath)
                return result

            decoded = {}
            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, tag_id)
                decoded[tag_name] = value

            # Camera info
            result["camera_make"] = decoded.get("Make")
            result["camera_model"] = decoded.get("Model")

            # Capture settings
            result["focal_length"] = _to_float(decoded.get("FocalLength"))
            result["aperture"] = _to_float(decoded.get("FNumber"))
            result["iso"] = decoded.get("ISOSpeedRatings")
            result["exposure_time"] = str(decoded.get("ExposureTime", ""))

            # Date
            date_str = decoded.get("DateTimeOriginal") or decoded.get("DateTime")
            if date_str:
                try:
                    dt = datetime.strptime(str(date_str), "%Y:%m:%d %H:%M:%S")
                    result["created_at"] = dt.isoformat()
                except (ValueError, TypeError):
                    result["created_at"] = _file_date(filepath)
            else:
                result["created_at"] = _file_date(filepath)

            # GPS
            gps_info = decoded.get("GPSInfo")
            if gps_info:
                result["gps_lat"], result["gps_lng"] = _parse_gps(gps_info)

    except Exception:
        # Gracefully handle corrupt/unsupported files
        result["created_at"] = _file_date(filepath)

    return result


def _file_date(filepath: Path) -> str:
    """Fallback: use file modification time."""
    try:
        mtime = filepath.stat().st_mtime
        return datetime.fromtimestamp(mtime).isoformat()
    except Exception:
        return datetime.utcnow().isoformat()


def _to_float(value) -> Optional[float]:
    """Safely convert EXIF rational to float."""
    if value is None:
        return None
    try:
        if hasattr(value, "numerator"):
            return float(value.numerator) / float(value.denominator)
        return float(value)
    except (TypeError, ValueError, ZeroDivisionError):
        return None


def _parse_gps(gps_info: dict) -> tuple[Optional[float], Optional[float]]:
    """Parse GPS coordinates from EXIF GPSInfo."""
    try:
        def _dms_to_decimal(dms, ref):
            degrees = float(dms[0])
            minutes = float(dms[1])
            seconds = float(dms[2])
            decimal = degrees + minutes / 60 + seconds / 3600
            if ref in ('S', 'W'):
                decimal = -decimal
            return decimal

        lat_dms = gps_info.get(2)
        lat_ref = gps_info.get(1)
        lng_dms = gps_info.get(4)
        lng_ref = gps_info.get(3)

        if lat_dms and lat_ref and lng_dms and lng_ref:
            lat = _dms_to_decimal(lat_dms, lat_ref)
            lng = _dms_to_decimal(lng_dms, lng_ref)
            return lat, lng
    except Exception:
        pass

    return None, None
