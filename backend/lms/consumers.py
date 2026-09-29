import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from scheduling.models import Meeting, MeetingAttendee, MeetingEvent

User = get_user_model()
logger = logging.getLogger(__name__)


class MeetingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for video call signaling"""

    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Get meeting ID from URL route
            self.meeting_id = self.scope["url_route"]["kwargs"]["meeting_id"]
            self.room_group_name = f"meeting_{self.meeting_id}"

            # Get user from query string or headers
            user = self.scope.get("user")
            if not user or user.is_anonymous:
                await self.close(code=4001)
                return

            self.user = user
            self.user_id = str(user.id)

            # Verify user is a participant in this meeting
            is_participant = await self.is_user_participant()
            if not is_participant:
                await self.close(code=4003)  # Forbidden
                return

            # Check if meeting exists and is active
            meeting_status = await self.get_meeting_status()
            if not meeting_status:
                await self.close(code=4004)  # Not Found
                return

            if meeting_status not in ["active", "scheduled"]:
                await self.close(code=4009)  # Conflict - meeting ended
                return

            # Join room group
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

            # Accept WebSocket connection
            await self.accept()

            # Send current meeting state to new client
            await self.send_meeting_state()

            # Broadcast participant joined to others
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "participant_joined",
                    "userId": self.user_id,
                    "userName": self.user.get_full_name() or self.user.username,
                    "joinedAt": timezone.now().isoformat(),
                    "sender_channel": self.channel_name,
                },
            )

            logger.info(f"User {self.user_id} connected to meeting {self.meeting_id}")

        except Exception as e:
            logger.error(f"Error in WebSocket connect: {str(e)}")
            await self.close(code=4500)  # Internal Server Error

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Broadcast participant left to others
            if hasattr(self, "room_group_name") and hasattr(self, "user_id"):
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "participant_left",
                        "userId": self.user_id,
                        "userName": getattr(self.user, "username", "Unknown"),
                        "leftAt": timezone.now().isoformat(),
                        "reason": (
                            "connection_lost" if close_code != 1000 else "user_left"
                        ),
                        "sender_channel": self.channel_name,
                    },
                )

                # Leave room group
                await self.channel_layer.group_discard(
                    self.room_group_name, self.channel_name
                )

            logger.info(
                f"User {getattr(self, 'user_id', 'unknown')} disconnected from meeting {getattr(self, 'meeting_id', 'unknown')} with code {close_code}"
            )

        except Exception as e:
            logger.error(f"Error in WebSocket disconnect: {str(e)}")

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            # Support both "event" and "type" keys for backward compatibility
            event_type = data.get("event") or data.get("type")

            if not event_type:
                await self.send_error("INVALID_EVENT", "Event type is required")
                return

            # Route to appropriate handler
            handler_map = {
                "send_webrtc_offer": self.handle_webrtc_offer,
                "webrtc_offer": self.handle_webrtc_offer,
                "send_webrtc_answer": self.handle_webrtc_answer,
                "webrtc_answer": self.handle_webrtc_answer,
                "ice_candidate": self.handle_ice_candidate,
                "update_media_state": self.handle_media_state_update,
                "set_spotlight": self.handle_set_spotlight,
                "ping": self.handle_ping,
            }

            handler = handler_map.get(event_type)
            if handler:
                # Support both wrapped data ({"data": {...}}) and direct data
                message_data = data.get("data", data)
                # Remove the event/type key from data if it's there
                if "event" in message_data:
                    del message_data["event"]
                if "type" in message_data:
                    del message_data["type"]
                await handler(message_data)
            else:
                await self.send_error(
                    "UNKNOWN_EVENT", f"Unknown event type: {event_type}"
                )

        except json.JSONDecodeError:
            await self.send_error("INVALID_JSON", "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {str(e)}")
            await self.send_error("INTERNAL_ERROR", "Internal server error")

    # WebRTC Signaling Handlers
    async def handle_webrtc_offer(self, data):
        """Handle WebRTC offer"""
        to_user_id = data.get("toUserId")
        sdp = data.get("sdp")

        if not to_user_id or not sdp:
            await self.send_error("INVALID_OFFER", "toUserId and sdp are required")
            return

        # Verify target user is in meeting
        is_target_participant = await self.is_user_participant(to_user_id)
        if not is_target_participant:
            await self.send_error(
                "TARGET_NOT_PARTICIPANT", "Target user is not in this meeting"
            )
            return

        # Send offer to target user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "webrtc_offer",
                "fromUserId": self.user_id,
                "fromUserName": self.user.get_full_name() or self.user.username,
                "toUserId": to_user_id,
                "sdp": sdp,
                "sender_channel": self.channel_name,
            },
        )

    async def handle_webrtc_answer(self, data):
        """Handle WebRTC answer"""
        to_user_id = data.get("toUserId")
        sdp = data.get("sdp")

        if not to_user_id or not sdp:
            await self.send_error("INVALID_ANSWER", "toUserId and sdp are required")
            return

        # Send answer to target user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "webrtc_answer",
                "fromUserId": self.user_id,
                "fromUserName": self.user.get_full_name() or self.user.username,
                "toUserId": to_user_id,
                "sdp": sdp,
                "sender_channel": self.channel_name,
            },
        )

    async def handle_ice_candidate(self, data):
        """Handle ICE candidate"""
        to_user_id = data.get("toUserId")
        candidate = data.get("candidate")
        sdp_mid = data.get("sdpMid")
        sdp_m_line_index = data.get("sdpMLineIndex")

        if not to_user_id or not candidate:
            await self.send_error(
                "INVALID_CANDIDATE", "toUserId and candidate are required"
            )
            return

        # Send ICE candidate to target user
        ice_data = {
            "type": "webrtc_ice_candidate",
            "fromUserId": self.user_id,
            "toUserId": to_user_id,
            "candidate": candidate,
            "sender_channel": self.channel_name,
        }

        # Include optional SDP fields if provided
        if sdp_mid is not None:
            ice_data["sdpMid"] = sdp_mid
        if sdp_m_line_index is not None:
            ice_data["sdpMLineIndex"] = sdp_m_line_index

        await self.channel_layer.group_send(
            self.room_group_name,
            ice_data,
        )

    async def handle_media_state_update(self, data):
        """Handle media state update"""
        audio_muted = data.get("audioMuted")
        video_enabled = data.get("videoEnabled")

        if audio_muted is None and video_enabled is None:
            await self.send_error(
                "INVALID_MEDIA_STATE", "audioMuted or videoEnabled is required"
            )
            return

        # Update media state in database
        await self.update_user_media_state(audio_muted, video_enabled)

        # Broadcast to all participants
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "media_state_changed",
                "userId": self.user_id,
                "userName": self.user.get_full_name() or self.user.username,
                "audioMuted": audio_muted,
                "videoEnabled": video_enabled,
                "timestamp": timezone.now().isoformat(),
                "sender_channel": self.channel_name,
            },
        )

    async def handle_set_spotlight(self, data):
        """Handle spotlight change"""
        spotlight_user_id = data.get("spotlightUserId")

        if not spotlight_user_id:
            await self.send_error("INVALID_SPOTLIGHT", "spotlightUserId is required")
            return

        # Update spotlight in database
        success = await self.update_spotlight(spotlight_user_id)
        if not success:
            await self.send_error("SPOTLIGHT_FAILED", "Failed to update spotlight")
            return

        # Get spotlight user name
        spotlight_user_name = await self.get_user_name(spotlight_user_id)

        # Broadcast to all participants
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "spotlight_changed",
                "spotlightedUserId": spotlight_user_id,
                "spotlightedUserName": spotlight_user_name,
                "changedBy": self.user_id,
                "changedAt": timezone.now().isoformat(),
                "sender_channel": self.channel_name,
            },
        )

    async def handle_ping(self, data):
        """Handle ping for keep-alive"""
        await self.send(
            text_data=json.dumps(
                {"event": "pong", "timestamp": timezone.now().isoformat()}
            )
        )

    # Group message handlers (receive from channel layer)
    async def participant_joined(self, event):
        """Send participant joined event to WebSocket"""
        # Don't send to the sender
        if event.get("sender_channel") != self.channel_name:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "participant_joined",
                        "data": {
                            "userId": event["userId"],
                            "name": event["userName"],
                            "joinedAt": event["joinedAt"],
                        },
                    }
                )
            )

    async def participant_left(self, event):
        """Send participant left event to WebSocket"""
        # Don't send to the sender
        if event.get("sender_channel") != self.channel_name:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "participant_left",
                        "data": {
                            "userId": event["userId"],
                            "name": event["userName"],
                            "leftAt": event["leftAt"],
                            "reason": event["reason"],
                        },
                    }
                )
            )

    async def meeting_ended(self, event):
        """Send meeting ended event to WebSocket"""
        await self.send(
            text_data=json.dumps(
                {
                    "event": "meeting_ended",
                    "data": {
                        "endedBy": event["endedBy"],
                        "endedByName": event["endedByName"],
                        "endedAt": event["endedAt"],
                        "reason": event["reason"],
                    },
                }
            )
        )

    async def webrtc_offer(self, event):
        """Send WebRTC offer to specific user"""
        if event["toUserId"] == self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "webrtc_offer",
                        "data": {
                            "fromUserId": event["fromUserId"],
                            "fromUserName": event["fromUserName"],
                            "toUserId": event["toUserId"],
                            "sdp": event["sdp"],
                        },
                    }
                )
            )

    async def webrtc_answer(self, event):
        """Send WebRTC answer to specific user"""
        if event["toUserId"] == self.user_id:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "webrtc_answer",
                        "data": {
                            "fromUserId": event["fromUserId"],
                            "fromUserName": event["fromUserName"],
                            "toUserId": event["toUserId"],
                            "sdp": event["sdp"],
                        },
                    }
                )
            )

    async def webrtc_ice_candidate(self, event):
        """Send ICE candidate to specific user"""
        if event["toUserId"] == self.user_id:
            ice_data = {
                "fromUserId": event["fromUserId"],
                "toUserId": event["toUserId"],
                "candidate": event["candidate"],
            }

            # Include optional SDP fields if provided
            if "sdpMid" in event:
                ice_data["sdpMid"] = event["sdpMid"]
            if "sdpMLineIndex" in event:
                ice_data["sdpMLineIndex"] = event["sdpMLineIndex"]

            await self.send(
                text_data=json.dumps(
                    {
                        "event": "webrtc_ice_candidate",
                        "data": ice_data,
                    }
                )
            )

    async def media_state_changed(self, event):
        """Send media state change to all users"""
        # Don't send to the sender
        if event.get("sender_channel") != self.channel_name:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "media_state_changed",
                        "data": {
                            "userId": event["userId"],
                            "userName": event["userName"],
                            "audioMuted": event["audioMuted"],
                            "videoEnabled": event["videoEnabled"],
                            "timestamp": event["timestamp"],
                        },
                    }
                )
            )

    async def spotlight_changed(self, event):
        """Send spotlight change to all users"""
        # Don't send to the sender
        if event.get("sender_channel") != self.channel_name:
            await self.send(
                text_data=json.dumps(
                    {
                        "event": "spotlight_changed",
                        "data": {
                            "spotlightedUserId": event["spotlightedUserId"],
                            "spotlightedUserName": event["spotlightedUserName"],
                            "changedBy": event["changedBy"],
                            "changedAt": event["changedAt"],
                        },
                    }
                )
            )

    # Helper methods
    async def send_error(self, error_code, message):
        """Send error message to client"""
        await self.send(
            text_data=json.dumps(
                {
                    "event": "error",
                    "data": {
                        "error": error_code,
                        "message": message,
                        "timestamp": timezone.now().isoformat(),
                    },
                }
            )
        )

    async def send_meeting_state(self):
        """Send current meeting state to client"""
        meeting_state = await self.get_meeting_state()
        if meeting_state:
            await self.send(
                text_data=json.dumps({"event": "meeting_state", "data": meeting_state})
            )

    # Database operations
    @database_sync_to_async
    def is_user_participant(self, user_id=None):
        """Check if user is a participant in the meeting"""
        try:
            target_user_id = user_id or self.user.id
            return MeetingAttendee.objects.filter(
                meeting_id=self.meeting_id, user_id=target_user_id
            ).exists()
        except:
            return False

    @database_sync_to_async
    def get_meeting_status(self):
        """Get meeting status"""
        try:
            meeting = Meeting.objects.get(id=self.meeting_id)
            return meeting.status
        except Meeting.DoesNotExist:
            return None

    @database_sync_to_async
    def get_meeting_state(self):
        """Get current meeting state"""
        try:
            meeting = Meeting.objects.get(id=self.meeting_id)
            participants = []

            for attendee in meeting.attendees.filter(is_currently_joined=True):
                participants.append(
                    {
                        "userId": str(attendee.user.id),
                        "name": attendee.user.get_full_name() or attendee.user.username,
                        "role": attendee.role,
                        "joinedAt": (
                            attendee.joined_at.isoformat()
                            if attendee.joined_at
                            else None
                        ),
                        "isAudioMuted": attendee.is_audio_muted,
                        "isVideoEnabled": attendee.is_video_enabled,
                        "isSpotlighted": meeting.spotlighted_participant
                        == attendee.user,
                    }
                )

            return {
                "meetingId": str(meeting.id),
                "status": meeting.status,
                "participants": participants,
                "spotlightedUserId": (
                    str(meeting.spotlighted_participant.id)
                    if meeting.spotlighted_participant
                    else None
                ),
            }
        except Meeting.DoesNotExist:
            return None

    @database_sync_to_async
    def update_user_media_state(self, audio_muted, video_enabled):
        """Update user's media state"""
        try:
            attendee = MeetingAttendee.objects.get(
                meeting_id=self.meeting_id, user=self.user
            )

            if audio_muted is not None:
                attendee.is_audio_muted = audio_muted
            if video_enabled is not None:
                attendee.is_video_enabled = video_enabled

            attendee.save()
            return True
        except:
            return False

    @database_sync_to_async
    def update_spotlight(self, spotlight_user_id):
        """Update meeting spotlight"""
        try:
            meeting = Meeting.objects.get(id=self.meeting_id)
            spotlight_user = User.objects.get(id=spotlight_user_id)

            # Verify spotlight user is a participant
            if not meeting.attendees.filter(user=spotlight_user).exists():
                return False

            meeting.spotlighted_participant = spotlight_user
            meeting.save()

            # Create event
            MeetingEvent.objects.create(
                meeting=meeting,
                event_type="spotlight_changed",
                user=self.user,
                target_user=spotlight_user,
                metadata={"spotlight_user_id": spotlight_user_id},
            )

            return True
        except:
            return False

    @database_sync_to_async
    def get_user_name(self, user_id):
        """Get user's display name"""
        try:
            user = User.objects.get(id=user_id)
            return user.get_full_name() or user.username
        except:
            return "Unknown User"
