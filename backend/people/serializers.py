from rest_framework import serializers
from .models import Client, Lead, LeadAssessment, LeadAssessmentEntry, ClientNote
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from scheduling.models import Appointment, Meeting, MeetingAttendee, MeetingType
from lms.models import Enrollment, Progress
from messaging.models import ChatSession, ChatMessage

User = get_user_model()


class LeadSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True, source="full_name")
    assigned_sales_name = serializers.CharField(
        source="assigned_sales.get_full_name", read_only=True
    )

    class Meta:
        model = Lead
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "address",
            "job_title",
            "position",
            "industry",
            "requested_meeting_date",
            "requested_meeting_time",
            "meeting_status",
            "approved_meeting_date",
            "approved_meeting_time",
            "access_code",
            "access_code_used",
            "status",
            "assigned_sales",
            "assigned_sales_name",
            "payment_link_sent",
            "payment_link_sent_at",
            "payment_completed",
            "payment_completed_at",
            "stripe_payment_id",
            "notes",
            "last_contacted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "access_code", "created_at", "updated_at"]


class LeadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "address",
            "job_title",
            "position",
            "industry",
            "requested_meeting_date",
            "requested_meeting_time",
        ]
        extra_kwargs = {
            "requested_meeting_date": {"required": False, "allow_null": True},
            "requested_meeting_time": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        if not validated_data.get("requested_meeting_date"):
            validated_data["requested_meeting_date"] = timezone.now().date()
        if not validated_data.get("requested_meeting_time"):
            validated_data["requested_meeting_time"] = (
                timezone.now().time().replace(second=0, microsecond=0)
            )
        lead = super().create(validated_data)
        # Generate access code and send email
        access_code = lead.generate_access_code()
        lead.send_access_code_email()
        return lead


class LeadAssessmentEntrySerializer(serializers.ModelSerializer):
    assessment_name = serializers.CharField(read_only=True, source="assessment_name")
    lead_name = serializers.CharField(source="lead.full_name", read_only=True)

    class Meta:
        model = LeadAssessmentEntry
        fields = [
            "id",
            "lead",
            "lead_name",
            "assessment_id",
            "assessment_name",
            "assessment_data",
            "is_completed",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LeadProgressSerializer(serializers.Serializer):
    assessment_id = serializers.IntegerField()
    assessment_name = serializers.CharField()
    is_completed = serializers.BooleanField()
    progress_percentage = serializers.IntegerField()
    last_updated = serializers.DateTimeField()
    has_data = serializers.BooleanField()


class LeadVerifyCodeSerializer(serializers.Serializer):
    access_code = serializers.CharField(max_length=10, required=True)


class LeadSaveProgressSerializer(serializers.Serializer):
    assessment_data = serializers.JSONField(required=True)


class LeadAssessmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadAssessment
        fields = ["assessment_data"]

    def create(self, validated_data):
        # Get lead from context (passed from view)
        lead = self.context["lead"]
        validated_data["lead"] = lead
        return super().create(validated_data)


class ClientSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField(source="user.id")
    clientName = serializers.CharField(source="full_name")
    meetingStatus = serializers.CharField(source="meeting_status")
    programStatus = serializers.CharField(source="program_status")
    contractStatus = serializers.CharField(source="contract_status")
    salesInfluencer = serializers.CharField(source="assigned_sales", read_only=True)

    class Meta:
        model = Client
        fields = [
            "uuid",
            "clientName",
            "meetingStatus",
            "programStatus",
            "contractStatus",
            "salesInfluencer",
        ]


class SalesClientsResponseSerializer(serializers.Serializer):
    callsPending = serializers.IntegerField()
    callsScheduled = serializers.IntegerField()
    awaitingPurchase = serializers.IntegerField()
    clients = ClientSerializer(many=True)


class SalesCreateClientSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    job_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    position = serializers.CharField(max_length=255, required=False, allow_blank=True)
    industry = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.strip().lower()


class ClientDetailSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField(source="user.id")
    clientName = serializers.CharField(source="full_name")
    email = serializers.EmailField()
    phone = serializers.CharField()
    meetingStatus = serializers.CharField(source="meeting_status")
    programStatus = serializers.CharField(source="program_status")
    contractStatus = serializers.CharField(source="contract_status")
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Client
        fields = [
            "uuid",
            "clientName",
            "email",
            "phone",
            "meetingStatus",
            "programStatus",
            "contractStatus",
            "createdAt",
        ]


class MeetingSerializer(serializers.ModelSerializer):
    meetingId = serializers.UUIDField(source="id")
    scheduledAt = serializers.DateTimeField(source="scheduled_at")
    duration = serializers.CharField()
    status = serializers.CharField()
    notes = serializers.CharField()

    class Meta:
        model = Appointment
        fields = ["meetingId", "scheduledAt", "duration", "status", "notes"]


class ServiceEnrollmentSerializer(serializers.ModelSerializer):
    serviceId = serializers.UUIDField(source="service.id")
    serviceName = serializers.CharField(source="service.title")
    enrolledAt = serializers.DateTimeField(source="enrolled_at")
    completed = serializers.BooleanField()

    class Meta:
        model = Enrollment
        fields = ["serviceId", "serviceName", "enrolledAt", "completed"]


class SalesClientDetailResponseSerializer(serializers.Serializer):
    clientDetails = ClientDetailSerializer()
    meetings = MeetingSerializer(many=True)
    servicesEnrolled = ServiceEnrollmentSerializer(many=True)


class ExistingClientsResponseSerializer(serializers.Serializer):
    totalPending = serializers.IntegerField()
    awaitingPurchase = serializers.IntegerField()
    clients = ClientSerializer(many=True)


class TrainerClientSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    name = serializers.CharField()
    status = serializers.CharField()


class TrainerClientsResponseSerializer(serializers.Serializer):
    clientsAssigned = serializers.IntegerField()
    clientsMeetingsToday = serializers.IntegerField()
    clients = TrainerClientSerializer(many=True)


# Client Dashboard API Serializers


class ClientProfileSerializer(serializers.ModelSerializer):
    """Serializer for client profile data"""

    clientId = serializers.UUIDField(source="user.id", read_only=True)
    name = serializers.CharField(source="full_name", read_only=True)
    email = serializers.EmailField(read_only=True)
    joinedOn = serializers.DateTimeField(source="joined_on", read_only=True)
    referredBy = serializers.CharField(source="referred_by", read_only=True)
    country = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    jobTitle = serializers.CharField(source="job_title", read_only=True)
    position = serializers.CharField(read_only=True)
    industry = serializers.CharField(read_only=True)

    class Meta:
        model = Client
        fields = [
            "clientId",
            "name",
            "email",
            "joinedOn",
            "referredBy",
            "country",
            "address",
            "jobTitle",
            "position",
            "industry",
        ]
        read_only_fields = ["clientId", "name", "email", "joinedOn"]


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating client profile data"""

    referredBy = serializers.CharField(
        source="referred_by", required=False, allow_blank=True
    )
    country = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    jobTitle = serializers.CharField(source="job_title", required=False, allow_blank=True)
    position = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Client
        fields = ["referredBy", "country", "address", "jobTitle", "position", "industry"]


class ClientMeetingSerializer(serializers.ModelSerializer):
    """Serializer for client meetings"""

    meetingId = serializers.UUIDField(source="id", read_only=True)
    title = serializers.CharField(read_only=True)
    scheduledAt = serializers.DateTimeField(source="scheduled_at", read_only=True)
    duration = serializers.DurationField(read_only=True)
    status = serializers.CharField(read_only=True)
    trainerName = serializers.SerializerMethodField()
    notes = serializers.CharField(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            "meetingId",
            "title",
            "scheduledAt",
            "duration",
            "status",
            "trainerName",
            "notes",
        ]

    def get_trainerName(self, obj):
        trainer_attendee = obj.attendees.filter(role="trainer").select_related("user").first()
        if not trainer_attendee:
            return ""
        return trainer_attendee.user.get_full_name() or trainer_attendee.user.username


class ClientMeetingCreateSerializer(serializers.Serializer):
    """Serializer for creating client meetings"""

    title = serializers.CharField(max_length=200, required=True)
    scheduledAt = serializers.DateTimeField(required=True)
    duration = serializers.DurationField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    trainerId = serializers.UUIDField(required=True)

    def validate_trainerId(self, value):
        try:
            trainer = User.objects.get(id=value, role="trainer")
            return trainer
        except User.DoesNotExist:
            raise serializers.ValidationError("Trainer not found or invalid.")

    def create(self, validated_data):
        trainer = validated_data.pop("trainerId")
        client = self.context["client"]
        scheduler = self.context["request"].user
        scheduled_at = validated_data["scheduledAt"]
        duration = validated_data["duration"]

        if timezone.is_naive(scheduled_at):
            scheduled_at = timezone.make_aware(
                scheduled_at, timezone.get_current_timezone()
            )

        if duration.total_seconds() <= 0:
            raise serializers.ValidationError({"duration": "Duration must be positive."})

        participants = [scheduler, trainer, client.user]

        meeting_type, _ = MeetingType.objects.get_or_create(
            name="Client Advisory Meeting",
            defaults={
                "description": "Advisor session scheduled for a client",
                "requires_trainers": True,
                "allows_multiple_trainers": False,
            },
        )

        with transaction.atomic():
            Meeting.lock_users_for_scheduling(participants)

            conflict = Meeting.find_conflict(
                users=participants,
                start_dt=scheduled_at,
                duration=duration,
            )
            if conflict:
                raise serializers.ValidationError(
                    {
                        "scheduledAt": "Selected time conflicts with an existing meeting."
                    }
                )

            appointment_conflict = Appointment.find_conflict(
                users=participants,
                start_dt=scheduled_at,
                duration=duration,
            )
            if appointment_conflict:
                raise serializers.ValidationError(
                    {
                        "scheduledAt": "Selected time conflicts with an existing appointment."
                    }
                )

            # Create meeting
            meeting = Meeting.objects.create(
                title=validated_data["title"],
                meeting_type=meeting_type,
                scheduled_at=scheduled_at,
                duration=duration,
                notes=validated_data.get("notes", ""),
                scheduled_by=scheduler,
                status="scheduled",
                location=validated_data.get("location", "Online"),
            )

            # Add attendees
            MeetingAttendee.objects.bulk_create(
                [
                    MeetingAttendee(meeting=meeting, user=scheduler, role="organizer"),
                    MeetingAttendee(meeting=meeting, user=trainer, role="trainer"),
                    MeetingAttendee(meeting=meeting, user=client.user, role="client"),
                ]
            )

        try:
            meeting.send_invitation_emails()
        except Exception:
            # Keep meeting creation resilient if email backend is temporarily unavailable.
            pass

        return meeting


class ClientProgramSerializer(serializers.ModelSerializer):
    """Serializer for client programs/enrollments"""

    id = serializers.UUIDField(source="service.id", read_only=True)
    name = serializers.CharField(source="service.title", read_only=True)
    joinedOn = serializers.DateTimeField(source="enrolled_at", read_only=True)
    price = serializers.DecimalField(
        source="service.price", max_digits=10, decimal_places=2, read_only=True
    )
    status = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ["id", "name", "joinedOn", "price", "status"]

    def get_status(self, obj):
        return "completed" if obj.completed else "in_progress"


class ClientProgramsResponseSerializer(serializers.Serializer):
    """Response serializer for client programs with total cost"""

    programs = ClientProgramSerializer(many=True)
    totalCost = serializers.SerializerMethodField()

    def get_totalCost(self, obj):
        enrollments = obj.get("enrollments", [])
        return sum(
            enrollment.service.price
            for enrollment in enrollments
            if hasattr(enrollment, "service")
        )


class ClientNoteSerializer(serializers.ModelSerializer):
    """Serializer for client notes"""

    noteId = serializers.UUIDField(source="id", read_only=True)
    title = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    category = serializers.CharField(read_only=True)
    isPinned = serializers.BooleanField(source="is_pinned", read_only=True)
    advisorName = serializers.CharField(source="advisor.get_full_name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    version = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClientNote
        fields = [
            "noteId",
            "title",
            "content",
            "category",
            "isPinned",
            "advisorName",
            "createdAt",
            "updatedAt",
            "version",
        ]


class ClientNoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating client notes"""

    title = serializers.CharField(max_length=200, required=True)
    content = serializers.CharField(required=True)
    category = serializers.CharField(max_length=50, required=False, allow_blank=True)
    isPinned = serializers.BooleanField(default=False)

    class Meta:
        model = ClientNote
        fields = ["title", "content", "category", "isPinned"]

    def create(self, validated_data):
        validated_data["client"] = self.context["client"]
        validated_data["advisor"] = self.context["request"].user
        return super().create(validated_data)


class ClientNoteUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating client notes"""

    title = serializers.CharField(max_length=200, required=False)
    content = serializers.CharField(required=False)
    category = serializers.CharField(max_length=50, required=False, allow_blank=True)
    isPinned = serializers.BooleanField(required=False)

    class Meta:
        model = ClientNote
        fields = ["title", "content", "category", "isPinned"]

    def update(self, instance, validated_data):
        # Create new version if content changed
        if (
            "content" in validated_data
            and validated_data["content"] != instance.content
        ):
            new_note = instance.create_new_version(
                new_content=validated_data["content"],
                new_title=validated_data.get("title", instance.title),
            )
            # Update other fields on the new version
            for field in ["category", "is_pinned"]:
                if field in validated_data:
                    setattr(new_note, field, validated_data[field])
            new_note.save()
            return new_note
        else:
            return super().update(instance, validated_data)


class ClientProgressSerializer(serializers.ModelSerializer):
    """Serializer for client progress per chapter"""

    chapterId = serializers.UUIDField(source="chapter.id", read_only=True)
    title = serializers.CharField(source="chapter.title", read_only=True)
    completionPercent = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source="completed_at", read_only=True)

    class Meta:
        model = Progress
        fields = ["chapterId", "title", "completionPercent", "updatedAt"]

    def get_completionPercent(self, obj):
        return 100 if obj.completed else 0


class ClientChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for client chat sessions"""

    sessionId = serializers.UUIDField(source="id", read_only=True)
    title = serializers.CharField(read_only=True)
    trainerName = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    lastMessageAt = serializers.DateTimeField(read_only=True)
    unreadCount = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            "sessionId",
            "title",
            "trainerName",
            "isActive",
            "lastMessageAt",
            "unreadCount",
        ]

    def get_unreadCount(self, obj):
        user = self.context["request"].user
        membership = obj.members.filter(user=user).first()
        if not membership:
            return 0

        # Count unread messages (messages after last seen)
        if membership.last_seen_at:
            return obj.messages.filter(created_at__gt=membership.last_seen_at).count()
        return obj.messages.count()


class ClientChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for client chat messages"""

    messageId = serializers.UUIDField(source="id", read_only=True)
    senderName = serializers.CharField(source="sender.get_full_name", read_only=True)
    senderRole = serializers.CharField(source="sender.role", read_only=True)
    text = serializers.CharField(read_only=True)
    richContent = serializers.JSONField(source="rich_content", read_only=True)
    attachments = serializers.JSONField(read_only=True)
    replyTo = serializers.UUIDField(source="reply_to.id", read_only=True)
    isAnnouncement = serializers.BooleanField(source="is_announcement", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isRead = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "messageId",
            "senderName",
            "senderRole",
            "text",
            "richContent",
            "attachments",
            "replyTo",
            "isAnnouncement",
            "createdAt",
            "isRead",
        ]

    def get_isRead(self, obj):
        user = self.context["request"].user
        return str(user.id) in obj.read_by


class ClientServicesSerializer(serializers.Serializer):
    """Serializer for client services/programs"""

    name = serializers.CharField(source="service.title")
    enrolledOn = serializers.DateTimeField(source="enrolled_at")
    status = serializers.SerializerMethodField()
    trainersAssigned = serializers.SerializerMethodField()

    def get_status(self, obj):
        """Get program status based on enrollment and service status"""
        if obj.completed:
            return "completed"
        elif obj.service.status == "active":
            return "active"
        else:
            return "paused"

    def get_trainersAssigned(self, obj):
        """Get list of trainers assigned to this service"""
        trainers = []

        # Add main trainer
        if obj.service.trainer:
            trainers.append(obj.service.trainer.get_full_name())

        # Add advisors
        for advisor in obj.service.advisors.all():
            advisor_name = advisor.get_full_name()
            if advisor_name not in trainers:  # Avoid duplicates
                trainers.append(advisor_name)

        return trainers


class ClientChatMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating client chat messages"""

    text = serializers.CharField(required=False, allow_blank=True)
    richContent = serializers.JSONField(required=False)
    replyTo = serializers.UUIDField(required=False)
    idempotencyKey = serializers.CharField(max_length=100, required=False)

    class Meta:
        model = ChatMessage
        fields = ["text", "richContent", "replyTo", "idempotencyKey"]

    def validate_replyTo(self, value):
        if value:
            try:
                reply_message = ChatMessage.objects.get(id=value)
                return reply_message
            except ChatMessage.DoesNotExist:
                raise serializers.ValidationError("Reply message not found.")
        return None

    def create(self, validated_data):
        session = self.context["session"]
        user = self.context["request"].user

        # Check idempotency
        idempotency_key = validated_data.get("idempotencyKey")
        if idempotency_key:
            existing = ChatMessage.objects.filter(
                session=session, sender=user, idempotency_key=idempotency_key
            ).first()
            if existing:
                return existing

        validated_data["session"] = session
        validated_data["sender"] = user

        # Remove fields not in model
        validated_data.pop("idempotencyKey", None)

        return super().create(validated_data)
