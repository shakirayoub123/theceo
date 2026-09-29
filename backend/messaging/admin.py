from django.contrib import admin
from .models import (
    ChatSession,
    ChatMember,
    ChatMessage,
    ChatAttachment,
    ChatTypingIndicator,
    ChatAuditLog,
)


class ChatMemberInline(admin.TabularInline):
    """Inline admin for chat members"""

    model = ChatMember
    extra = 0
    fields = ("user", "role", "status", "is_moderator", "joined_at")
    readonly_fields = ("joined_at",)


class ChatMessageInline(admin.TabularInline):
    """Inline admin for chat messages"""

    model = ChatMessage
    extra = 0
    fields = ("sender", "text", "is_deleted", "created_at")
    readonly_fields = ("created_at",)
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Admin for ChatSession model"""

    list_display = (
        "title",
        "client",
        "created_by",
        "is_active",
        "member_count",
        "created_at",
    )
    list_filter = ("is_active", "announcement_only", "created_at")
    search_fields = (
        "title",
        "client__username",
        "client__email",
        "created_by__username",
    )
    readonly_fields = ("member_count", "created_at", "updated_at")

    fieldsets = (
        (
            "Session Information",
            {"fields": ("title", "description", "client", "created_by")},
        ),
        (
            "Settings",
            {
                "fields": (
                    "is_active",
                    "announcement_only",
                    "max_members",
                    "retention_days",
                    "allow_attachments",
                    "max_attachment_size_mb",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Statistics", {"fields": ("member_count",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [ChatMemberInline, ChatMessageInline]

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("client", "created_by")


@admin.register(ChatMember)
class ChatMemberAdmin(admin.ModelAdmin):
    """Admin for ChatMember model"""

    list_display = (
        "user",
        "session",
        "role",
        "status",
        "is_moderator",
        "is_online",
        "joined_at",
        "last_seen_at",
    )
    list_filter = ("role", "status", "is_moderator", "joined_at")
    search_fields = ("user__username", "user__email", "session__title")
    readonly_fields = ("joined_at", "last_seen_at")

    fieldsets = (
        ("Member Information", {"fields": ("session", "user", "role", "status")}),
        (
            "Permissions",
            {
                "fields": ("can_post", "can_attach", "is_moderator"),
                "classes": ("collapse",),
            },
        ),
        (
            "Activity",
            {"fields": ("last_seen_at", "muted_until"), "classes": ("collapse",)},
        ),
        ("Timestamps", {"fields": ("joined_at",), "classes": ("collapse",)}),
    )

    actions = ["mute_members", "unmute_members", "ban_members", "unban_members"]

    def mute_members(self, request, queryset):
        """Mute selected members"""
        from django.utils import timezone

        count = queryset.filter(status="active").update(
            status="muted", muted_until=timezone.now() + timezone.timedelta(days=1)
        )
        self.message_user(request, f"Muted {count} members for 24 hours.")

    mute_members.short_description = "Mute selected members for 24 hours"

    def unmute_members(self, request, queryset):
        """Unmute selected members"""
        count = queryset.filter(status="muted").update(
            status="active", muted_until=None
        )
        self.message_user(request, f"Unmuted {count} members.")

    unmute_members.short_description = "Unmute selected members"

    def ban_members(self, request, queryset):
        """Ban selected members"""
        count = queryset.filter(status__in=["active", "muted"]).update(status="banned")
        self.message_user(request, f"Banned {count} members.")

    ban_members.short_description = "Ban selected members"

    def unban_members(self, request, queryset):
        """Unban selected members"""
        count = queryset.filter(status="banned").update(status="active")
        self.message_user(request, f"Unbanned {count} members.")

    unban_members.short_description = "Unban selected members"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("session", "user")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin for ChatMessage model"""

    list_display = (
        "session",
        "sender",
        "message_preview",
        "is_deleted",
        "is_announcement",
        "created_at",
    )
    list_filter = ("is_deleted", "is_announcement", "message_type", "created_at")
    search_fields = ("sender__username", "sender__email", "session__title", "text")
    readonly_fields = ("created_at", "updated_at", "delivered_to", "read_by")

    fieldsets = (
        (
            "Message Information",
            {"fields": ("session", "sender", "text", "rich_content", "message_type")},
        ),
        (
            "Relationships",
            {"fields": ("reply_to", "mentions"), "classes": ("collapse",)},
        ),
        ("Attachments", {"fields": ("attachments",), "classes": ("collapse",)}),
        (
            "Status",
            {
                "fields": ("is_deleted", "deleted_at", "edited_at", "is_announcement"),
                "classes": ("collapse",),
            },
        ),
        ("Delivery", {"fields": ("delivered_to", "read_by"), "classes": ("collapse",)}),
        ("Moderation", {"fields": ("moderated_by",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["delete_messages", "undelete_messages"]

    def message_preview(self, obj):
        if obj.text:
            return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
        return "[Rich content or attachment]"

    message_preview.short_description = "Message"

    def delete_messages(self, request, queryset):
        """Mark selected messages as deleted"""
        from django.utils import timezone

        count = queryset.filter(is_deleted=False).update(
            is_deleted=True, deleted_at=timezone.now()
        )
        self.message_user(request, f"Marked {count} messages as deleted.")

    delete_messages.short_description = "Mark selected messages as deleted"

    def undelete_messages(self, request, queryset):
        """Unmark selected messages as deleted"""
        count = queryset.filter(is_deleted=True).update(
            is_deleted=False, deleted_at=None
        )
        self.message_user(request, f"Unmarked {count} messages as deleted.")

    undelete_messages.short_description = "Unmark selected messages as deleted"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("session", "sender", "reply_to", "moderated_by")
        )


@admin.register(ChatAttachment)
class ChatAttachmentAdmin(admin.ModelAdmin):
    """Admin for ChatAttachment model"""

    list_display = (
        "message",
        "filename",
        "mime_type",
        "size_bytes",
        "is_safe",
        "uploaded_at",
    )
    list_filter = ("mime_type", "is_safe", "uploaded_at")
    search_fields = ("filename", "message__text", "message__sender__username")
    readonly_fields = ("uploaded_at", "scanned_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super().get_queryset(request).select_related("message", "message__sender")
        )


@admin.register(ChatTypingIndicator)
class ChatTypingIndicatorAdmin(admin.ModelAdmin):
    """Admin for ChatTypingIndicator model"""

    list_display = ("session", "user", "started_at")
    search_fields = ("session__title", "user__username", "user__email")
    readonly_fields = ("started_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("session", "user")

    def has_add_permission(self, request):
        """Typing indicators should not be manually added"""
        return False

    def has_change_permission(self, request, obj=None):
        """Typing indicators should not be modified"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Typing indicators should not be deleted"""
        return False


@admin.register(ChatAuditLog)
class ChatAuditLogAdmin(admin.ModelAdmin):
    """Admin for ChatAuditLog model"""

    list_display = ("session", "actor", "action", "target_user", "created_at")
    list_filter = ("action", "created_at")
    search_fields = (
        "session__title",
        "actor__username",
        "actor__email",
        "target_user__username",
        "details",
    )
    readonly_fields = ("created_at", "ip_address", "details")

    fieldsets = (
        (
            "Audit Information",
            {"fields": ("session", "actor", "action", "target_user", "target_message")},
        ),
        ("Details", {"fields": ("details", "ip_address"), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("session", "actor", "target_user", "target_message")
        )

    def has_add_permission(self, request):
        """Audit logs should not be manually added"""
        return False

    def has_change_permission(self, request, obj=None):
        """Audit logs should not be modified"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Audit logs should not be deleted"""
        return False
