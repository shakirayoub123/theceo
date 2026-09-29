from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage, AIChatSession, AIChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
)
import logging

User = get_user_model()

logger = logging.getLogger(__name__)


class GetChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get all chat sessions for this user
        chat_sessions = ChatSession.objects.filter(
            participants=request.user, is_active=True
        ).prefetch_related("participants", "messages")

        serializer = ChatSessionSerializer(
            chat_sessions, many=True, context={"request": request}
        )
        return Response(serializer.data)


class GetChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_uuid, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the chat session
        chat_session = get_object_or_404(
            ChatSession, id=chat_uuid, participants=request.user, is_active=True
        )

        # Get the other participant
        other_participant = chat_session.participants.exclude(
            id=request.user.id
        ).first()
        if not other_participant:
            return Response(
                {"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get messages
        messages = ChatMessage.objects.filter(session=chat_session).order_by("sent_at")
        message_serializer = ChatMessageSerializer(messages, many=True)

        return Response(
            {"user": other_participant.username, "messages": message_serializer.data}
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data["session_id"]
            message_text = serializer.validated_data["message"]

            # Verify user is participant in the session
            chat_session = get_object_or_404(
                ChatSession, id=session_id, participants=request.user, is_active=True
            )

            # Create the message
            message = ChatMessage.objects.create(
                session=chat_session, sender=request.user, message=message_text
            )

            # Return the created message
            message_serializer = ChatMessageSerializer(message)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("other_user_id")
        if not other_user_id:
            return Response(
                {"error": "other_user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if chat session already exists
        existing_session = (
            ChatSession.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if existing_session:
            return Response(
                {
                    "message": "Chat session already exists",
                    "session_id": existing_session.id,
                }
            )

        # Create new chat session
        chat_session = ChatSession.objects.create()
        chat_session.participants.add(request.user, other_user)

        return Response(
            {"message": "Chat session created", "session_id": chat_session.id},
            status=status.HTTP_201_CREATED,
        )


class StartAIChatView(APIView):
    permission_classes = [AllowAny]  # Allow public access

    def post(self, request):
        logger.info(
            f"StartAIChatView called - User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
        session_name = request.data.get("session_name", "")
        is_public = request.data.get("is_public", False)

        user = request.user if request.user.is_authenticated else None

        try:
            # Create new AI chat session
            ai_chat_session = AIChatSession.objects.create(
                user=user, session_name=session_name, is_public=is_public
            )
            logger.info(
                f"AI Chat session created - ID: {ai_chat_session.id}, User: {user}"
            )
            return Response(
                {
                    "message": "AI Chat session created",
                    "session_id": ai_chat_session.id,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Error creating AI chat session - Error: {e}")
            return Response(
                {"error": "Failed to create chat session"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetAIChatMessagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, chat_uuid):
        logger.info(
            f"GetAIChatMessagesView called - Chat UUID: {chat_uuid}, User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
        try:
            # Get the AI chat session
            ai_chat_session = get_object_or_404(
                AIChatSession, id=chat_uuid, is_active=True
            )

            # Get messages
            messages = AIChatMessage.objects.filter(session=ai_chat_session).order_by(
                "sent_at"
            )

            # Serialize messages
            message_data = []
            for message in messages:
                message_data.append(
                    {
                        "id": message.id,
                        "sender_type": message.sender_type,
                        "sender": message.sender.username
                        if message.sender
                        else "Anonymous"
                        if message.sender_type == "user"
                        else "AI",
                        "message": message.message,
                        "sent_at": message.sent_at.isoformat(),
                    }
                )

            logger.info(f"Retrieved {len(message_data)} messages for chat {chat_uuid}")
            return Response({"messages": message_data})
        except AIChatSession.DoesNotExist:
            logger.warning(f"AI Chat session not found - UUID: {chat_uuid}")
            return Response(
                {"error": "Chat session not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(
                f"Error retrieving AI chat messages - Chat UUID: {chat_uuid}, Error: {e}"
            )
            return Response(
                {"error": "Failed to retrieve messages"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get all chat sessions for this user
        chat_sessions = ChatSession.objects.filter(
            participants=request.user, is_active=True
        ).prefetch_related("participants", "messages")

        serializer = ChatSessionSerializer(
            chat_sessions, many=True, context={"request": request}
        )
        return Response(serializer.data)


class GetChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, chat_uuid, user_uuid):
        # Verify the requesting user
        if str(request.user.id) != user_uuid:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # Get the chat session
        chat_session = get_object_or_404(
            ChatSession, id=chat_uuid, participants=request.user, is_active=True
        )

        # Get the other participant
        other_participant = chat_session.participants.exclude(
            id=request.user.id
        ).first()
        if not other_participant:
            return Response(
                {"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get messages
        messages = ChatMessage.objects.filter(session=chat_session).order_by("sent_at")
        message_serializer = ChatMessageSerializer(messages, many=True)

        return Response(
            {"user": other_participant.username, "messages": message_serializer.data}
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data["session_id"]
            message_text = serializer.validated_data["message"]

            # Verify user is participant in the session
            chat_session = get_object_or_404(
                ChatSession, id=session_id, participants=request.user, is_active=True
            )

            # Create the message
            message = ChatMessage.objects.create(
                session=chat_session, sender=request.user, message=message_text
            )

            # Return the created message
            message_serializer = ChatMessageSerializer(message)
            return Response(message_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("other_user_id")
        if not other_user_id:
            return Response(
                {"error": "other_user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if chat session already exists
        existing_session = (
            ChatSession.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if existing_session:
            return Response(
                {
                    "message": "Chat session already exists",
                    "session_id": existing_session.id,
                }
            )

        # Create new chat session
        chat_session = ChatSession.objects.create()
        chat_session.participants.add(request.user, other_user)

        return Response(
            {"message": "Chat session created", "session_id": chat_session.id},
            status=status.HTTP_201_CREATED,
        )
