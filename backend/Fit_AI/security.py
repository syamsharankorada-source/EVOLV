import re
import io
import base64
import unicodedata
import logging
from django.utils.html import escape, strip_tags
from PIL import Image

logger = logging.getLogger('security')

# Prevent Pillow decompression bombs
Image.MAX_IMAGE_PIXELS = 10_000_000

# E.164-compatible phone regex (10-15 digits with optional leading +)
PHONE_REGEX = re.compile(r'^\+?[1-9]\d{9,14}$')

# Allowed image MIME types and Pillow formats
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
}

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def sanitize_text(text: str, max_length: int = 5000, allow_newlines: bool = True, default: str = '') -> str:
    """
    Sanitizes untrusted text input:
    - Strips HTML tags
    - Replaces null bytes
    - Normalizes Unicode characters
    - Clamps to maximum length
    """
    if not text:
        return default
    if not isinstance(text, str):
        text = str(text)

    # Strip null bytes and dangerous control characters
    text = text.replace('\x00', '')
    text = unicodedata.normalize('NFKC', text)

    # Strip HTML tags
    clean = strip_tags(text)

    # Control newlines
    if not allow_newlines:
        clean = ' '.join(clean.split())
    else:
        # Prevent massive blank lines
        clean = re.sub(r'\n{4,}', '\n\n\n', clean).strip()

    if max_length and len(clean) > max_length:
        clean = clean[:max_length]

    return clean


def sanitize_html_output(text: str) -> str:
    """Escapes special characters to prevent XSS when rendering user content."""
    return escape(sanitize_text(text))


def validate_phone(phone: str) -> tuple[bool, str]:
    """
    Validates and normalizes phone numbers.
    Accepts international or domestic 10-15 digit formats.
    Returns (is_valid, normalized_phone).
    """
    if not phone or not isinstance(phone, str):
        return False, ''

    # Clean formatting characters: spaces, hyphens, parentheses, dots
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone.strip())

    if not PHONE_REGEX.match(cleaned):
        return False, ''

    return True, cleaned


def validate_image_data(image_data: str, max_size_bytes: int = MAX_IMAGE_SIZE_BYTES) -> tuple[bool, str | None]:
    """
    Validates a base64-encoded image data URL:
    - Ensures valid schema: data:image/(jpeg|png|webp);base64,...
    - Enforces file size cap
    - Decodes and verifies image integrity using Pillow
    - Rejects decompression bombs, corrupted files, and non-image payloads
    
    Returns (is_valid, error_message).
    """
    if not image_data or not isinstance(image_data, str):
        return False, 'No image data provided'

    # Check for valid Data URL format
    if not image_data.startswith('data:image/'):
        return False, 'Invalid image format: Must be a base64 data URI'

    try:
        header, encoded = image_data.split(',', 1)
    except ValueError:
        return False, 'Malformed image data URI'

    mime_match = re.match(r'^data:(image\/[a-zA-Z0-9\+\-]+);base64$', header)
    if not mime_match:
        return False, 'Invalid image MIME type'

    mime_type = mime_match.group(1).lower()
    if mime_type not in ALLOWED_IMAGE_TYPES:
        return False, f'Unsupported image type: {mime_type}. Allowed: JPEG, PNG, WEBP'

    # Estimate base64 size before decoding (4 base64 chars = 3 bytes)
    estimated_size = (len(encoded) * 3) / 4
    if estimated_size > max_size_bytes * 1.2:
        return False, f'Image payload too large (max {max_size_bytes // (1024*1024)}MB)'

    try:
        decoded_bytes = base64.b64decode(encoded, validate=True)
    except Exception as e:
        logger.warning(f"Base64 decode failure: {e}")
        return False, 'Corrupted base64 image data'

    if len(decoded_bytes) > max_size_bytes:
        return False, f'Image exceeds {max_size_bytes // (1024*1024)}MB limit'

    # Verify image integrity and magic bytes with Pillow
    try:
        with Image.open(io.BytesIO(decoded_bytes)) as img:
            expected_format = ALLOWED_IMAGE_TYPES[mime_type]
            if img.format not in ('JPEG', 'PNG', 'WEBP'):
                return False, f'Image file header mismatch: detected {img.format}'

            # Ensure image dimensions are reasonable
            width, height = img.size
            if width <= 0 or height <= 0 or width > 6000 or height > 6000:
                return False, 'Invalid image dimensions'

            # Verify underlying image bytes
            img.verify()

    except Exception as e:
        logger.warning(f"Pillow image validation failed: {e}")
        return False, 'Invalid or corrupted image file'

    return True, None


def validate_int(val, default: int = 0, min_val: int = None, max_val: int = None) -> int:
    """Safely coerces and bounds integers."""
    try:
        num = int(val)
    except (TypeError, ValueError):
        return default

    if min_val is not None and num < min_val:
        return min_val
    if max_val is not None and num > max_val:
        return max_val
    return num


def validate_float(val, default: float = 0.0, min_val: float = None, max_val: float = None) -> float:
    """Safely coerces and bounds floating point numbers, rejecting NaN and Infinity."""
    try:
        num = float(val)
        if num != num or num == float('inf') or num == float('-inf'):  # NaN check
            return default
    except (TypeError, ValueError):
        return default

    if min_val is not None and num < min_val:
        return min_val
    if max_val is not None and num > max_val:
        return max_val
    return num


def validate_choice(val: str, choices: list | set | tuple, default: str = None) -> str:
    """Ensures input matches an allowed set of choices."""
    if not val:
        return default
    val_str = str(val).strip()
    if val_str in choices:
        return val_str
    return default
