from django.contrib import admin
from .models import ChatSession, ChatMessage


class ChatMessageInline(admin.TabularInline):
    """Inline admin for chat messages"""

    model = ChatMessage
    extra = 0
    fields = ("sender", "message", "sent_at")
    readonly_fields = ("sent_at",)
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Admin for ChatSession model"""

    list_display = ("id", "participants_list", "is_active", "started_at", "ended_at")
    list_filter = ("is_active", "started_at", "ended_at")
    search_fields = ("participants__username", "participants__email")
    readonly_fields = ("started_at", "ended_at")

    inlines = [ChatMessageInline]

    def participants_list(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])

    participants_list.short_description = "Participants"

    def get_queryset(self, request):
        """Optimize queryset with prefetch_related"""
        return super().get_queryset(request).prefetch_related("participants")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin for ChatMessage model"""

    list_display = ("session", "sender", "message_preview", "sent_at")
    list_filter = ("sent_at", "sender")
    search_fields = ("sender__username", "sender__email", "message")
    readonly_fields = ("sent_at",)

    def message_preview(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message

    message_preview.short_description = "Message"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("session", "sender")
