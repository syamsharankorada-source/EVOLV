import hmac
import hashlib
import secrets
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger('auth_audit')

OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 5


class OTPService:
    @staticmethod
    def _cache_key(phone: str) -> str:
        # Hash the phone in the cache key
        hashed_phone = hashlib.sha256(phone.encode()).hexdigest()[:16]
        return f"otp:{hashed_phone}"

    @classmethod
    def generate_otp(cls, phone: str) -> str:
        """
        Generates a cryptographically secure 6-digit numeric OTP,
        stores its hash in cache with 5-minute TTL, and resets attempt counter.
        """
        # Cryptographically secure random 6-digit code
        rng = secrets.SystemRandom()
        raw_otp = f"{rng.randint(100000, 999999)}"
        salt = secrets.token_hex(8)

        # Hash OTP before storing in cache
        hashed_otp = hashlib.sha256(f"{salt}:{raw_otp}".encode()).hexdigest()
        
        cache_data = {
            'hash': hashed_otp,
            'salt': salt,
            'attempts': 0,
        }
        
        cache.set(cls._cache_key(phone), cache_data, timeout=OTP_EXPIRY_SECONDS)
        logger.info(f"OTP generated for phone ending in ...{phone[-4:] if len(phone)>=4 else '****'}")
        return raw_otp

    @classmethod
    def verify_otp(cls, phone: str, submitted_otp: str) -> tuple[bool, str]:
        """
        Verifies submitted OTP against cached hash.
        Uses constant-time comparison to prevent timing attacks.
        Limits failed attempts to MAX_OTP_ATTEMPTS.
        Returns (is_valid, error_message).
        """
        if not submitted_otp or len(submitted_otp) < 4:
            return False, "Invalid OTP format"

        cache_key = cls._cache_key(phone)
        stored_data = cache.get(cache_key)

        if not stored_data:
            logger.warning(f"OTP verification failed: Expired or not found for phone ending ...{phone[-4:] if len(phone)>=4 else '****'}")
            return False, "OTP has expired or does not exist. Please request a new code."

        stored_data['attempts'] += 1
        if stored_data['attempts'] > MAX_OTP_ATTEMPTS:
            cache.delete(cache_key)
            logger.warning(f"OTP verification locked out: Max attempts exceeded for phone ending ...{phone[-4:] if len(phone)>=4 else '****'}")
            return False, "Too many failed attempts. This OTP has been invalidated. Please request a new code."

        salt = stored_data['salt']
        expected_hash = stored_data['hash']
        computed_hash = hashlib.sha256(f"{salt}:{submitted_otp.strip()}".encode()).hexdigest()

        # Constant-time comparison
        if hmac.compare_digest(expected_hash, computed_hash):
            cache.delete(cache_key)
            logger.info(f"OTP verification successful for phone ending ...{phone[-4:] if len(phone)>=4 else '****'}")
            return True, ""

        # Update remaining attempts in cache
        cache.set(cache_key, stored_data, timeout=OTP_EXPIRY_SECONDS)
        remaining = MAX_OTP_ATTEMPTS - stored_data['attempts']
        logger.warning(f"Incorrect OTP entered for phone ending ...{phone[-4:] if len(phone)>=4 else '****'} ({remaining} attempts left)")
        return False, f"Incorrect code. {remaining} attempt(s) remaining."

