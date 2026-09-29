from .models import ChatSession, ChatMember, ChatMessage, ChatAuditLog
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class ChatMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = ChatMember
        fields = [
            "user_id",
            "user_name",
            "user_email",
            "role",
            "status",
            "can_post",
            "can_attach",
            "is_moderator",
            "is_online",
            "last_seen_at",
            "joined_at",
            "muted_until",
        ]
        read_only_fields = [
            "user_id",
            "user_name",
            "user_email",
            "is_online",
            "joined_at",
        ]


# class ChatAttachmentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ChatAttachment
#         fields = [
#             "id",
#             "filename",
#             "mime_type",
#             "size_bytes",
#             "file_url",
#             "blob_ref",
#             "is_safe",
#             "uploaded_at",
#         ]
#         read_only_fields = ["id", "uploaded_at", "is_safe"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)
    reply_to_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "session",
            "sender",
            "sender_name",
            "sender_role",
            "text",
            "rich_content",
            "reply_to",
            "reply_to_message",
            "mentions",
            "is_deleted",
            "deleted_at",
            "edited_at",
            "delivered_to",
            "read_by",
            "is_announcement",
            "message_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "session",
            "sender",
            "sender_name",
            "sender_role",
            "is_deleted",
            "deleted_at",
            "edited_at",
            "created_at",
            "updated_at",
        ]

    def get_reply_to_message(self, obj):
        if obj.reply_to:
            return {
                "id": obj.reply_to.id,
                "text": (
                    obj.reply_to.text[:100] + "..."
                    if len(obj.reply_to.text) > 100
                    else obj.reply_to.text
                ),
                "sender_name": obj.reply_to.sender.get_full_name(),
            }
        return None


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    idempotency_key = serializers.CharField(max_length=100, required=False)

    class Meta:
        model = ChatMessage
        fields = [
            "text",
            "rich_content",
            "reply_to",
            "mentions",
            "is_announcement",
            "message_type",
            "idempotency_key",
        ]

    def validate(self, data):
        # Check if announcement_only mode is enabled
        session = self.context.get("session")
        if session and session.announcement_only:
            user = self.context.get("request").user
            if user.role != "trainer":
                raise serializers.ValidationError(
                    "This session is in announcement-only mode. Only trainers can post messages."
                )

        # Validate idempotency key to prevent duplicates
        idempotency_key = data.get("idempotency_key")
        if idempotency_key:
            existing = ChatMessage.objects.filter(
                session=session,
                sender=self.context.get("request").user,
                idempotency_key=idempotency_key,
            ).exists()
            if existing:
                raise serializers.ValidationError("Duplicate message detected.")

        return data


class ChatSessionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.get_full_name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    member_count = serializers.IntegerField(read_only=True)
    trainer_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "description",
            "client",
            "client_name",
            "created_by",
            "created_by_name",
            "is_active",
            "announcement_only",
            "max_members",
            "retention_days",
            "allow_attachments",
            "max_attachment_size_mb",
            "member_count",
            "trainer_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "client_name",
            "created_by_name",
            "member_count",
            "trainer_count",
            "created_at",
            "updated_at",
        ]


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = [
            "title",
            "description",
            "client",
            "announcement_only",
            "retention_days",
            "allow_attachments",
            "max_attachment_size_mb",
        ]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        session = super().create(validated_data)

        # Auto-add the client as a member
        ChatMember.objects.create(session=session, user=session.client, role="client")

        # Auto-add the creator (trainer) as a member
        ChatMember.objects.create(
            session=session, user=session.created_by, role="trainer", is_moderator=True
        )

        return session


class ChatAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.get_full_name", read_only=True)
    target_user_name = serializers.SerializerMethodField()
    target_message_text = serializers.SerializerMethodField()

    class Meta:
        model = ChatAuditLog
        fields = [
            "id",
            "session",
            "actor",
            "actor_name",
            "action",
            "target_user",
            "target_user_name",
            "target_message",
            "target_message_text",
            "details",
            "ip_address",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "actor_name",
            "target_user_name",
            "target_message_text",
            "created_at",
        ]

    def get_target_user_name(self, obj):
        return obj.target_user.get_full_name() if obj.target_user else None

    def get_target_message_text(self, obj):
        return (
            obj.target_message.text[:100] + "..."
            if obj.target_message and obj.target_message.text
            else None
        )


# class FileUploadPrepareSerializer(serializers.Serializer):
#     filename = serializers.CharField(max_length=255)
#     mime_type = serializers.CharField(max_length=100)
#     size_bytes = serializers.IntegerField(min_value=1)

#     def validate_size_bytes(self, value):
#         session = self.context.get("session")
#         if session:
#             max_size_bytes = session.max_attachment_size_mb * 1024 * 1024
#             if value > max_size_bytes:
#                 raise serializers.ValidationError(
#                     f"File size exceeds maximum allowed size of {session.max_attachment_size_mb}MB"
#                 )
#         return value


class TypingIndicatorSerializer(serializers.Serializer):
    is_typing = serializers.BooleanField()
