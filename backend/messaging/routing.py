from django.urls import re_path
from .consumers import MessagingConsumer
import logging

logger = logging.getLogger(__name__)

websocket_urlpatterns = [
    re_path(
        r"messaging/sessions/(?P<session_id>[\w-]+)/?$", MessagingConsumer.as_asgi()
    ),
]

logger.info(f"WebSocket URL patterns registered: {len(websocket_urlpatterns)} patterns")
