import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

from .throttling import IPBanThrottle, apply_ip_ban

# Paths under MEDIA_URL that must never be served directly.
# Requests to these paths are blocked early, before URL routing,
# so they are denied regardless of whether nginx proxies to Django
# or Django is serving media in DEBUG mode.
PROTECTED_MEDIA_PREFIXES = ("/uploads/ebooks/", "/uploads/newsletters/")


class ProtectedMediaMiddleware:
    """Return 403 for any direct request to protected upload directories."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        for prefix in PROTECTED_MEDIA_PREFIXES:
            if path.startswith(prefix):
                return JsonResponse(
                    {"detail": "Direct file access is not allowed. Use the download API."},
                    status=403,
                )
        return self.get_response(request)


class IPBanMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ban_prefix = getattr(settings, "IP_BAN_PREFIX", "ipban")
        self.history_prefix = getattr(settings, "IP_BAN_HISTORY_PREFIX", "ipban_history")
        rate = getattr(settings, "IP_BAN_RATE", None)
        # Don't instantiate SimpleRateThrottle directly: DRF raises ImproperlyConfigured
        # unless a throttle has either a .scope or .rate configured.
        self.num_requests, self.duration = IPBanThrottle().parse_rate(rate)

    def __call__(self, request):
        ident = IPBanThrottle().get_ident(request)
        if ident:
            ban_key = f"{self.ban_prefix}:{ident}"
            ban_until = cache.get(ban_key)
            if ban_until:
                remaining = int(ban_until - time.time())
                if remaining > 0:
                    response = JsonResponse(
                        {"detail": "Request was throttled. Try again later."},
                        status=429,
                    )
                    response["Retry-After"] = str(remaining)
                    return response
                cache.delete(ban_key)

            if self.num_requests and self.duration:
                now = time.time()
                history_key = f"{self.history_prefix}:{ident}"
                history = cache.get(history_key, [])
                history = [ts for ts in history if ts > now - self.duration]
                if len(history) >= self.num_requests:
                    ban_seconds = apply_ip_ban(ident)
                    response = JsonResponse(
                        {"detail": "Request was throttled. Try again later."},
                        status=429,
                    )
                    response["Retry-After"] = str(ban_seconds)
                    return response
                history.append(now)
                cache.set(history_key, history, timeout=self.duration)

        return self.get_response(request)
