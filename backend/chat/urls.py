from django.urls import path
from . import views

urlpatterns = [
    # Chat session management
    path("sessions/", views.ChatSessionView.as_view(), name="chat-sessions"),
    path(
        "sessions/<uuid:session_id>/",
        views.ChatSessionView.as_view(),
        name="chat-session-detail",
    ),
    # Chat members
    path(
        "sessions/<uuid:session_id>/members/",
        views.ChatMembersView.as_view(),
        name="chat-members",
    ),
    path(
        "sessions/<uuid:session_id>/members/<uuid:user_id>/",
        views.ChatMemberDetailView.as_view(),
        name="chat-member-detail",
    ),
    # Chat messages
    path(
        "sessions/<uuid:session_id>/messages/",
        views.ChatMessagesView.as_view(),
        name="chat-messages",
    ),
    path(
        "sessions/<uuid:session_id>/messages/<uuid:message_id>/",
        views.ChatMessageDetailView.as_view(),
        name="chat-message-detail",
    ),
    # File uploads
    path(
        "sessions/<uuid:session_id>/files:prepareUpload/",
        views.FileUploadPrepareView.as_view(),
        name="file-upload-prepare",
    ),
    # Typing indicators
    path(
        "sessions/<uuid:session_id>/typing/",
        views.TypingIndicatorView.as_view(),
        name="typing-indicator",
    ),
    # Search
    path(
        "sessions/<uuid:session_id>/messages/search/",
        views.ChatSearchView.as_view(),
        name="chat-search",
    ),
    # Audit logs
    path(
        "sessions/<uuid:session_id>/audit/",
        views.ChatAuditLogsView.as_view(),
        name="chat-audit-logs",
    ),
]
