import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@database_sync_to_async
def get_user(token_key):
    try:
        # Decode without validating expiration
        payload = jwt.decode(
            token_key,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        user_id = payload.get("user_id")
        logger.info(f"JWT payload decoded: {payload}")
        if user_id:
            # Convert string user_id to int if necessary
            if isinstance(user_id, str):
                user_id = int(user_id)
            user = User.objects.get(id=user_id)
            logger.info(f"User authenticated: {user.username} (ID: {user.id})")
            return user
    except jwt.ExpiredSignatureError as e:
        logger.error(f"JWT token expired: {e}")
    except jwt.DecodeError as e:
        logger.error(f"JWT decode error: {e}")
    except User.DoesNotExist as e:
        logger.error(f"User not found: {e}")
    except ValueError as e:
        logger.error(f"Value error in user_id conversion: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in JWT authentication: {e}")
    logger.warning("JWT authentication failed, returning AnonymousUser")
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        logger.info(
            f"WebSocket connection attempt: {scope.get('path', 'unknown path')}"
        )
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            logger.info("Token found in query parameters")
            scope["user"] = await get_user(token)
        else:
            logger.warning("No token found in query parameters")
            scope["user"] = AnonymousUser()

        logger.info(f"User set in scope: {scope['user']}")
        return await super().__call__(scope, receive, send)
