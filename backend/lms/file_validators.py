"""
File upload security validators to prevent malware and virus uploads.
Implements multiple layers of security including:
- MIME type verification
- File signature (magic bytes) validation
- File extension whitelisting
- File size limits
- Filename sanitization
"""

import os
import re
import mimetypes
from typing import Dict, Optional, Tuple
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile


# File signatures (magic bytes) for common file types
FILE_SIGNATURES = {
    # Documents
    "application/pdf": [b"%PDF"],
    "application/msword": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        b"PK\x03\x04",
    ],
    "text/plain": [
        b"\xef\xbb\xbf",
        b"\xff\xfe",
        b"\xfe\xff",
    ],  # UTF-8 BOM, UTF-16 LE/BE
    # Images
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/gif": [b"GIF87a", b"GIF89a"],
    "image/webp": [b"RIFF", b"WEBP"],
    "image/bmp": [b"BM"],
    "image/svg+xml": [b"<?xml", b"<svg"],
    # Videos
    "video/mp4": [b"\x00\x00\x00\x18ftypmp4", b"\x00\x00\x00\x1cftypisom"],
    "video/mpeg": [b"\x00\x00\x01\xba", b"\x00\x00\x01\xb3"],
    "video/quicktime": [b"moov", b"mdat", b"free", b"skip", b"wide", b"pnot"],
    "video/x-msvideo": [b"RIFF"],
    "video/webm": [b"\x1a\x45\xdf\xa3"],
    # Audio
    "audio/mpeg": [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"],
    "audio/wav": [b"RIFF", b"WAVE"],
    "audio/ogg": [b"OggS"],
    "audio/aac": [b"\xff\xf1", b"\xff\xf9"],
    # Spreadsheets
    "application/vnd.ms-excel": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        b"PK\x03\x04",
    ],
    "text/csv": [],  # CSV files don't have a consistent signature
    # Presentations
    "application/vnd.ms-powerpoint": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
        b"PK\x03\x04",
    ],
}


# Allowed file extensions by category
ALLOWED_EXTENSIONS = {
    "document": ["pdf", "doc", "docx", "txt", "rtf", "odt"],
    "image": ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"],
    "video": ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"],
    "audio": ["mp3", "wav", "ogg", "aac", "m4a", "flac"],
    "spreadsheet": ["xls", "xlsx", "csv", "ods"],
    "presentation": ["ppt", "pptx", "odp"],
}


# Maximum file sizes by type (in bytes)
MAX_FILE_SIZES = {
    "document": 10 * 1024 * 1024,  # 10 MB
    "image": 5 * 1024 * 1024,  # 5 MB
    "video": 500 * 1024 * 1024,  # 500 MB
    "audio": 50 * 1024 * 1024,  # 50 MB
    "spreadsheet": 10 * 1024 * 1024,  # 10 MB
    "presentation": 50 * 1024 * 1024,  # 50 MB
    "other": 10 * 1024 * 1024,  # 10 MB
}


# Dangerous file extensions that should never be allowed
FORBIDDEN_EXTENSIONS = [
    "exe",
    "bat",
    "cmd",
    "com",
    "pif",
    "scr",
    "vbs",
    "js",
    "jar",
    "app",
    "deb",
    "rpm",
    "dmg",
    "pkg",
    "sh",
    "bash",
    "ps1",
    "psm1",
    "dll",
    "so",
    "dylib",
    "sys",
    "drv",
    "msi",
    "reg",
    "scf",
    "lnk",
    "inf",
    "cpl",
    "hta",
    "gadget",
    "application",
    "msc",
    "wsf",
    "wsh",
    "ws",
    "vb",
    "vbe",
    "jse",
    "job",
    "tmp",
]


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and other attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove any directory components
    filename = os.path.basename(filename)

    # Remove potentially dangerous characters
    filename = re.sub(r"[^\w\s\-\.]", "_", filename)

    # Remove multiple dots (except for file extension)
    name_parts = filename.rsplit(".", 1)
    if len(name_parts) == 2:
        name, ext = name_parts
        name = name.replace(".", "_")
        filename = f"{name}.{ext}"

    # Limit filename length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[: 255 - len(ext) - 1] + "." + ext

    return filename


