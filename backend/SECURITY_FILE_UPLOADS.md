# File Upload Security Enhancements

## Overview

This document describes the comprehensive security measures implemented for file uploads in the TCI Backend application to protect against viruses, malware, and other security threats.

## Security Features Implemented

### 1. File Validation Module (`lms/file_validators.py`)

A comprehensive validation module that provides multiple layers of security:

#### File Extension Whitelisting
- Only approved file extensions are allowed per file type category
- Dangerous executable file types are explicitly blacklisted (exe, bat, cmd, sh, etc.)
- Supports: documents, images, videos, audio, spreadsheets, and presentations

#### File Signature Validation (Magic Bytes)
- Validates that file content matches the expected file type
- Checks file headers against known signatures for:
  - Documents (PDF, DOC, DOCX, TXT)
  - Images (JPEG, PNG, GIF, WEBP, BMP, SVG)
  - Videos (MP4, AVI, MOV, WEBM)
  - Audio (MP3, WAV, OGG, AAC)
  - Spreadsheets (XLS, XLSX, CSV)
  - Presentations (PPT, PPTX)

#### File Size Limits by Type
- Document files: 10 MB max
- Image files: 5 MB max
- Video files: 500 MB max
- Audio files: 50 MB max
- Spreadsheet files: 10 MB max
- Presentation files: 50 MB max
- Other files: 10 MB max

#### Filename Sanitization
- Removes directory traversal attempts (../, ..\)
- Strips dangerous characters
- Prevents double extensions
- Limits filename length to 255 characters

### 2. Django Settings Configuration

Enhanced security settings in `tci_backend/settings.py`:

```python
# Enhanced file upload security configurations
ALLOWED_FILE_EXTENSIONS = {
    'document': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    'video': ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
    'audio': ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'],
    'spreadsheet': ['xls', 'xlsx', 'csv', 'ods'],
    'presentation': ['ppt', 'pptx', 'odp'],
}

MAX_FILE_SIZES = {
    'document': 10 * 1024 * 1024,      # 10 MB
    'image': 5 * 1024 * 1024,          # 5 MB
    'video': 500 * 1024 * 1024,        # 500 MB
    'audio': 50 * 1024 * 1024,         # 50 MB
    'spreadsheet': 10 * 1024 * 1024,   # 10 MB
    'presentation': 50 * 1024 * 1024,  # 50 MB
    'other': 10 * 1024 * 1024,         # 10 MB
}

# Enable file content validation (check magic bytes/signatures)
VALIDATE_FILE_CONTENT = True

# Sanitize all uploaded filenames
SANITIZE_FILE_NAMES = True

# Content Security Policy and file security
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
```

### 3. Updated Serializers

All file upload serializers have been enhanced with security validation:

#### `ChapterFileCreateSerializer`
- Validates file type, size, and content
- Sanitizes filenames automatically
- Checks file signatures against expected types

#### `ChapterCreateSerializer`
- Enhanced video file validation
- Content-based verification
- Automatic filename sanitization

#### `ServiceCreateUpdateSerializer`
- Featured image validation with content checking
- File signature verification
- Size and type restrictions

#### `FileUploadPrepareSerializer` (Chat)
- Filename sanitization
- Extension validation
- Forbidden file type detection

### 4. Updated Views

Security validation added to all file upload endpoints:

#### `ClientFileUploadView` (`lms/client_views.py`)
- Comprehensive file validation before saving
- Automatic file type detection
- Content verification for all uploads

#### `ServiceCreateView` (`lms/service_views.py`)
- Validates chapter videos before processing
- Validates all regular file attachments
- Continues processing valid files even if some fail validation

#### `EditServiceView` (`lms/views.py`)
- Video file validation for chapter updates
- Content-based security checks
- Sanitized filename handling

## Usage

### Basic File Validation

```python
from lms.file_validators import validate_uploaded_file

# Validate an uploaded file
try:
    result = validate_uploaded_file(
        file_obj,
        file_type='document',  # or 'image', 'video', etc.
        check_content=True     # Enable content verification
    )
    
    # File is valid, use sanitized filename
    sanitized_name = result['sanitized_filename']
    file_extension = result['file_extension']
    mime_type = result['mime_type']
    
except ValidationError as e:
    # Handle validation error
    print(f"File validation failed: {str(e)}")
```

