from rest_framework import serializers
from .models import ChatSession, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatSessionSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "participants",
            "started_at",
            "is_active",
            "last_message",
            "unread_count",
        ]

    def get_participants(self, obj):
        request_user = self.context["request"].user
        participants = obj.participants.exclude(id=request_user.id)
        return [{"id": user.id, "username": user.username} for user in participants]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by("-sent_at").first()
        if last_msg:
            return {
                "message": last_msg.message,
                "sender": last_msg.sender.username,
                "sent_at": last_msg.sent_at.isoformat(),
            }
        return None

    def get_unread_count(self, obj):
        # This would require tracking read status, for now return 0
        return 0


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "message", "sent_at"]

    def get_sender(self, obj):
        return obj.sender.username


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    session_id = serializers.IntegerField()
