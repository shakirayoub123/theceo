from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from channels.middleware import BaseMiddleware
from channels.auth import AuthMiddlewareStack
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from http.cookies import SimpleCookie
import jwt
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for JWT authentication in WebSocket connections
    """

    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()

        # Get the token from query string or headers
        token = None

        # Try to get token from query string
        query_string = scope.get("query_string", b"").decode()
        if "token=" in query_string:
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token = param.split("=", 1)[1]
                    break

        # Try to get token from headers if not in query string
        if not token:
            headers = dict(scope.get("headers", []))
            authorization = headers.get(b"authorization", b"").decode()
            if authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]

        # Fallback to HttpOnly cookie-based token
        if not token:
            headers = dict(scope.get("headers", []))
            cookie_header = headers.get(b"cookie", b"").decode()
            if cookie_header:
                cookie = SimpleCookie()
                cookie.load(cookie_header)
                cookie_name = getattr(settings, "JWT_ACCESS_COOKIE", "access_token")
                morsel = cookie.get(cookie_name)
                token = morsel.value if morsel else None

        # Authenticate user
        if token:
            try:
                # Validate the token
                UntypedToken(token)

                # Decode the token to get user info
                decoded_token = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=["HS256"]
                )

                user_id = decoded_token.get("user_id")
                if user_id:
                    try:
                        user = await self.get_user(user_id)
                        scope["user"] = user
                    except User.DoesNotExist:
                        scope["user"] = AnonymousUser()
                else:
                    scope["user"] = AnonymousUser()

            except (
                InvalidToken,
                TokenError,
                jwt.DecodeError,
                jwt.ExpiredSignatureError,
            ) as e:
                logger.warning(f"Invalid JWT token in WebSocket connection: {str(e)}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @staticmethod
    async def get_user(user_id):
        """Get user from database"""
        from channels.db import database_sync_to_async

        @database_sync_to_async
        def _get_user(user_id):
            return User.objects.get(id=user_id)

        return await _get_user(user_id)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to wrap the JWT auth middleware around the inner application
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
