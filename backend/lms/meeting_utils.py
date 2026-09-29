from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from scheduling.models import (
    MeetingEvent,
    MeetingParticipantSession,
)
from comms.models import Notification
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class MeetingUtils:
    """Utility functions for video call meetings"""

    @staticmethod
    def send_meeting_notifications(meeting, action, actor_user=None):
        """
        Send notifications and emails for meeting events

        Args:
            meeting: Meeting instance
            action: 'initiated', 'ended', 'joined', 'left'
            actor_user: User who performed the action
        """
        attendees = meeting.attendees.all()

        for attendee in attendees:
            # Skip sending notification to the actor
            if actor_user and attendee.user == actor_user:
                continue

            # Create notification message based on action
            if action == "initiated":
                title = f"Meeting Started: {meeting.title}"
                message = f"The meeting '{meeting.title}' has been started and is ready to join."
                email_subject = title
                email_body = f"""
The meeting '{meeting.title}' has been started.

Meeting Details:
- Title: {meeting.title}
- Started At: {meeting.initiated_at.strftime("%Y-%m-%d %H:%M") if meeting.initiated_at else "N/A"}
- Duration: {meeting.duration}

You can join the meeting from your dashboard.
"""
            elif action == "ended":
                title = f"Meeting Ended: {meeting.title}"
                message = f"The meeting '{meeting.title}' has ended."
                email_subject = title
                email_body = f"""
The meeting '{meeting.title}' has ended.

Meeting Details:
- Ended At: {meeting.ended_at.strftime("%Y-%m-%d %H:%M") if meeting.ended_at else "N/A"}
- Duration: {meeting.duration}

Thank you for participating.
"""
            elif action == "joined":
                actor_name = (
                    actor_user.get_full_name() or actor_user.username
                    if actor_user
                    else "Someone"
                )
                title = f"Participant Joined: {meeting.title}"
                message = f"{actor_name} has joined the meeting '{meeting.title}'."
                email_subject = title
                email_body = f"""
{actor_name} has joined the meeting '{meeting.title}'.

You can join the meeting from your dashboard if you haven't already.
"""
            elif action == "left":
                actor_name = (
                    actor_user.get_full_name() or actor_user.username
                    if actor_user
                    else "Someone"
                )
                title = f"Participant Left: {meeting.title}"
                message = f"{actor_name} has left the meeting '{meeting.title}'."
                # Don't send email for leaving
                email_subject = None
                email_body = None
            else:
                continue  # Unknown action

            # Create in-app notification
            try:
                Notification.objects.create(
                    user=attendee.user,
                    title=title,
                    message=message,
                    type="meeting",
                    related_id=meeting.id,
                )
            except Exception as e:
                logger.error(
                    f"Failed to create notification for {attendee.user.email}: {e}"
                )

            # Send email notification (except for 'left' action)
            if email_subject and email_body:
                try:
                    send_mail(
                        email_subject,
                        email_body,
                        settings.DEFAULT_FROM_EMAIL,
                        [attendee.user.email],
                        fail_silently=True,
                    )
                except Exception as e:
                    logger.error(f"Failed to send email to {attendee.user.email}: {e}")

    @staticmethod
    @transaction.atomic
    def handle_participant_join(meeting, user, media_preferences=None):
        """
        Handle participant joining a meeting

        Args:
            meeting: Meeting instance
            user: User instance
            media_preferences: Dict with audioEnabled, videoEnabled

        Returns:
            tuple: (success: bool, error_message: str, attendee: MeetingAttendee)
        """
        try:
            # Get attendee record
            attendee = meeting.attendees.filter(user=user).first()
            if not attendee:
                return False, "User is not a participant in this meeting", None

            # Check if already joined
            if attendee.is_currently_joined:
                return False, "User has already joined this meeting", attendee

            # Join the meeting
            now = timezone.now()
            attendee.joined_at = now
            attendee.is_currently_joined = True

            # Set media preferences
            if media_preferences:
                attendee.is_audio_muted = not media_preferences.get(
                    "audioEnabled", True
                )
                attendee.is_video_enabled = media_preferences.get("videoEnabled", True)

            attendee.save()

            # Create participant session
            MeetingParticipantSession.objects.create(
                meeting=meeting, user=user, joined_at=now
            )

            # Create join event
            MeetingEvent.objects.create(
                meeting=meeting,
                event_type="participant_joined",
                user=user,
                metadata={"joined_at": now.isoformat()},
            )

            # Update meeting participant count
            meeting.total_participants = meeting.attendees.filter(
                is_currently_joined=True
            ).count()
            if meeting.total_participants > meeting.max_participants_reached:
                meeting.max_participants_reached = meeting.total_participants
            meeting.save()

            return True, None, attendee

        except Exception as e:
            logger.error(f"Error in handle_participant_join: {str(e)}")
            return False, "Internal server error", None

    @staticmethod
    @transaction.atomic
    def handle_participant_leave(meeting, user, reason="user_left"):
        """
        Handle participant leaving a meeting

        Args:
            meeting: Meeting instance
            user: User instance
            reason: Reason for leaving

        Returns:
            tuple: (success: bool, error_message: str)
        """
        try:
            # Get attendee record
            attendee = meeting.attendees.filter(user=user).first()
            if not attendee:
                return False, "User is not a participant in this meeting"

            if not attendee.is_currently_joined:
                return False, "User is not currently in this meeting"

            # Leave the meeting
            now = timezone.now()
            attendee.left_at = now
            attendee.is_currently_joined = False

            # Calculate duration if joined_at exists
            if attendee.joined_at:
                session_duration = now - attendee.joined_at
                attendee.total_duration = (
                    attendee.total_duration or timedelta(0)
                ) + session_duration

            attendee.save()

            # Update participant session
            session = MeetingParticipantSession.objects.filter(
                meeting=meeting, user=user, left_at__isnull=True
            ).first()

            if session:
                session.left_at = now
                session.leave_reason = reason
                session.duration = now - session.joined_at
                session.save()

            # Create leave event
            MeetingEvent.objects.create(
                meeting=meeting,
                event_type="participant_left",
                user=user,
                metadata={"left_at": now.isoformat(), "reason": reason},
            )

            # Update meeting participant count
            meeting.total_participants = meeting.attendees.filter(
                is_currently_joined=True
            ).count()

            # If no participants left and meeting is active, end the meeting
            if meeting.total_participants == 0 and meeting.status == "active":
                meeting.status = "ended"
                meeting.ended_at = now
                meeting.ended_by = user
                meeting.save()

                # Send meeting ended notifications
                MeetingUtils.send_meeting_notifications(meeting, "ended", user)
            else:
                meeting.save()

            return True, None

        except Exception as e:
            logger.error(f"Error in handle_participant_leave: {str(e)}")
            return False, "Internal server error"

    @staticmethod
    def validate_meeting_access(meeting, user, required_status=None):
        """
        Validate if user can access meeting

        Args:
            meeting: Meeting instance
            user: User instance
            required_status: Required meeting status (e.g., 'active')

        Returns:
            tuple: (is_valid: bool, error_message: str, error_code: str)
        """
        # Check if user is a participant
        attendee = meeting.attendees.filter(user=user).first()
        if not attendee:
            return False, "You are not a participant in this meeting", "NOT_PARTICIPANT"

        # Check meeting status if required
        if required_status and meeting.status != required_status:
            if meeting.status == "scheduled":
                return False, "Meeting has not been initiated yet", "MEETING_NOT_ACTIVE"
            elif meeting.status == "ended":
                return False, "This meeting has already ended", "MEETING_ALREADY_ENDED"
            elif meeting.status == "cancelled":
                return False, "This meeting has been cancelled", "MEETING_CANCELLED"
            else:
                return False, f"Meeting status is {meeting.status}", "INVALID_STATUS"

        return True, None, None

    @staticmethod
    def get_webrtc_config():
        """Get WebRTC configuration for video calls"""
        return {
            "iceServers": [
                {"urls": ["stun:stun.l.google.com:19302"]},
                {"urls": ["stun:stun1.l.google.com:19302"]},
                {"urls": ["stun:stun2.l.google.com:19302"]},
                {"urls": ["stun:stun3.l.google.com:19302"]},
                {"urls": ["stun:stun4.l.google.com:19302"]},
            ]
        }

    @staticmethod
    def format_meeting_participants(meeting, request=None):
        """
        Format meeting participants for API response

        Args:
            meeting: Meeting instance
            request: HTTP request for building absolute URLs

        Returns:
            list: Formatted participants data
        """
        participants = []

        for attendee in meeting.attendees.all():
            # Get user profile picture if available
            avatar_url = None
            if (
                hasattr(attendee.user, "profile")
                and attendee.user.profile.profile_picture
            ):
                if request:
                    avatar_url = request.build_absolute_uri(
                        attendee.user.profile.profile_picture.url
                    )
                else:
                    avatar_url = attendee.user.profile.profile_picture.url

            participants.append(
                {
                    "userId": str(attendee.user.id),
                    "name": attendee.user.get_full_name() or attendee.user.username,
                    "role": attendee.role,
                    "email": attendee.user.email,
                    "avatar": avatar_url,
                    "isConfirmed": attendee.is_confirmed,
                    "joinedAt": (
                        attendee.joined_at.isoformat() if attendee.joined_at else None
                    ),
                    "leftAt": (
                        attendee.left_at.isoformat() if attendee.left_at else None
                    ),
                    "isCurrentlyJoined": attendee.is_currently_joined,
                    "isAudioMuted": attendee.is_audio_muted,
                    "isVideoEnabled": attendee.is_video_enabled,
                    "totalDuration": (
                        str(attendee.total_duration)
                        if attendee.total_duration
                        else None
                    ),
                }
            )

        return participants


class WebRTCSignaling:
    """Utilities for WebRTC signaling"""

    @staticmethod
    def validate_sdp(sdp_data):
        """
        Validate SDP offer/answer data

        Args:
            sdp_data: SDP data dict

        Returns:
            bool: Is valid
        """
        if not isinstance(sdp_data, dict):
            return False

        required_fields = ["type", "sdp"]
        if not all(field in sdp_data for field in required_fields):
            return False

        if sdp_data["type"] not in ["offer", "answer"]:
            return False

        if not isinstance(sdp_data["sdp"], str) or len(sdp_data["sdp"]) == 0:
            return False

        return True

    @staticmethod
    def validate_ice_candidate(candidate_data):
        """
        Validate ICE candidate data

        Args:
            candidate_data: ICE candidate data dict

        Returns:
            bool: Is valid
        """
        if not isinstance(candidate_data, dict):
            return False

        required_fields = ["candidate", "sdpMLineIndex", "sdpMid"]
        if not all(field in candidate_data for field in required_fields):
            return False

        if not isinstance(candidate_data["candidate"], str):
            return False

        if not isinstance(candidate_data["sdpMLineIndex"], int):
            return False

        return True