def get_file_extension(filename: str) -> str:
    """
    Extract file extension from filename.

    Args:
        filename: File name

    Returns:
        Lowercase file extension without dot
    """
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower()


def validate_file_extension(
    filename: str, file_type: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Validate that file extension is allowed.

    Args:
        filename: Name of the file
        file_type: Expected file type category (document, image, video, etc.)

    Returns:
        Tuple of (is_valid, error_message)
    """
    extension = get_file_extension(filename)

    if not extension:
        return False, "File must have an extension"

    # Check if extension is forbidden
    if extension in FORBIDDEN_EXTENSIONS:
        return False, f"File type '.{extension}' is not allowed for security reasons"

    # If file_type specified, check against allowed extensions for that type
    if file_type:
        allowed = ALLOWED_EXTENSIONS.get(file_type, [])
        if extension not in allowed:
            return (
                False,
                f"Extension '.{extension}' is not allowed for {file_type} files",
            )
    else:
        # Check if extension is in any allowed category
        all_allowed = []
        for exts in ALLOWED_EXTENSIONS.values():
            all_allowed.extend(exts)

        if extension not in all_allowed:
            return False, f"File extension '.{extension}' is not allowed"

    return True, ""


def validate_file_signature(
    file_obj: UploadedFile, expected_mime: str
) -> Tuple[bool, str]:
    """
    Validate file signature (magic bytes) matches expected MIME type.

    Args:
        file_obj: Uploaded file object
        expected_mime: Expected MIME type

    Returns:
        Tuple of (is_valid, error_message)
    """
    signatures = FILE_SIGNATURES.get(expected_mime, [])

    # Some file types don't have reliable signatures
    if not signatures:
        return True, ""

    # Read first 32 bytes for signature check
    try:
        file_obj.seek(0)
        header = file_obj.read(32)
        file_obj.seek(0)  # Reset file pointer
    except Exception as e:
        return False, f"Unable to read file header: {str(e)}"

    # Check if any signature matches
    for signature in signatures:
        if header.startswith(signature):
            return True, ""

    # MP4 files are ISO BMFF containers and commonly start with:
    # [4-byte box size][b'ftyp'][major brand...]
    # The previous strict matching for only a couple brands (mp4/isom) rejects
    # valid MP4 variants (iso5/iso6/mp41/mp42/etc).
    if expected_mime == "video/mp4" and len(header) >= 12:
        if header[4:8] == b"ftyp":
            return True, ""

    # Special handling for RIFF files (AVI, WAV, WEBP)
    if b"RIFF" in signatures and header.startswith(b"RIFF"):
        # Check second part of signature
        if expected_mime == "video/x-msvideo" and b"AVI " in header:
            return True, ""
        elif expected_mime == "audio/wav" and b"WAVE" in header:
            return True, ""
        elif expected_mime == "image/webp" and b"WEBP" in header:
            return True, ""

    return False, f"File content does not match expected type {expected_mime}"


def validate_file_size(file_obj: UploadedFile, file_type: str) -> Tuple[bool, str]:
    """
    Validate file size is within allowed limits.

    Args:
        file_obj: Uploaded file object
        file_type: File type category

    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size = MAX_FILE_SIZES.get(file_type, MAX_FILE_SIZES["other"])

    if file_obj.size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        actual_size_mb = file_obj.size / (1024 * 1024)
        return (
            False,
            f"File size ({actual_size_mb:.2f} MB) exceeds maximum allowed ({max_size_mb:.2f} MB) for {file_type} files",
        )

    return True, ""


def get_mime_type(filename: str, file_obj: Optional[UploadedFile] = None) -> str:
    """
    Get MIME type for a file based on extension and optionally content.

    Args:
        filename: Name of the file
        file_obj: Optional uploaded file object for content-based detection

    Returns:
        MIME type string
    """
    # First, try to get MIME type from filename extension
    mime_type, _ = mimetypes.guess_type(filename)

    if not mime_type:
        # Fallback based on extension
        extension = get_file_extension(filename)
        mime_map = {
            "pdf": "application/pdf",
            "doc": "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "txt": "text/plain",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
            "svg": "image/svg+xml",
            "mp4": "video/mp4",
            "avi": "video/x-msvideo",
            "mov": "video/quicktime",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "xls": "application/vnd.ms-excel",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "csv": "text/csv",
            "ppt": "application/vnd.ms-powerpoint",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }
        mime_type = mime_map.get(extension, "application/octet-stream")

    return mime_type


def validate_uploaded_file(
    file_obj: UploadedFile, file_type: Optional[str] = None, check_content: bool = True
) -> Dict[str, any]:
    """
    Comprehensive validation of uploaded file.

    Args:
        file_obj: Uploaded file object
        file_type: Expected file type category (document, image, video, etc.)
        check_content: Whether to validate file content/signature

    Returns:
        Dictionary with validation results:
        {
            'valid': bool,
            'error': str (if not valid),
            'sanitized_filename': str,
            'file_extension': str,
            'mime_type': str,
            'file_size': int
        }

    Raises:
        ValidationError: If file is invalid
    """
    result = {
        "valid": False,
        "error": None,
        "sanitized_filename": None,
        "file_extension": None,
        "mime_type": None,
        "file_size": file_obj.size,
    }

    # Sanitize filename
    sanitized_name = sanitize_filename(file_obj.name)
    result["sanitized_filename"] = sanitized_name
    result["file_extension"] = get_file_extension(sanitized_name)

    # Validate extension
    is_valid, error = validate_file_extension(sanitized_name, file_type)
    if not is_valid:
        result["error"] = error
        raise ValidationError(error)

    # Get MIME type
    mime_type = get_mime_type(sanitized_name, file_obj)
    result["mime_type"] = mime_type

    # Validate file size
    if not file_type:
        # Determine file type from extension
        extension = result["file_extension"]
        for ftype, exts in ALLOWED_EXTENSIONS.items():
            if extension in exts:
                file_type = ftype
                break
        file_type = file_type or "other"

    is_valid, error = validate_file_size(file_obj, file_type)
    if not is_valid:
        result["error"] = error
        raise ValidationError(error)

    # Validate file signature if requested
    if check_content:
        is_valid, error = validate_file_signature(file_obj, mime_type)
        if not is_valid:
            result["error"] = error
            raise ValidationError(error)

    result["valid"] = True
    return result


class FileUploadValidator:
    """
    Django validator class for file uploads.
    Can be used in model FileField validators.
    """

    def __init__(self, file_type: Optional[str] = None, check_content: bool = True):
        """
        Initialize validator.

        Args:
            file_type: Expected file type category
            check_content: Whether to validate file content
        """
        self.file_type = file_type
        self.check_content = check_content

    def __call__(self, file_obj):
        """
        Validate the file.

        Args:
            file_obj: Django FieldFile or UploadedFile object

        Raises:
            ValidationError: If file is invalid
        """
        if not file_obj:
            return

        validate_uploaded_file(file_obj, self.file_type, self.check_content)


def get_allowed_extensions_display(file_type: Optional[str] = None) -> str:
    """
    Get human-readable list of allowed extensions.

    Args:
        file_type: File type category, or None for all

    Returns:
        Comma-separated string of allowed extensions
    """
    if file_type:
        extensions = ALLOWED_EXTENSIONS.get(file_type, [])
    else:
        extensions = []
        for exts in ALLOWED_EXTENSIONS.values():
            extensions.extend(exts)
        extensions = list(set(extensions))

    return ", ".join(sorted(extensions))
