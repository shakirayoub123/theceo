from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserPermission


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for User model with role-based permissions"""

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_approved",
        "is_suspended",
        "email_verified",
        "is_active",
        "date_joined",
    )
    list_filter = (
        "role",
        "is_approved",
        "is_suspended",
        "email_verified",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)

    fieldsets = UserAdmin.fieldsets + (
        (
            "Additional Info",
            {
                "fields": (
                    "role",
                    "is_approved",
                    "is_suspended",
                    "email_verified",
                    "sales_influencer_assigned",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Additional Info",
            {
                "fields": (
                    "role",
                    "is_approved",
                    "is_suspended",
                    "email_verified",
                    "sales_influencer_assigned",
                )
            },
        ),
    )

    def get_queryset(self, request):
        """Allow superusers to see all users, others see limited results"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Non-superusers can only see non-superuser accounts
        return qs.exclude(is_superuser=True)


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    """Admin for user permissions"""

    list_display = (
        "user",
        "user_role",
        "view_clients",
        "edit_client_details",
        "view_programs",
        "create_programs",
        "view_payments",
        "manage_roles",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "user__role",
        "view_clients",
        "edit_client_details",
        "view_programs",
        "create_programs",
        "view_payments",
        "manage_roles",
    )
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    ordering = ("-updated_at",)

    fieldsets = (
        ("User Information", {"fields": ("user",)}),
        (
            "Client Permissions",
            {
                "fields": (
                    "view_clients",
                    "edit_client_details",
                    "delete_clients",
                    "meet_clients",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Program Permissions",
            {
                "fields": (
                    "view_programs",
                    "create_programs",
                    "edit_programs",
                    "delete_programs",
                    "publish_programs",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "User Permissions",
            {
                "fields": (
                    "view_users",
                    "create_users",
                    "edit_users",
                    "delete_users",
                    "manage_roles",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Payment Permissions",
            {
                "fields": ("view_payments", "process_payments", "refund_payments"),
                "classes": ("collapse",),
            },
        ),
        (
            "Scheduling Permissions",
            {
                "fields": (
                    "view_schedules",
                    "create_appointments",
                    "edit_appointments",
                    "cancel_appointments",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Communication Permissions",
            {
                "fields": (
                    "view_communications",
                    "send_notifications",
                    "send_broadcasts",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Analytics Permissions",
            {
                "fields": ("view_basic_stats", "view_critical_stats", "export_data"),
                "classes": ("collapse",),
            },
        ),
        (
            "Compliance Permissions",
            {
                "fields": ("view_consents", "manage_consents", "view_audit_logs"),
                "classes": ("collapse",),
            },
        ),
        (
            "Chat Permissions",
            {"fields": ("access_chat", "moderate_chat"), "classes": ("collapse",)},
        ),
        (
            "System Permissions",
            {
                "fields": ("manage_settings", "view_system_logs", "backup_data"),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at")

    def user_role(self, obj):
        return obj.user.role

    user_role.short_description = "Role"
    user_role.admin_order_field = "user__role"

    def get_queryset(self, request):
        """Allow superusers to see all permissions, others see limited results"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Non-superusers can only see permissions for non-superuser accounts
        return qs.exclude(user__is_superuser=True)

    def has_change_permission(self, request, obj=None):
        """Only superusers and users managing their own permissions can edit"""
        if request.user.is_superuser:
            return True
        if obj and obj.user == request.user:
            return True
        return False

    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete permissions"""
        return request.user.is_superuser
