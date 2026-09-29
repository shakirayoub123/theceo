from django.db import models
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Availability(models.Model):
    trainer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="availabilities"
    )
    day_of_week = models.CharField(
        max_length=10,
        choices=[
            ("monday", "Monday"),
            ("tuesday", "Tuesday"),
            ("wednesday", "Wednesday"),
            ("thursday", "Thursday"),
            ("friday", "Friday"),
            ("saturday", "Saturday"),
            ("sunday", "Sunday"),
        ],
    )
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.trainer.username} - {self.day_of_week}"


class MeetingType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    requires_trainers = models.BooleanField(default=True)
    allows_multiple_trainers = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Meeting(models.Model):
    MEETING_STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("confirmed", "Confirmed"),
        ("active", "Active"),  # Added for video calls
        ("completed", "Completed"),
        ("ended", "Ended"),  # Added for video calls
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=200)
    meeting_type = models.ForeignKey(MeetingType, on_delete=models.CASCADE)
    scheduled_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="scheduled_meetings"
    )
    scheduled_at = models.DateTimeField()
    duration = models.DurationField()
    status = models.CharField(
        max_length=20, choices=MEETING_STATUS_CHOICES, default="active"
    )
    notes = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Video call specific fields
    room_id = models.UUIDField(null=True, blank=True, unique=True)
    initiated_at = models.DateTimeField(null=True, blank=True)
    initiated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="initiated_meetings",
    )
    ended_at = models.DateTimeField(null=True, blank=True)
    ended_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ended_meetings",
    )
    spotlighted_participant = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="spotlighted_meetings",
    )
    is_video_enabled = models.BooleanField(default=True)
    total_participants = models.IntegerField(default=0)
    max_participants_reached = models.IntegerField(default=0)

    # Daily.co integration fields
    daily_room_name = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )
    daily_room_url = models.URLField(null=True, blank=True)
    daily_room_token = models.TextField(null=True, blank=True)  # For room owner
    is_daily_room_active = models.BooleanField(default=False)
    daily_recording_id = models.CharField(max_length=255, null=True, blank=True)
    daily_recording_url = models.URLField(null=True, blank=True)

    # Optional program/service link (used to show relevant learning resources in meeting view)
    service = models.ForeignKey(
        "lms.Service",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="meetings",
    )

    def __str__(self):
        return f"{self.title} - {self.scheduled_at}"

    def can_initiate(self, user):
        """Check if user can initiate this meeting"""
        from datetime import timedelta

        # Meeting must be scheduled
        if self.status != "scheduled":
            return False

        # User must be an attendee
        if not self.attendees.filter(user=user).exists():
            return False

        return True

    def get_room_id(self):
        """Get or generate room ID for video call"""
        if not self.room_id:
            import uuid

            self.room_id = uuid.uuid4()
            self.save()
        return str(self.room_id)

    def get_daily_room_name(self):
        """Get or generate Daily.co room name"""
        if not self.daily_room_name:
            import uuid

            self.daily_room_name = f"meeting-{self.id}-{uuid.uuid4().hex[:8]}"
            self.save()
        return self.daily_room_name

    def create_daily_room(self):
        """Create a Daily.co room for this meeting"""
        from services.daily_service import daily_service

        # If we already have an active room, return its name
        if self.daily_room_name and self.is_daily_room_active and self.daily_room_url:
            return self.daily_room_name

        try:
            # Generate room name if it doesn't exist
            room_name = self.get_daily_room_name()

            # Calculate duration in seconds (default to 3600 if not set)
            duration_seconds = 3600
            if self.duration:
                duration_seconds = int(self.duration.total_seconds())
                if duration_seconds < 300:  # Minimum 5 minutes
                    duration_seconds = 300

            # Create the room
            room_data = daily_service.create_room(
                room_name=room_name,
                properties={
                    "max_participants": 10,
                    "eject_after_elapsed": duration_seconds,
                    "enable_chat": True,
                    "enable_screenshare": True,
                    "enable_recording": "cloud",
                },
            )

            # Update meeting with room details
            self.daily_room_url = room_data.get("url")
            self.is_daily_room_active = True
            self.save()

            return self.daily_room_name

        except Exception as e:
            logger.error(f"Failed to create Daily.co room for meeting {self.id}: {e}")
            raise

    def get_daily_room_token(self, user, is_owner=False):
        """Get Daily.co room token for a user"""
        from services.daily_service import daily_service

        try:
            # Check if the daily room exists, create it if not
            if not self.daily_room_name or not self.is_daily_room_active:
                self.create_daily_room()

            # Get user full name or username
            user_name = user.get_full_name()
            if not user_name or user_name.strip() == "":
                user_name = user.username

            token_expires_at = timezone.now() + timedelta(hours=24)
            if self.scheduled_at and self.duration:
                meeting_expires_at = (
                    self.scheduled_at + self.duration + timedelta(hours=2)
                )
                if meeting_expires_at > token_expires_at:
                    token_expires_at = meeting_expires_at

            # Create room token
            token = daily_service.create_room_token(
                room_name=self.get_daily_room_name(),
                user_id=str(user.id),
                user_name=user_name,
                is_owner=is_owner or self.scheduled_by == user,
                properties={
                    "exp": int(token_expires_at.timestamp())
                },
            )
            return token
        except Exception as e:
            logger.error(f"Failed to create Daily.co token for user {user.id}: {e}")
            raise

    def get_room_join_url(self, user, is_owner=None):
        """Get the full room URL with token for a user"""
        # Ensure the room exists
        if not self.daily_room_url or not self.is_daily_room_active:
            self.create_daily_room()

        # If is_owner is not specified, determine based on user being the scheduler
        if is_owner is None:
            is_owner = self.scheduled_by == user

        # Note: Removed automatic trainer ownership - any attendee can join as participant
        # Trainers can still be set as owners by explicitly passing is_owner=True

        token = self.get_daily_room_token(user, is_owner=is_owner)

        if not self.daily_room_url:
            raise ValueError("No Daily.co room URL available for this meeting")

        # Daily hosted room URLs expect meeting tokens in the `t` query param.
        room_url = f"{self.daily_room_url}?t={token}"
        return room_url

    def end_daily_room(self):
        """End the Daily.co room"""
        from services.daily_service import daily_service

        if self.daily_room_name and self.is_daily_room_active:
            try:
                # Stop any active recordings
                if self.daily_recording_id:
                    daily_service.stop_recording(
                        self.daily_room_name, self.daily_recording_id
                    )

                # Delete the room
                daily_service.delete_room(self.daily_room_name)
                self.is_daily_room_active = False
                self.save()

            except Exception as e:
                logger.error(f"Failed to end Daily.co room {self.daily_room_name}: {e}")

    def get_webrtc_config(self):
        """Get WebRTC configuration with STUN servers"""
        return {
            "iceServers": [
                {"urls": ["stun:stun.l.google.com:19302"]},
                {"urls": ["stun:stun1.l.google.com:19302"]},
                {"urls": ["stun:stun2.l.google.com:19302"]},
            ]
        }

    def get_minutes_until_start(self):
        """Get minutes until meeting start (negative if already started)"""
        now = timezone.now()
        diff = (self.scheduled_at - now).total_seconds() / 60
        return int(diff)

    @staticmethod
    def _normalize_datetime(value):
        """Normalize datetimes to the current timezone for overlap checks."""
        if timezone.is_naive(value):
            return timezone.make_aware(value, timezone.get_current_timezone())
        return value

    @staticmethod
    def lock_users_for_scheduling(users):
        """Acquire row locks for users to reduce race conditions while scheduling."""
        user_ids = sorted(
            {
                user.id if hasattr(user, "id") else user
                for user in users
                if user is not None
            }
        )
        if not user_ids:
            return
        list(User.objects.select_for_update().filter(id__in=user_ids).order_by("id"))

    @staticmethod
    def find_conflict(users, start_dt, duration, exclude_meeting_id=None):
        """Return a conflicting meeting instance if any user is busy.

        Checks meetings in scheduled/confirmed/active status that overlap the
        proposed interval [start_dt, start_dt+duration).
        """

        if not users or not duration:
            return None

        if duration.total_seconds() <= 0:
            return None

        user_ids = list(
            {
                user.id if hasattr(user, "id") else user
                for user in users
                if user is not None
            }
        )
        if not user_ids:
            return None

        start_dt = Meeting._normalize_datetime(start_dt)
        end_dt = start_dt + duration

        qs = (
            Meeting.objects.filter(
                status__in=["scheduled", "confirmed", "active"],
                scheduled_at__lt=end_dt,
            )
            .filter(
                models.Q(attendees__user_id__in=user_ids)
                | models.Q(scheduled_by_id__in=user_ids)
            )
            .select_related("meeting_type")
            .prefetch_related("attendees__user")
            .distinct()
        )
        if exclude_meeting_id is not None:
            qs = qs.exclude(id=exclude_meeting_id)

        for meeting in qs:
            meeting_end = meeting.scheduled_at + meeting.duration
            if meeting_end > start_dt:
                return meeting

        return None

    def send_invitation_emails(self):
        """Send email invitations to all attendees"""
        attendees = self.attendees.all()
        attendee_emails = [attendee.user.email for attendee in attendees]

        print(
            f"DEBUG: Sending meeting invitations for meeting {self.id} to {len(attendees)} attendees"
        )
        print(f"DEBUG: Attendee emails: {attendee_emails}")

        subject = f"Meeting Invitation: {self.title}"
        message = f"""
        You have been invited to a meeting:

        Title: {self.title}
        Type: {self.meeting_type.name}
        Date & Time: {self.scheduled_at.strftime("%Y-%m-%d %H:%M")}
        Duration: {self.duration}
        Location: {self.location or "TBD"}

        Notes: {self.notes or "No additional notes"}

        Login and check your calendar for updates.
        """

        # Send emails to all attendees
        for attendee in attendees:
            personal_message = message + f"\n\nYour role: {attendee.role}"
            try:
                if not attendee.user.email:
                    logger.warning(
                        "Skipping invitation email for user %s due to missing email",
                        attendee.user_id,
                    )
                    continue
                print(
                    f"DEBUG: Sending email to {attendee.user.email} for meeting {self.id}"
                )
                send_mail(
                    subject,
                    personal_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [attendee.user.email],
                    fail_silently=False,
                )
                print(f"DEBUG: Email sent successfully to {attendee.user.email}")
            except Exception as e:
                # Log the error but don't break the flow
                print(f"ERROR: Failed to send email to {attendee.user.email}: {e}")
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send email to {attendee.user.email}: {e}")


