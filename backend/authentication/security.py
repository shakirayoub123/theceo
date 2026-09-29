import json
import logging
import time
from urllib import parse, request

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def _normalize_email(email):
    return (email or "").strip().lower()


def _cache_key(suffix, normalized_email):
    prefix = "login_security"
    return f"{prefix}:{suffix}:{normalized_email}"


def _window_seconds():
    return max(1, int(getattr(settings, "LOGIN_FAILED_ATTEMPTS_WINDOW_SECONDS", 900)))


def _max_failed_attempts():
    return max(1, int(getattr(settings, "LOGIN_MAX_FAILED_ATTEMPTS", 10)))


def _lockout_seconds():
    return max(1, int(getattr(settings, "LOGIN_LOCKOUT_SECONDS", 1800)))


def _captcha_threshold():
    return max(1, int(getattr(settings, "LOGIN_CAPTCHA_AFTER_FAILURES", 3)))


def get_login_lockout_remaining(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return 0

    lock_until = cache.get(_cache_key("lock_until", normalized_email))
    if not lock_until:
        return 0

    remaining = int(lock_until - time.time())
    if remaining <= 0:
        cache.delete(_cache_key("lock_until", normalized_email))
        return 0
    return remaining


def get_login_failure_count(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return 0
    return int(cache.get(_cache_key("attempts", normalized_email)) or 0)


def is_login_captcha_required(email):
    return get_login_failure_count(email) >= _captcha_threshold()


def get_login_backoff_delay_seconds(failure_count):
    if failure_count <= 0:
        return 0.0

    base_delay = float(getattr(settings, "LOGIN_BACKOFF_BASE_SECONDS", 1))
    max_delay = float(getattr(settings, "LOGIN_BACKOFF_MAX_SECONDS", 8))
    if base_delay <= 0 or max_delay <= 0:
        return 0.0

    exponent = max(0, failure_count - 1)
    delay = base_delay * (2**exponent)
    return max(0.0, min(delay, max_delay))


def register_login_failure(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return {
            "attempts": 0,
            "is_locked": False,
            "captcha_required": False,
            "backoff_delay_seconds": 0.0,
        }

    attempts_key = _cache_key("attempts", normalized_email)
    lock_key = _cache_key("lock_until", normalized_email)

    if get_login_lockout_remaining(normalized_email) > 0:
        attempts = max(get_login_failure_count(normalized_email), _max_failed_attempts())
        return {
            "attempts": attempts,
            "is_locked": True,
            "captcha_required": attempts >= _captcha_threshold(),
            "backoff_delay_seconds": get_login_backoff_delay_seconds(attempts),
        }

    attempts = get_login_failure_count(normalized_email) + 1
    cache.set(attempts_key, attempts, timeout=_window_seconds())

    is_locked = attempts >= _max_failed_attempts()
    if is_locked:
        lock_until = time.time() + _lockout_seconds()
        cache.set(lock_key, lock_until, timeout=_lockout_seconds())

    return {
        "attempts": attempts,
        "is_locked": is_locked,
        "captcha_required": attempts >= _captcha_threshold(),
        "backoff_delay_seconds": get_login_backoff_delay_seconds(attempts),
    }


def reset_login_failures(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return
    cache.delete(_cache_key("attempts", normalized_email))
    cache.delete(_cache_key("lock_until", normalized_email))


def verify_login_captcha(captcha_token, remote_ip=None):
    token = (captcha_token or "").strip()
    provider = getattr(settings, "LOGIN_CAPTCHA_PROVIDER", "none").strip().lower()

    if provider == "none":
        allow_test_bypass = bool(
            getattr(settings, "LOGIN_CAPTCHA_TEST_BYPASS", settings.DEBUG)
        )
        expected_token = getattr(settings, "LOGIN_CAPTCHA_TEST_TOKEN", "test-captcha-pass")
        return allow_test_bypass and token == expected_token

    if not token:
        return False

    secret_key = getattr(settings, "LOGIN_CAPTCHA_SECRET_KEY", "").strip()
    if not secret_key:
        logger.warning(
            "CAPTCHA provider '%s' configured but LOGIN_CAPTCHA_SECRET_KEY is missing.",
            provider,
        )
        return False

    endpoint, payload = _build_captcha_payload(provider, secret_key, token, remote_ip)
    if endpoint is None:
        logger.warning("Unsupported CAPTCHA provider: %s", provider)
        return False

    try:
        encoded_payload = parse.urlencode(payload).encode("utf-8")
        req = request.Request(endpoint, data=encoded_payload, method="POST")
        with request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception:
        logger.exception("CAPTCHA verification request failed.")
        return False

    if not result.get("success", False):
        return False

    if provider in {"recaptcha_v3"}:
        min_score = float(getattr(settings, "LOGIN_CAPTCHA_MIN_SCORE", 0.5))
        score = result.get("score")
        if score is None:
            return False
        try:
            return float(score) >= min_score
        except (TypeError, ValueError):
            return False

    return True


def _build_captcha_payload(provider, secret_key, token, remote_ip):
    base_payload = {"secret": secret_key, "response": token}
    if remote_ip:
        base_payload["remoteip"] = remote_ip

    if provider in {"turnstile", "cloudflare_turnstile"}:
        return "https://challenges.cloudflare.com/turnstile/v0/siteverify", base_payload

    if provider in {"recaptcha_v2", "recaptcha_v3", "recaptcha"}:
        return "https://www.google.com/recaptcha/api/siteverify", base_payload

    return None, None
