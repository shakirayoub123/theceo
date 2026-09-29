from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Prefetch
from datetime import datetime
from .models import (
    ChatSession,
    ChatMember,
    ChatMessage,
    ChatTypingIndicator,
    ChatAuditLog,
)
from .serializers import (
    ChatSessionSerializer,
    ChatSessionCreateSerializer,
    ChatMemberSerializer,
    ChatMessageSerializer,
    ChatMessageCreateSerializer,
    ChatAuditLogSerializer,
    TypingIndicatorSerializer,
)

User = get_user_model()


class AllChatsView(APIView):
    """List chat sessions the current user participates in"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        members_prefetch = Prefetch(
            "messaging_members",
            queryset=ChatMember.objects.filter(
                status__in=["active", "muted"]
            ).select_related("user"),
        )

        sessions = (
            ChatSession.objects.filter(
                messaging_members__user=request.user,
                messaging_members__status__in=["active", "muted"],
            )
            .prefetch_related(members_prefetch)
            .distinct()
            .order_by("-updated_at")
        )

        session_ids = [session.id for session in sessions]
        last_messages = {}

        if session_ids:
            for message in (
                ChatMessage.objects.filter(session_id__in=session_ids, is_deleted=False)
                .select_related("sender")
                .order_by("session_id", "-created_at")
            ):
                if message.session_id not in last_messages:
                    last_messages[message.session_id] = message

        response_data = []

        for session in sessions:
            participants = []

            for member in session.messaging_members.all():
                user = member.user
                full_name = user.get_full_name() or user.username

                avatar_url = None
                profile = getattr(user, "profile", None)
                if profile and getattr(profile, "profile_picture", None):
                    picture = profile.profile_picture
                    if picture:
                        avatar_url = request.build_absolute_uri(picture.url)

                participants.append(
                    {
                        "id": str(user.id),
                        "name": full_name,
                        "avatar": avatar_url,
                        "is_online": member.is_online,
                    }
                )

            last_message = last_messages.get(session.id)
            if last_message:
                last_message_payload = {
                    "messageId": str(last_message.id),
                    "text": last_message.text,
                    "senderId": str(last_message.sender_id),
                    "senderName": last_message.sender.get_full_name()
                    or last_message.sender.username,
                    "sentAt": last_message.created_at.isoformat(),
                }
            else:
                last_message_payload = None

            response_data.append(
                {
                    "chatId": str(session.id),
                    "title": session.title or None,
                    "participants": participants,
                    "last_message": last_message_payload,
                    "updatedAt": session.updated_at.isoformat(),
                }
            )

        return Response(response_data, status=status.HTTP_200_OK)


class ChatSessionView(APIView):
    """Main chat session endpoint"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Get chat session details"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member of this session
        member = ChatMember.objects.filter(
            session=session, user=request.user, status__in=["active", "muted"]
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this chat session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new chat session (trainer only)"""
        if request.user.role != "trainer":
            return Response(
                {"error": "Only trainers can create chat sessions"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatSessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            session = serializer.save()
            return Response(
                ChatSessionSerializer(session).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatMembersView(APIView):
    """Chat session members management"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Get all members of a chat session"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member
        member = ChatMember.objects.filter(
            session=session, user=request.user, status__in=["active", "muted"]
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this chat session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        members = ChatMember.objects.filter(session=session).select_related("user")
        serializer = ChatMemberSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, session_id):
        """Add a member to the chat session (trainer only)"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if requester is a trainer in this session
        requester_member = ChatMember.objects.filter(
            session=session, user=request.user, role="trainer", status="active"
        ).first()

        if not requester_member:
            return Response(
                {"error": "Only trainers can add members to this session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_id = request.data.get("user_id")
        role = request.data.get("role", "trainer")

        if not user_id:
            return Response(
                {"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is already a member
        existing_member = ChatMember.objects.filter(session=session, user=user).first()
        if existing_member:
            return Response(
                {"error": "User is already a member of this session"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create new member
        member = ChatMember.objects.create(
            session=session, user=user, role=role, is_moderator=(role == "trainer")
        )

        # Log the action
        ChatAuditLog.objects.create(
            session=session,
            actor=request.user,
            action="member_joined",
            target_user=user,
            details={"added_by": str(request.user.id), "role": role},
        )

        serializer = ChatMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatMemberDetailView(APIView):
    """Individual member management"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, session_id, user_id):
        """Update member status/permissions (moderator only)"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if requester is a moderator
        requester_member = ChatMember.objects.filter(
            session=session, user=request.user, is_moderator=True, status="active"
        ).first()

        if not requester_member:
            return Response(
                {"error": "Only moderators can manage members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = get_object_or_404(ChatMember, session=session, user_id=user_id)

        # Update fields
        allowed_fields = ["status", "can_post", "can_attach", "muted_until"]
        for field in allowed_fields:
            if field in request.data:
                setattr(member, field, request.data[field])

        member.save()

        # Log the action
        action_map = {
            "muted": "member_muted",
            "banned": "member_banned",
            "active": (
                "member_unmuted" if member.status == "active" else "member_unbanned"
            ),
        }

        if member.status in action_map:
            ChatAuditLog.objects.create(
                session=session,
                actor=request.user,
                action=action_map[member.status],
                target_user=member.user,
                details=request.data,
            )

        serializer = ChatMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatMessagesView(APIView):
    """Chat messages with pagination"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Get messages for a chat session with pagination"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member
        member = ChatMember.objects.filter(
            session=session, user=request.user, status__in=["active", "muted"]
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this chat session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Pagination parameters
        limit = min(int(request.query_params.get("limit", 50)), 100)  # Max 100
        before = request.query_params.get("before")
        after = request.query_params.get("after")

        # Base queryset
        messages = ChatMessage.objects.filter(
            session=session, is_deleted=False
        ).select_related("sender", "reply_to")

        # Apply pagination
        if before:
            try:
                before_dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
                messages = messages.filter(created_at__lt=before_dt)
            except ValueError:
                return Response(
                    {"error": "Invalid 'before' timestamp format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if after:
            try:
                after_dt = datetime.fromisoformat(after.replace("Z", "+00:00"))
                messages = messages.filter(created_at__gt=after_dt)
            except ValueError:
                return Response(
                    {"error": "Invalid 'after' timestamp format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Order and limit
        messages = messages.order_by("-created_at")[:limit]
        messages = list(reversed(messages))  # Reverse to get chronological order

        # Mark messages as delivered to this user
        for message in messages:
            if message.sender != request.user:
                message.mark_as_delivered(request.user)

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, session_id):
        """Send a message to the chat session"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member and can post
        member = ChatMember.objects.filter(
            session=session,
            user=request.user,
            status__in=["active", "muted"],
            can_post=True,
        ).first()

        if not member:
            return Response(
                {"error": "You cannot post messages in this session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ChatMessageCreateSerializer(
            data=request.data, context={"request": request, "session": session}
        )

        if serializer.is_valid():
            message = serializer.save(session=session, sender=request.user)

            # Mark as delivered to sender
            message.mark_as_delivered(request.user)

            # Broadcast the message via WebSocket
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"messaging_{session_id}",
                {
                    "type": "chat_message",
                    "message": message.text,
                    "sender": message.sender.username,
                    "sent_at": message.created_at.isoformat(),
                    "message_id": str(message.id),
                },
            )

            response_serializer = ChatMessageSerializer(message)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatMessageDetailView(APIView):
    """Individual message management"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, session_id, message_id):
        """Edit a message"""
        session = get_object_or_404(ChatSession, id=session_id)
        message = get_object_or_404(ChatMessage, id=message_id, session=session)

        # Check if user is the sender
        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if message is not too old (e.g., 15 minutes)
        if (timezone.now() - message.created_at).seconds > 900:  # 15 minutes
            return Response(
                {"error": "Messages can only be edited within 15 minutes of sending"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_fields = ["text", "rich_content", "mentions"]
        for field in allowed_fields:
            if field in request.data:
                setattr(message, field, request.data[field])

        message.edited_at = timezone.now()
        message.save()

        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, session_id, message_id):
        """Delete or redact a message"""
        session = get_object_or_404(ChatSession, id=session_id)
        message = get_object_or_404(ChatMessage, id=message_id, session=session)

        mode = request.query_params.get("mode", "delete")

        # Check permissions
        can_moderate = ChatMember.objects.filter(
            session=session, user=request.user, is_moderator=True, status="active"
        ).exists()

        if message.sender != request.user and not can_moderate:
            return Response(
                {"error": "You can only delete your own messages"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if mode == "redact":
            # Redact the message content
            message.text = "[Message redacted by moderator]"
            message.rich_content = None
            message.is_deleted = True
            message.deleted_at = timezone.now()
            message.moderated_by = request.user
        else:
            # Soft delete
            message.is_deleted = True
            message.deleted_at = timezone.now()

        message.save()

        # Log the action
        action = "message_redacted" if mode == "redact" else "message_deleted"
        ChatAuditLog.objects.create(
            session=session,
            actor=request.user,
            action=action,
            target_message=message,
            details={"mode": mode},
        )

        return Response(
            {"message": "Message deleted successfully"}, status=status.HTTP_200_OK
        )


# class FileUploadPrepareView(APIView):
#     """Prepare file upload with presigned URL"""

#     permission_classes = [IsAuthenticated]

#     def post(self, request, session_id):
#         """Prepare file upload"""
#         session = get_object_or_404(ChatSession, id=session_id)

#         # Check if user is a member and can attach files
#         member = ChatMember.objects.filter(
#             session=session,
#             user=request.user,
#             status__in=["active", "muted"],
#             can_attach=True,
#         ).first()

#         if not member:
#             return Response(
#                 {"error": "You cannot upload files in this session"},
#                 status=status.HTTP_403_FORBIDDEN,
#             )

#         if not session.allow_attachments:
#             return Response(
#                 {"error": "File attachments are not allowed in this session"},
#                 status=status.HTTP_403_FORBIDDEN,
#             )

#         serializer = FileUploadPrepareSerializer(
#             data=request.data, context={"session": session}
#         )
#         if serializer.is_valid():
#             # Here you would generate a presigned URL for cloud storage
#             # For now, we'll simulate this
#             file_data = serializer.validated_data

#             # Create attachment record
#             attachment = ChatAttachment.objects.create(
#                 message=None,  # Will be set when message is created
#                 filename=file_data["filename"],
#                 mime_type=file_data["mime_type"],
#                 size_bytes=file_data["size_bytes"],
#                 # In production, generate actual presigned URL
#                 file_url=f"https://storage.example.com/uploads/{uuid.uuid4()}",
#             )

#             return Response(
#                 {
#                     "attachment_id": attachment.id,
#                     "upload_url": attachment.file_url,
#                     "expires_at": (timezone.now() + timedelta(hours=1)).isoformat(),
#                 },
#                 status=status.HTTP_200_OK,
#             )

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TypingIndicatorView(APIView):
    """Handle typing indicators"""

    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        """Update typing status"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member
        member = ChatMember.objects.filter(
            session=session, user=request.user, status__in=["active", "muted"]
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this chat session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TypingIndicatorSerializer(data=request.data)
        if serializer.is_valid():
            is_typing = serializer.validated_data["is_typing"]

            if is_typing:
                # Start typing
                ChatTypingIndicator.objects.get_or_create(
                    session=session, user=request.user
                )
            else:
                # Stop typing
                ChatTypingIndicator.objects.filter(
                    session=session, user=request.user
                ).delete()

            # Update member's last seen
            member.last_seen_at = timezone.now()
            member.save()

            return Response(
                {"message": "Typing status updated"}, status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatSearchView(APIView):
    """Search messages in chat sessions"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Search messages"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a member
        member = ChatMember.objects.filter(
            session=session, user=request.user, status__in=["active", "muted"]
        ).first()

        if not member:
            return Response(
                {"error": "You are not a member of this chat session"},
                status=status.HTTP_403_FORBIDDEN,
            )

        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Date range filtering
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")

        messages = ChatMessage.objects.filter(
            session=session, is_deleted=False, text__icontains=query
        ).select_related("sender")

        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
                messages = messages.filter(created_at__gte=from_dt)
            except ValueError:
                pass

        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
                messages = messages.filter(created_at__lte=to_dt)
            except ValueError:
                pass

        messages = messages.order_by("-created_at")[:50]  # Limit results

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatAuditLogsView(APIView):
    """View audit logs for moderation"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Get audit logs for a session"""
        session = get_object_or_404(ChatSession, id=session_id)

        # Check if user is a moderator
        member = ChatMember.objects.filter(
            session=session, user=request.user, is_moderator=True, status="active"
        ).first()

        if not member:
            return Response(
                {"error": "Only moderators can view audit logs"},
                status=status.HTTP_403_FORBIDDEN,
            )

        logs = (
            ChatAuditLog.objects.filter(session=session)
            .select_related("actor", "target_user", "target_message")
            .order_by("-created_at")[:100]
        )

        serializer = ChatAuditLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
