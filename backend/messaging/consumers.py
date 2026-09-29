import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatSession, ChatMessage, ChatMember
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class MessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket connect method called")
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = f"messaging_{self.session_id}"

        logger.info(f"Attempting to connect to session: {self.session_id}")
        logger.info(f"User in scope: {self.scope.get('user', 'No user')}")

        # Check authentication
        if not self.scope["user"].is_authenticated:
            logger.error("User is not authenticated, closing connection")
            await self.close()
            return

        logger.info(f"User authenticated: {self.scope['user'].username}")

        # Check if user is a member of the session
        if not await self.is_user_member_of_session(
            self.scope["user"], self.session_id
        ):
            logger.error(
                f"User {self.scope['user'].username} is not a member of session {self.session_id}, closing connection"
            )
            await self.close()
            return

        logger.info(
            f"User {self.scope['user'].username} is a valid member of session {self.session_id}"
        )

        # Join room group
        try:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            logger.info(f"Successfully joined room group: {self.room_group_name}")
        except Exception as e:
            logger.error(f"Failed to join room group: {e}")
            await self.close()
            return

        await self.accept()
        logger.info("WebSocket connection accepted")

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnect with code: {close_code}")
        # Leave room group
        try:
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )
            logger.info(f"Successfully left room group: {self.room_group_name}")
        except Exception as e:
            logger.error(f"Error leaving room group: {e}")

    # Receive message from WebSocket
    async def receive(self, text_data):
        logger.info(f"Received WebSocket message: {text_data[:100]}...")
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json["message"]
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Invalid message format: {e}")
            return

        # Save message to database
        try:
            saved_message = await self.save_message(self.scope["user"], message)
            logger.info(f"Message saved with ID: {saved_message.id}")
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            return

        # Send message to room group
        try:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": saved_message.text,
                    "sender": saved_message.sender.username,
                    "sent_at": saved_message.created_at.isoformat(),
                    "message_id": str(saved_message.id),
                },
            )
            logger.info("Message sent to room group")
        except Exception as e:
            logger.error(f"Failed to send message to room group: {e}")

    # Receive message from room group
    async def chat_message(self, event):
        logger.info(f"Received message from room group: {event}")
        message = event["message"]
        sender = event["sender"]
        sent_at = event["sent_at"]
        message_id = event["message_id"]

        # Send message to WebSocket
        try:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": message,
                        "sender": sender,
                        "sent_at": sent_at,
                        "message_id": message_id,
                    }
                )
            )
            logger.info("Message sent to WebSocket client")
        except Exception as e:
            logger.error(f"Failed to send message to WebSocket: {e}")

    @database_sync_to_async
    def save_message(self, user, message):
        logger.info(
            f"Saving message for user {user.username} in session {self.session_id}"
        )
        session = ChatSession.objects.get(id=self.session_id)
        return ChatMessage.objects.create(session=session, sender=user, text=message)

    @database_sync_to_async
    def is_user_member_of_session(self, user, session_id):
        logger.info(
            f"Checking if user {user.username} is member of session {session_id}"
        )
        try:
            session = ChatSession.objects.get(id=session_id)
            is_member = ChatMember.objects.filter(
                session=session, user=user, status="active"
            ).exists()
            logger.info(f"User membership check result: {is_member}")
            return is_member
        except ChatSession.DoesNotExist:
            logger.error(f"Session {session_id} does not exist")
            return False
        except Exception as e:
            logger.error(f"Error checking user membership: {e}")
            return False
