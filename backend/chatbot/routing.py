from django.urls import re_path
from .consumers import ChatConsumer, AIChatConsumer
import logging

logger = logging.getLogger(__name__)

websocket_urlpatterns = [
    re_path(r"^messaging/sessions/(?P<session_id>[\w-]+)/?$", ChatConsumer.as_asgi()),
    re_path(r"^ai-chat/sessions/(?P<session_id>[\w-]+)/?$", AIChatConsumer.as_asgi()),
]

logger.info(
    f"Chatbot WebSocket URL patterns registered: {len(websocket_urlpatterns)} patterns"
)
for i, pattern in enumerate(websocket_urlpatterns):
    logger.info(f"Pattern {i + 1}: {pattern.pattern}")
