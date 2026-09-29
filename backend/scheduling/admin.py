from django.contrib import admin
from .models import (
    Availability,
    MeetingType,
    Meeting,
    MeetingAttendee,
    MeetingParticipantSession,
    MeetingEvent,
    MeetingMediaState,
    MeetingNotes,
    Appointment,
    MeetingMessage,
)


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    """Admin for Availability model"""

    list_display = ("trainer", "day_of_week", "start_time", "end_time")
    list_filter = ("day_of_week", "trainer")
    search_fields = ("trainer__username", "trainer__email")
    ordering = ("trainer", "day_of_week", "start_time")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("trainer")


@admin.register(MeetingType)
class MeetingTypeAdmin(admin.ModelAdmin):
    """Admin for MeetingType model"""

    list_display = (
        "name",
        "description",
        "requires_trainers",
        "allows_multiple_trainers",
    )
    search_fields = ("name", "description")
    list_filter = ("requires_trainers", "allows_multiple_trainers")


class MeetingAttendeeInline(admin.TabularInline):
    """Inline admin for meeting attendees"""

    model = MeetingAttendee
    extra = 0
    fields = ("user", "role", "is_confirmed", "joined_at", "left_at")
    readonly_fields = ("joined_at", "left_at")


class MeetingEventInline(admin.TabularInline):
    """Inline admin for meeting events"""

    model = MeetingEvent
    extra = 0
    fields = ("event_type", "user", "target_user", "timestamp")
    readonly_fields = ("timestamp",)
    can_delete = False


class MeetingParticipantSessionInline(admin.TabularInline):
    """Inline admin for participant sessions"""

    model = MeetingParticipantSession
    extra = 0
    fields = ("user", "joined_at", "left_at", "duration", "leave_reason")
    readonly_fields = ("joined_at", "left_at", "duration")
    can_delete = False


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    """Admin for Meeting model"""

    list_display = (
        "title",
        "meeting_type",
        "scheduled_by",
        "scheduled_at",
        "status",
        "total_participants",
        "duration",
    )
    list_filter = (
        "status",
        "meeting_type",
        "scheduled_at",
        "created_at",
        "is_video_enabled",
    )
    search_fields = ("title", "scheduled_by__username", "scheduled_by__email")
    ordering = ("-scheduled_at",)
    readonly_fields = (
        "room_id",
        "created_at",
        "updated_at",
        "total_participants",
        "max_participants_reached",
    )

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "meeting_type",
                    "scheduled_by",
                    "scheduled_at",
                    "duration",
                    "status",
                    "notes",
                    "location",
                )
            },
        ),
        (
            "Video Call Settings",
            {
                "fields": (
                    "is_video_enabled",
                    "room_id",
                    "daily_room_name",
                    "daily_room_url",
                    "daily_room_token",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Video Call Status",
            {
                "fields": (
                    "initiated_at",
                    "initiated_by",
                    "ended_at",
                    "ended_by",
                    "spotlighted_participant",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Statistics",
            {
                "fields": ("total_participants", "max_participants_reached"),
                "classes": ("collapse",),
            },
        ),
        (
            "Daily.co Integration",
            {
                "fields": (
                    "is_daily_room_active",
                    "daily_recording_id",
                    "daily_recording_url",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    inlines = [
        MeetingAttendeeInline,
        MeetingEventInline,
        MeetingParticipantSessionInline,
    ]

    actions = ["end_meetings", "create_daily_rooms"]

    def end_meetings(self, request, queryset):
        """End selected meetings"""
        count = 0
        for meeting in queryset.filter(status="active"):
            meeting.status = "ended"
            meeting.ended_at = meeting.ended_at  # This will be set by the method
            meeting.save()
            meeting.end_daily_room()
            count += 1
        self.message_user(request, f"Ended {count} meetings.")

    end_meetings.short_description = "End selected active meetings"

    def create_daily_rooms(self, request, queryset):
        """Create Daily.co rooms for selected meetings"""
        count = 0
        for meeting in queryset:
            try:
                meeting.create_daily_room()
                count += 1
            except Exception as e:
                self.message_user(
                    request, f"Failed to create room for meeting {meeting.id}: {e}"
                )
        self.message_user(request, f"Created Daily.co rooms for {count} meetings.")

    create_daily_rooms.short_description = "Create Daily.co rooms for selected meetings"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related(
                "meeting_type",
                "scheduled_by",
                "initiated_by",
                "ended_by",
                "spotlighted_participant",
            )
        )


@admin.register(MeetingAttendee)
class MeetingAttendeeAdmin(admin.ModelAdmin):
    """Admin for MeetingAttendee model"""

    list_display = (
        "meeting",
        "user",
        "role",
        "is_confirmed",
        "joined_at",
        "left_at",
        "total_duration",
    )
    list_filter = ("role", "is_confirmed", "joined_at")
    search_fields = ("meeting__title", "user__username", "user__email")
    readonly_fields = ("joined_at", "left_at", "total_duration")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("meeting", "user")


@admin.register(MeetingParticipantSession)
class MeetingParticipantSessionAdmin(admin.ModelAdmin):
    """Admin for MeetingParticipantSession model"""

    list_display = (
        "meeting",
        "user",
        "joined_at",
        "left_at",
        "duration",
        "leave_reason",
    )
    list_filter = ("leave_reason", "joined_at")
    search_fields = ("meeting__title", "user__username", "user__email")
    readonly_fields = ("joined_at", "left_at", "duration")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("meeting", "user")


@admin.register(MeetingEvent)
class MeetingEventAdmin(admin.ModelAdmin):
    """Admin for MeetingEvent model"""

    list_display = ("meeting", "event_type", "user", "target_user", "timestamp")
    list_filter = ("event_type", "timestamp")
    search_fields = ("meeting__title", "user__username", "target_user__username")
    readonly_fields = ("timestamp",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("meeting", "user", "target_user")
        )


@admin.register(MeetingMediaState)
class MeetingMediaStateAdmin(admin.ModelAdmin):
    """Admin for MeetingMediaState model"""

    list_display = (
        "meeting",
        "user",
        "is_audio_muted",
        "is_video_enabled",
        "is_screen_sharing",
        "last_updated",
    )
    list_filter = (
        "is_audio_muted",
        "is_video_enabled",
        "is_screen_sharing",
        "last_updated",
    )
    search_fields = ("meeting__title", "user__username", "user__email")
    readonly_fields = ("last_updated",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("meeting", "user")


@admin.register(MeetingNotes)
class MeetingNotesAdmin(admin.ModelAdmin):
    """Admin for MeetingNotes model"""

    list_display = ("meeting", "user", "created_at", "updated_at")
    search_fields = ("meeting__title", "user__username", "content")
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("meeting", "user")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin for Appointment model"""

    list_display = ("trainer", "client", "scheduled_at", "duration", "status")
    list_filter = ("status", "scheduled_at")
    search_fields = (
        "trainer__username",
        "client__username",
        "trainer__email",
        "client__email",
    )
    ordering = ("-scheduled_at",)
    readonly_fields = ("created_at", "updated_at")

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("trainer", "client")


@admin.register(MeetingMessage)
class MeetingMessageAdmin(admin.ModelAdmin):
    """Admin for MeetingMessage model"""

    list_display = ("appointment", "sender", "sent_at")
    search_fields = (
        "appointment__trainer__username",
        "appointment__client__username",
        "sender__username",
        "message",
    )
    readonly_fields = ("sent_at",)

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related(
                "appointment", "appointment__trainer", "appointment__client", "sender"
            )
        )
