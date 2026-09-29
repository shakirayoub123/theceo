from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin for Payment model"""

    list_display = (
        "user",
        "amount",
        "currency",
        "provider",
        "provider_transaction_id",
        "status",
        "created_at",
    )
    list_filter = ("status", "provider", "currency", "created_at")
    search_fields = ("user__username", "user__email", "provider_transaction_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Payment Information",
            {
                "fields": (
                    "user",
                    "amount",
                    "currency",
                    "provider",
                    "provider_transaction_id",
                    "status",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user")