class MeetingAttendee(models.Model):
    ATTENDEE_ROLE_CHOICES = [
        ("organizer", "Organizer"),
        ("trainer", "Trainer"),
        ("client", "Client"),
        ("sales", "Sales Person"),
    ]

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="attendees"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="meeting_attendances"
    )
    role = models.CharField(max_length=20, choices=ATTENDEE_ROLE_CHOICES)
    is_confirmed = models.BooleanField(default=True)
    joined_at = models.DateTimeField(null=True, blank=True)

    # Video call specific fields
    left_at = models.DateTimeField(null=True, blank=True)
    is_audio_muted = models.BooleanField(default=False)
    is_video_enabled = models.BooleanField(default=True)
    is_currently_joined = models.BooleanField(default=False)
    total_duration = models.DurationField(
        null=True, blank=True
    )  # Total time in meeting

    class Meta:
        unique_together = ["meeting", "user"]

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.meeting.title}"


class MeetingParticipantSession(models.Model):
    """Track individual join/leave sessions for participants"""

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="participant_sessions"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="meeting_sessions"
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    leave_reason = models.CharField(
        max_length=50,
        choices=[
            ("user_left", "User Left"),
            ("connection_lost", "Connection Lost"),
            ("meeting_ended", "Meeting Ended"),
            ("kicked", "Kicked"),
        ],
        null=True,
        blank=True,
    )
    duration = models.DurationField(null=True, blank=True)

    class Meta:
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user.username} session in {self.meeting.title}"


