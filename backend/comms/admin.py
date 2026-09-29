from django.contrib import admin
from .models import Notification, BroadcastEmail


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin for Notification model"""

    list_display = ("user", "title", "type", "is_read", "time", "created_at")
    list_filter = ("type", "is_read", "time", "created_at")
    search_fields = ("user__username", "user__email", "title", "message")
    ordering = ("-time",)
    readonly_fields = ("time", "created_at", "updated_at")

    fieldsets = (
        (
            "Notification Information",
            {"fields": ("user", "title", "message", "type", "related_id")},
        ),
        ("Status", {"fields": ("is_read",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("time", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["mark_as_read", "mark_as_unread"]

    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        count = queryset.update(is_read=True)
        self.message_user(request, f"Marked {count} notifications as read.")

    mark_as_read.short_description = "Mark selected notifications as read"

    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        count = queryset.update(is_read=False)
        self.message_user(request, f"Marked {count} notifications as unread.")

    mark_as_unread.short_description = "Mark selected notifications as unread"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")


@admin.register(BroadcastEmail)
class BroadcastEmailAdmin(admin.ModelAdmin):
    """Admin for BroadcastEmail model"""

    list_display = ("subject", "recipients_count", "sent_at")
    search_fields = ("subject", "content")
    readonly_fields = ("sent_at", "recipients")

    fieldsets = (
        ("Email Information", {"fields": ("subject", "content")}),
        ("Recipients", {"fields": ("recipients",), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("sent_at",), "classes": ("collapse",)}),
    )

    def recipients_count(self, obj):
        return obj.recipients.count()

    recipients_count.short_description = "Recipients Count"

    def get_queryset(self, request):
        """Optimize queryset with prefetch_related"""
        return super().get_queryset(request).prefetch_related("recipients")
