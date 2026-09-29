import logging
from datetime import timedelta

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)


def _cookie_kwargs(max_age: int):
    kwargs = {
        "max_age": max_age,
        "httponly": True,
        "secure": settings.JWT_COOKIE_SECURE,
        "samesite": settings.JWT_COOKIE_SAMESITE,
        "path": "/",
    }
    if settings.JWT_COOKIE_DOMAIN:
        kwargs["domain"] = settings.JWT_COOKIE_DOMAIN
    return kwargs


def _as_timedelta(value):
    if isinstance(value, timedelta):
        return value
    return timedelta(seconds=int(value))


def set_jwt_cookies(response: Response, refresh_token: str):
    refresh_obj = RefreshToken(refresh_token)
    access_token = str(refresh_obj.access_token)

    access_lifetime = _as_timedelta(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"])
    refresh_lifetime = _as_timedelta(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"])

    response.set_cookie(
        settings.JWT_ACCESS_COOKIE,
        access_token,
        **_cookie_kwargs(int(access_lifetime.total_seconds())),
    )
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE,
        str(refresh_obj),
        **_cookie_kwargs(int(refresh_lifetime.total_seconds())),
    )


def clear_jwt_cookies(response: Response):
    delete_kwargs = {"path": "/"}
    if settings.JWT_COOKIE_DOMAIN:
        delete_kwargs["domain"] = settings.JWT_COOKIE_DOMAIN

    response.delete_cookie(settings.JWT_ACCESS_COOKIE, **delete_kwargs)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE, **delete_kwargs)


class CookieTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {"error": "Refresh token cookie is missing"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        new_refresh = serializer.validated_data.get("refresh", refresh_token)
        response = Response({"status": "Token refreshed"}, status=status.HTTP_200_OK)
        set_jwt_cookies(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception as exc:
                logger.debug("Refresh token blacklist skipped: %s", exc)

        response = Response({"status": "Logged out"}, status=status.HTTP_200_OK)
        clear_jwt_cookies(response)
        return response
