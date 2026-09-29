import math
import time

from rest_framework.throttling import SimpleRateThrottle


class EmailWindowThrottle(SimpleRateThrottle):
    """
    Sliding-window throttle keyed by request email (fallback to requester IP).
    Supports non-standard windows like 15 minutes without relying on DRF rate parsing.
    """

    scope = "email_window"
    rate = "1000/day"
    max_requests = 5
    window_seconds = 15 * 60

    def __init__(self):
        super().__init__()
        self._window_history = []
        self._now = None

    def get_cache_key(self, request, view):
        identifier = self._extract_email(request) or self.get_ident(request)
        if not identifier:
            return None
        return f"throttle_{self.scope}_{identifier}"

    def allow_request(self, request, view):
        cache_key = self.get_cache_key(request, view)
        if cache_key is None:
            return True

        now = time.time()
        history = self.cache.get(cache_key, [])
        history = [timestamp for timestamp in history if timestamp > now - self.window_seconds]

        self.key = cache_key
        self.history = history
        self._window_history = history
        self._now = now

        if len(history) >= self.max_requests:
            return False

        history.insert(0, now)
        self.cache.set(cache_key, history, timeout=self.window_seconds)
        return True

    def wait(self):
        if not self._window_history or self._now is None:
            return None

        oldest = self._window_history[-1]
        remaining = self.window_seconds - (self._now - oldest)
        if remaining <= 0:
            return None
        return max(1, math.ceil(remaining))

    @staticmethod
    def _extract_email(request):
        try:
            email = request.data.get("email", "")
        except Exception:
            return None

        if not email:
            return None
        return str(email).strip().lower()


class ForgotPasswordEmailThrottle(EmailWindowThrottle):
    scope = "forgot_password_email"
    max_requests = 3
    window_seconds = 15 * 60


class LoginEmailThrottle(EmailWindowThrottle):
    scope = "login_email"
    max_requests = 5
    window_seconds = 15 * 60
