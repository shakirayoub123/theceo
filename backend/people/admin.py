from django.contrib import admin
from .models import Lead, LeadAssessmentEntry, LeadAssessment, Client, ClientNote


class LeadAssessmentEntryInline(admin.TabularInline):
    """Inline admin for lead assessment entries"""

    model = LeadAssessmentEntry
    extra = 0
    readonly_fields = ("assessment_name", "is_completed", "completed_at")
    fields = ("assessment_id", "assessment_name", "is_completed", "completed_at")
    can_delete = False

    def assessment_name(self, obj):
        return obj.assessment_name

    assessment_name.short_description = "Assessment"


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    """Admin for Lead model"""

    list_display = (
        "first_name",
        "last_name",
        "email",
        "status",
        "meeting_status",
        "assigned_sales",
        "created_at",
    )
    list_filter = (
        "status",
        "meeting_status",
        "payment_completed",
        "assigned_sales",
        "created_at",
    )
    search_fields = ("first_name", "last_name", "email", "phone")
    ordering = ("-created_at",)
    readonly_fields = ("access_code", "created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("first_name", "last_name", "email", "phone")},
        ),
        (
            "Meeting Scheduling",
            {
                "fields": (
                    "requested_meeting_date",
                    "requested_meeting_time",
                    "meeting_status",
                    "approved_meeting_date",
                    "approved_meeting_time",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Access & Assessment",
            {"fields": ("access_code", "access_code_used"), "classes": ("collapse",)},
        ),
        (
            "Lead Status",
            {
                "fields": ("status", "assigned_sales", "notes", "last_contacted"),
                "classes": ("collapse",),
            },
        ),
        (
            "Payment Tracking",
            {
                "fields": (
                    "payment_link_sent",
                    "payment_link_sent_at",
                    "payment_completed",
                    "payment_completed_at",
                    "stripe_payment_id",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [LeadAssessmentEntryInline]

    actions = ["generate_access_codes", "send_access_code_emails", "convert_to_clients"]

    def generate_access_codes(self, request, queryset):
        """Generate access codes for selected leads"""
        count = 0
        for lead in queryset:
            if not lead.access_code:
                lead.generate_access_code()
                count += 1
        self.message_user(request, f"Generated access codes for {count} leads.")

    generate_access_codes.short_description = "Generate access codes for selected leads"

    def send_access_code_emails(self, request, queryset):
        """Send access code emails to selected leads"""
        count = 0
        for lead in queryset:
            if lead.send_access_code_email():
                count += 1
        self.message_user(request, f"Sent access code emails to {count} leads.")

    send_access_code_emails.short_description = (
        "Send access code emails to selected leads"
    )

    def convert_to_clients(self, request, queryset):
        """Convert selected leads to clients"""
        count = 0
        for lead in queryset.filter(payment_completed=True, status="qualified"):
            client = lead.convert_to_client()
            if client:
                count += 1
        self.message_user(request, f"Converted {count} leads to clients.")

    convert_to_clients.short_description = "Convert qualified leads to clients"


@admin.register(LeadAssessmentEntry)
class LeadAssessmentEntryAdmin(admin.ModelAdmin):
    """Admin for LeadAssessmentEntry model"""

    list_display = (
        "lead",
        "assessment_id",
        "assessment_name",
        "is_completed",
        "completed_at",
        "created_at",
    )
    list_filter = ("assessment_id", "is_completed", "created_at")
    search_fields = ("lead__first_name", "lead__last_name", "lead__email")
    readonly_fields = ("assessment_name", "created_at", "updated_at")

    def assessment_name(self, obj):
        return obj.assessment_name

    assessment_name.short_description = "Assessment"


@admin.register(LeadAssessment)
class LeadAssessmentAdmin(admin.ModelAdmin):
    """Admin for LeadAssessment model"""

    list_display = ("lead", "completed_at")
    search_fields = ("lead__first_name", "lead__last_name", "lead__email")
    readonly_fields = ("assessment_data", "completed_at", "updated_at")


class ClientNoteInline(admin.TabularInline):
    """Inline admin for client notes"""

    model = ClientNote
    extra = 0
    readonly_fields = ("created_at", "updated_at")
    fields = ("title", "content", "is_pinned", "category", "created_at")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin for Client model"""

    list_display = (
        "first_name",
        "last_name",
        "email",
        "meeting_status",
        "program_status",
        "contract_status",
        "assigned_sales",
        "created_at",
    )
    list_filter = (
        "meeting_status",
        "program_status",
        "contract_status",
        "assigned_sales",
        "created_at",
    )
    search_fields = ("first_name", "last_name", "email", "phone")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "user",
                    "first_name",
                    "last_name",
                    "email",
                    "phone",
                    "country",
                    "referred_by",
                )
            },
        ),
        (
            "Status Tracking",
            {
                "fields": (
                    "meeting_status",
                    "program_status",
                    "contract_status",
                    "meeting_scheduled_at",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Assignment", {"fields": ("assigned_sales",), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [ClientNoteInline]

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user", "assigned_sales")


@admin.register(ClientNote)
class ClientNoteAdmin(admin.ModelAdmin):
    """Admin for ClientNote model"""

    list_display = (
        "client",
        "advisor",
        "title",
        "is_pinned",
        "category",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_pinned", "category", "created_at", "advisor")
    search_fields = (
        "client__first_name",
        "client__last_name",
        "client__email",
        "title",
        "content",
    )
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Note Information", {"fields": ("client", "advisor", "title", "content")}),
        ("Settings", {"fields": ("is_pinned", "category"), "classes": ("collapse",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("client", "advisor")
