from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Meeting, MeetingType, MeetingAttendee, Availability

User = get_user_model()


class TrainerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "full_name", "email"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class MeetingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingType
        fields = [
            "id",
            "name",
            "description",
            "requires_trainers",
            "allows_multiple_trainers",
        ]


class AvailableSlotSerializer(serializers.Serializer):
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    trainer_ids = serializers.ListField(child=serializers.IntegerField())


class MeetingAttendeeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = MeetingAttendee
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "role",
            "is_confirmed",
            "joined_at",
        ]


class MeetingSerializer(serializers.ModelSerializer):
    meeting_type_name = serializers.CharField(
        source="meeting_type.name", read_only=True
    )
    scheduled_by_name = serializers.CharField(
        source="scheduled_by.get_full_name", read_only=True
    )

    class Meta:
        model = Meeting
        fields = [
            "id",
            "title",
            "meeting_type",
            "meeting_type_name",
            "scheduled_by",
            "scheduled_by_name",
            "scheduled_at",
            "duration",
            "status",
            "notes",
            "location",
            "created_at",
            "updated_at",
        ]


class MeetingDetailSerializer(serializers.ModelSerializer):
    meeting_type_name = serializers.CharField(
        source="meeting_type.name", read_only=True
    )
    scheduled_by_name = serializers.CharField(
        source="scheduled_by.get_full_name", read_only=True
    )
    attendees = MeetingAttendeeSerializer(many=True, read_only=True)
    user_notes = serializers.SerializerMethodField()

    def get_user_notes(self, obj):
        """Get the current user's notes for this meeting"""
        request = self.context.get('request')
        if request and request.user:
            try:
                from scheduling.models import MeetingNotes
                note = MeetingNotes.objects.get(user=request.user, meeting=obj)
                return note.content
            except MeetingNotes.DoesNotExist:
                return ""
        return ""

    class Meta:
        model = Meeting
        fields = [
            "id",
            "title",
            "meeting_type",
            "meeting_type_name",
            "scheduled_by",
            "scheduled_by_name",
            "scheduled_at",
            "duration",
            "status",
            "notes",
            "location",
            "attendees",
            "user_notes",
            "created_at",
            "updated_at",
        ]


class AvailabilitySerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source="trainer.get_full_name", read_only=True)

    class Meta:
        model = Availability
        fields = [
            "id",
            "trainer",
            "trainer_name",
            "day_of_week",
            "start_time",
            "end_time",
        ]
