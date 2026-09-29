"""
ASGI config for tci_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tci_backend.settings")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from lms.middleware import JWTAuthMiddleware


class CustomOriginValidator:
    """Custom origin validator that checks against CORS settings"""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Get the origin from headers
        headers = dict(scope.get("headers", []))
        origin = headers.get(b"origin", b"").decode()

        # Allow WebSocket connections from CORS allowed origins + API domain
        allowed_origins = settings.CORS_ALLOWED_ORIGINS + [
            "https://api.theceoinfluencers.com",
            "https://theceoinfluencers.com",
            "https://www.theceoinfluencers.com",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
        ]

        if origin:
            # Check if origin is in allowed list
            if not any(origin.startswith(allowed) for allowed in allowed_origins):
                # Log the rejection
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(f"WebSocket origin rejected: {origin}")
                await send(
                    {
                        "type": "websocket.close",
                        "code": 403,
                    }
                )
                return

        return await self.inner(scope, receive, send)


class DebugProtocolTypeRouter(ProtocolTypeRouter):
    async def __call__(self, scope, receive, send):
        protocol = scope.get("type", "unknown")
        path = scope.get("path", "unknown")
        print(f"ASGI request received - Protocol: {protocol}, Path: {path}")
        return await super().__call__(scope, receive, send)


def get_application():
    """Factory function to create the ASGI application with proper imports"""
    # Import routing modules here after Django is fully set up
    from messaging.routing import websocket_urlpatterns as messaging_patterns
    from lms.routing import websocket_urlpatterns as lms_patterns
    from chatbot.routing import websocket_urlpatterns as chatbot_patterns

    # Combine all websocket patterns
    all_websocket_patterns = messaging_patterns + lms_patterns + chatbot_patterns

    print(f"Total WebSocket patterns loaded: {len(all_websocket_patterns)}")
    print(f"Messaging patterns: {len(messaging_patterns)}")
    print(f"LMS patterns: {len(lms_patterns)}")
    print(f"Chatbot patterns: {len(chatbot_patterns)}")

    return DebugProtocolTypeRouter(
        {
            "http": django_asgi_app,
            "websocket": JWTAuthMiddleware(
                CustomOriginValidator(URLRouter(all_websocket_patterns))
            ),
        }
    )


# Create the application instance
application = get_application()