### Using as Django Validator

```python
from django.db import models
from lms.file_validators import FileUploadValidator

class MyModel(models.Model):
    document = models.FileField(
        upload_to='documents/',
        validators=[FileUploadValidator(file_type='document')]
    )
    image = models.ImageField(
        upload_to='images/',
        validators=[FileUploadValidator(file_type='image')]
    )
```

## Security Best Practices

### What This Protects Against

1. **Executable File Uploads**: Blocks .exe, .bat, .sh, .js, and other executable files
2. **File Type Spoofing**: Verifies file content matches declared type
3. **Oversized Files**: Prevents resource exhaustion attacks
4. **Directory Traversal**: Sanitizes filenames to prevent path manipulation
5. **Malicious Filenames**: Removes dangerous characters and patterns
6. **Content-Type Mismatch**: Validates file signatures (magic bytes)

### What This Doesn't Protect Against

1. **Virus/Malware Detection**: Does not perform antivirus scanning
2. **Encrypted Malware**: Cannot detect malware hidden in encrypted files
3. **Zero-Day Exploits**: Cannot detect unknown vulnerabilities in file formats
4. **Steganography**: Cannot detect hidden data in images/files

### Recommendations for Additional Security

1. **Antivirus Integration**: Consider integrating ClamAV or similar for virus scanning
2. **File Sandboxing**: Process files in isolated environments
3. **Regular Updates**: Keep file signature database updated
4. **User Education**: Train users not to open suspicious files
5. **Audit Logging**: Monitor file upload patterns for anomalies
6. **Access Controls**: Restrict file access based on user roles

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Note: `python-magic` is included for enhanced MIME type detection. On macOS/Linux, you may also need to install libmagic:

```bash
# macOS
brew install libmagic

# Ubuntu/Debian
apt-get install libmagic1

# CentOS/RHEL
yum install file-libs
```

## Configuration

### Adjusting File Size Limits

Edit `tci_backend/settings.py`:

```python
MAX_FILE_SIZES = {
    'video': 1000 * 1024 * 1024,  # Increase to 1GB
}
```

### Adding New File Types

1. Update `ALLOWED_EXTENSIONS` in `lms/file_validators.py`:
```python
ALLOWED_EXTENSIONS = {
    'archive': ['zip', 'tar', 'gz'],  # Add new category
}
```

2. Add file signatures if needed:
```python
FILE_SIGNATURES = {
    'application/zip': [b'PK\x03\x04'],
}
```

3. Set size limits:
```python
MAX_FILE_SIZES = {
    'archive': 100 * 1024 * 1024,  # 100 MB
}
```

### Disabling Content Validation

If content validation causes issues, you can disable it:

```python
# In settings.py
VALIDATE_FILE_CONTENT = False
```

Or on a per-call basis:

```python
validate_uploaded_file(file_obj, check_content=False)
```

## Testing

Test file validation:

```python
from django.core.files.uploadedfile import SimpleUploadedFile
from lms.file_validators import validate_uploaded_file

# Create a test file
test_file = SimpleUploadedFile(
    "test.pdf",
    b"%PDF-1.4...",  # Valid PDF header
    content_type="application/pdf"
)

# Validate
result = validate_uploaded_file(test_file, file_type='document')
assert result['valid'] == True
```

## Maintenance

### Regular Updates

1. Monitor for new attack vectors and update forbidden extensions
2. Add new file signatures as new file types are supported
3. Review and adjust size limits based on usage patterns
4. Keep `python-magic` library updated

### Monitoring

Monitor these metrics:
- Failed validation attempts
- Most common rejected file types
- Size of uploaded files
- Upload patterns by user

## Support

For questions or issues related to file upload security:
1. Review this documentation
2. Check Django error logs
3. Examine validation error messages
4. Contact the development team

## Version History

- **v1.0** (2025-01-20): Initial implementation
  - File extension whitelisting
  - File signature validation
  - Filename sanitization
  - Size limits by file type
  - Integration with all upload endpoints
