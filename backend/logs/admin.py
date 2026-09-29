from django.contrib import admin
from .models import AuditLog, EventLog, ReportJob


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin for AuditLog model"""

    list_display = ("user", "action", "timestamp", "ip_address")
    list_filter = ("timestamp", "action")
    search_fields = ("user__username", "user__email", "action", "details")
    readonly_fields = ("timestamp", "ip_address", "user", "action", "details")

    fieldsets = (
        ("Audit Information", {"fields": ("user", "action", "details", "ip_address")}),
        ("Timestamps", {"fields": ("timestamp",), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")

    def has_add_permission(self, request):
        """Audit logs should not be manually added"""
        return False

    def has_change_permission(self, request, obj=None):
        """Audit logs should not be modified"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Audit logs should not be deleted"""
        return False


@admin.register(EventLog)
class EventLogAdmin(admin.ModelAdmin):
    """Admin for EventLog model"""

    list_display = ("event_type", "user", "description", "timestamp")
    list_filter = ("event_type", "timestamp")
    search_fields = ("event_type", "description", "user__username", "user__email")
    readonly_fields = ("timestamp", "event_type", "description", "user")

    fieldsets = (
        ("Event Information", {"fields": ("event_type", "description", "user")}),
        ("Timestamps", {"fields": ("timestamp",), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")

    def has_add_permission(self, request):
        """Event logs should not be manually added"""
        return False

    def has_change_permission(self, request, obj=None):
        """Event logs should not be modified"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Event logs should not be deleted"""
        return False


@admin.register(ReportJob)
class ReportJobAdmin(admin.ModelAdmin):
    """Admin for ReportJob model"""

    list_display = ("created_by", "report_type", "status", "created_at", "completed_at")
    list_filter = ("status", "report_type", "created_at", "completed_at")
    search_fields = ("created_by__username", "created_by__email", "report_type")
    readonly_fields = ("created_at", "completed_at", "parameters")

    fieldsets = (
        (
            "Job Information",
            {"fields": ("created_by", "report_type", "parameters", "status")},
        ),
        ("Files", {"fields": ("report_file",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "completed_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["mark_completed", "mark_failed"]

    def mark_completed(self, request, queryset):
        """Mark selected jobs as completed"""
        from django.utils import timezone

        count = queryset.filter(status="running").update(
            status="completed", completed_at=timezone.now()
        )
        self.message_user(request, f"Marked {count} jobs as completed.")

    mark_completed.short_description = "Mark selected running jobs as completed"

    def mark_failed(self, request, queryset):
        """Mark selected jobs as failed"""
        count = queryset.filter(status="running").update(status="failed")
        self.message_user(request, f"Marked {count} jobs as failed.")

    mark_failed.short_description = "Mark selected running jobs as failed"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("created_by")
