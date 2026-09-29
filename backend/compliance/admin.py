from django.contrib import admin
from .models import Consent, DataExportJob


@admin.register(Consent)
class ConsentAdmin(admin.ModelAdmin):
    """Admin for Consent model"""

    list_display = ("user", "consent_type", "consented", "consented_at", "revoked_at")
    list_filter = ("consent_type", "consented", "consented_at", "revoked_at")
    search_fields = ("user__username", "user__email", "consent_type")
    readonly_fields = ("consented_at", "revoked_at")

    fieldsets = (
        ("Consent Information", {"fields": ("user", "consent_type", "consented")}),
        (
            "Timestamps",
            {"fields": ("consented_at", "revoked_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")


@admin.register(DataExportJob)
class DataExportJobAdmin(admin.ModelAdmin):
    """Admin for DataExportJob model"""

    list_display = ("user", "status", "requested_at", "completed_at")
    list_filter = ("status", "requested_at", "completed_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("requested_at", "completed_at")

    fieldsets = (
        (
            "Job Information",
            {"fields": ("user", "report_type", "parameters", "status")},
        ),
        ("Files", {"fields": ("export_file",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("requested_at", "completed_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["mark_completed", "mark_failed"]

    def mark_completed(self, request, queryset):
        """Mark selected jobs as completed"""
        from django.utils import timezone

        count = queryset.filter(status="processing").update(
            status="completed", completed_at=timezone.now()
        )
        self.message_user(request, f"Marked {count} jobs as completed.")

    mark_completed.short_description = "Mark selected processing jobs as completed"

    def mark_failed(self, request, queryset):
        """Mark selected jobs as failed"""
        count = queryset.filter(status="processing").update(status="failed")
        self.message_user(request, f"Marked {count} jobs as failed.")

    mark_failed.short_description = "Mark selected processing jobs as failed"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")
