import time

from django.conf import settings
from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.throttling import SimpleRateThrottle


def apply_ip_ban(ident):
    ban_prefix = getattr(settings, "IP_BAN_PREFIX", "ipban")
    count_prefix = getattr(settings, "IP_BAN_COUNT_PREFIX", "ipban_count")
    count_key = f"{count_prefix}:{ident}"
    count = (cache.get(count_key) or 0) + 1
    cache.set(count_key, count, timeout=_ban_count_ttl())

    base_seconds = getattr(settings, "IP_BAN_BASE_SECONDS", 300)
    max_seconds = getattr(settings, "IP_BAN_MAX_SECONDS", 3600)
    ban_seconds = min(base_seconds * (2 ** (count - 1)), max_seconds)

    ban_until = time.time() + ban_seconds
    cache.set(f"{ban_prefix}:{ident}", ban_until, timeout=ban_seconds)
    return ban_seconds


def _ban_count_ttl():
    return getattr(settings, "IP_BAN_COUNT_TTL", 86400)


class BurstRateThrottle(SimpleRateThrottle):
    scope = "burst"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_{self.scope}_{ident}"


class SustainedRateThrottle(SimpleRateThrottle):
    scope = "sustained"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_{self.scope}_{ident}"


class IPBanThrottle(SimpleRateThrottle):
    scope = "ip_ban"

    def __init__(self):
        super().__init__()
        self.ban_prefix = getattr(settings, "IP_BAN_PREFIX", "ipban")
        self.ban_count_prefix = getattr(settings, "IP_BAN_COUNT_PREFIX", "ipban_count")
        self._ban_remaining = None

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_{self.scope}_{ident}"

    def allow_request(self, request, view):
        ident = self.get_ident(request)
        ban_key = f"{self.ban_prefix}:{ident}"
        ban_until = cache.get(ban_key)

        if ban_until:
            remaining = int(ban_until - time.time())
            if remaining > 0:
                self._ban_remaining = remaining
                return False
            cache.delete(ban_key)

        allowed = super().allow_request(request, view)
        if not allowed:
            self._apply_ban(ident)
        return allowed

    def wait(self):
        if self._ban_remaining is not None:
            return self._ban_remaining
        return super().wait()

    def _apply_ban(self, ident):
        self._ban_remaining = apply_ip_ban(ident)

    def _ban_count_ttl(self):
        return _ban_count_ttl()


class GlobalAllowAnyRateThrottle(AnonRateThrottle):
    """
    Global throttle applied to anonymous requests on AllowAny endpoints.
    """

    scope = "allow_any_global"

    def allow_request(self, request, view):
        if request.user and request.user.is_authenticated:
            return True

        permission_classes = getattr(view, "permission_classes", []) or []
        if not any(self._is_allow_any(permission) for permission in permission_classes):
            return True

        return super().allow_request(request, view)

    @staticmethod
    def _is_allow_any(permission):
        try:
            return permission is AllowAny or issubclass(permission, AllowAny)
        except TypeError:
            return isinstance(permission, AllowAny)
