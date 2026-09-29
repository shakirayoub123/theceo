from django.urls import path
from .views import (
    GetChatsView,
    GetChatMessagesView,
    SendMessageView,
    StartChatView,
    StartAIChatView,
    GetAIChatMessagesView,
)

urlpatterns = [
    path("getChats/<str:user_uuid>/", GetChatsView.as_view(), name="get_chats"),
    path(
        "getChatMessages/<str:chat_uuid>/<str:user_uuid>/",
        GetChatMessagesView.as_view(),
        name="get_chat_messages",
    ),
    path("sendMessage/", SendMessageView.as_view(), name="send_message"),
    path("startChat/", StartChatView.as_view(), name="start_chat"),
    path("startAIChat/", StartAIChatView.as_view(), name="start_ai_chat"),
    path(
        "getAIChatMessages/<str:chat_uuid>/",
        GetAIChatMessagesView.as_view(),
        name="get_ai_chat_messages",
    ),
]
