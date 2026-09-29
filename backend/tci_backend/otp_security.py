import secrets
import string
import time

from django.core.cache import cache

OTP_CODE_LENGTH = 8
OTP_ALPHABET = string.ascii_uppercase + string.digits

OTP_MAX_ATTEMPTS = 5
OTP_ATTEMPT_WINDOW_SECONDS = 15 * 60
OTP_LOCKOUT_SECONDS = 30 * 60


def normalize_otp(value):
    return str(value or "").strip().upper()


def generate_secure_otp(length=OTP_CODE_LENGTH):
    return "".join(secrets.choice(OTP_ALPHABET) for _ in range(length))


def _email_key(email, suffix):
    normalized_email = str(email or "").strip().lower()
    return f"otp:{suffix}:{normalized_email}"


def get_otp_lockout_remaining(email):
    lock_until = cache.get(_email_key(email, "lock_until"))
    if lock_until is None:
        return 0

    remaining = int(lock_until - time.time())
    if remaining <= 0:
        cache.delete(_email_key(email, "lock_until"))
        return 0
    return remaining


def register_otp_failure(email):
    if get_otp_lockout_remaining(email) > 0:
        return OTP_MAX_ATTEMPTS, True

    attempts_key = _email_key(email, "attempts")
    try:
        attempts = cache.incr(attempts_key)
    except ValueError:
        attempts = 1
        cache.set(attempts_key, attempts, timeout=OTP_ATTEMPT_WINDOW_SECONDS)

    if attempts >= OTP_MAX_ATTEMPTS:
        lock_until = time.time() + OTP_LOCKOUT_SECONDS
        cache.set(
            _email_key(email, "lock_until"),
            lock_until,
            timeout=OTP_LOCKOUT_SECONDS,
        )
        cache.delete(attempts_key)
        return attempts, True

    return attempts, False


def reset_otp_failures(email):
    cache.delete(_email_key(email, "attempts"))
    cache.delete(_email_key(email, "lock_until"))