class MeetingEvent(models.Model):
    """Track events that happen during a meeting"""

    EVENT_TYPE_CHOICES = [
        ("meeting_initiated", "Meeting Initiated"),
        ("participant_joined", "Participant Joined"),
        ("participant_left", "Participant Left"),
        ("audio_toggled", "Audio Toggled"),
        ("video_toggled", "Video Toggled"),
        ("spotlight_changed", "Spotlight Changed"),
        ("meeting_ended", "Meeting Ended"),
        ("connection_issue", "Connection Issue"),
    ]

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="meeting_events",
        help_text="User who triggered the event",
    )
    target_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="meeting_events_targeted",
        help_text="User affected by the event (for spotlight, mute, etc.)",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(
        default=dict, blank=True, help_text="Additional event data"
    )

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.event_type} by {self.user.username} in {self.meeting.title}"


class MeetingMediaState(models.Model):
    """Current media state for each participant in a meeting"""

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="media_states"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="meeting_media_states"
    )
    is_audio_muted = models.BooleanField(default=False)
    is_video_enabled = models.BooleanField(default=True)
    is_screen_sharing = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["meeting", "user"]

    def __str__(self):
        return f"Media state for {self.user.username} in {self.meeting.title}"


class MeetingNotes(models.Model):
    """Private notes for each user per meeting"""

    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name="meeting_notes"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="meeting_notes"
    )
    content = models.TextField(blank=True, help_text="HTML content for notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["meeting", "user"]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Notes by {self.user.username} for {self.meeting.title}"


class Appointment(models.Model):
    trainer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="trainer_appointments"
    )
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="client_appointments"
    )
    scheduled_at = models.DateTimeField()
    duration = models.DurationField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("scheduled", "Scheduled"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="scheduled",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment: {self.trainer.username} with {self.client.username}"

    @staticmethod
    def _normalize_datetime(value):
        if timezone.is_naive(value):
            return timezone.make_aware(value, timezone.get_current_timezone())
        return value

    @staticmethod
    def find_conflict(users, start_dt, duration, exclude_appointment_id=None):
        """Return a conflicting appointment if any provided user is busy."""
        if not users or not duration:
            return None

        if duration.total_seconds() <= 0:
            return None

        user_ids = list(
            {
                user.id if hasattr(user, "id") else user
                for user in users
                if user is not None
            }
        )
        if not user_ids:
            return None

        start_dt = Appointment._normalize_datetime(start_dt)
        end_dt = start_dt + duration

        qs = Appointment.objects.filter(
            status="scheduled",
            scheduled_at__lt=end_dt,
        ).filter(models.Q(trainer_id__in=user_ids) | models.Q(client_id__in=user_ids))

        if exclude_appointment_id is not None:
            qs = qs.exclude(id=exclude_appointment_id)

        for appointment in qs.distinct():
            appointment_end = appointment.scheduled_at + appointment.duration
            if appointment_end > start_dt:
                return appointment

        return None


class MeetingMessage(models.Model):
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} in {self.appointment}"
