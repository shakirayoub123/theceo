from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model"""

    class Meta:
        model = Notification
        fields = [
            "id",
            "message",
            "time",
            "is_read",
            "type",
            "created_at",
            "related_id",
        ]
        read_only_fields = ["id", "created_at"]


class NotificationCountSerializer(serializers.Serializer):
    """Serializer for notification count endpoint"""

    count = serializers.IntegerField()


class EmailSerializer(serializers.Serializer):
    """Serializer for email sending payload"""

    subject = serializers.CharField(max_length=255)
    body = serializers.CharField()
    subscriber_email = serializers.EmailField(required=False, allow_null=True)


class ContactFormSerializer(serializers.Serializer):
    """Serializer for public contact form submissions."""

    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    message = serializers.CharField(max_length=5000)
