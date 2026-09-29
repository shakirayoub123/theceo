from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from scheduling.models import Meeting, MeetingAttendee, MeetingEvent, MeetingMediaState

logger = logging.getLogger(__name__)


class TrainerToggleAudioView(APIView):
    """
    POST /api/lms/trainer/meeting/{meetingId}/media/audio - Toggle audio mute/unmute (trainer view)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Toggle audio mute state for participant"""
        user = request.user
        data = request.data

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = meeting.attendees.filter(user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if meeting is active
                if meeting.status != "active":
                    return Response(
                        {
                            "error": "MEETING_NOT_ACTIVE",
                            "message": "Meeting is not currently active",
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Check if user is currently joined
                if not attendee.is_currently_joined:
                    return Response(
                        {
                            "error": "NOT_JOINED",
                            "message": "You must join the meeting first",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Update audio state
                muted = data.get(
                    "muted", not attendee.is_audio_muted
                )  # Toggle if not specified
                attendee.is_audio_muted = muted
                attendee.save()

                # Update media state
                media_state, created = MeetingMediaState.objects.get_or_create(
                    meeting=meeting, user=user, defaults={"is_audio_muted": muted}
                )
                if not created:
                    media_state.is_audio_muted = muted
                    media_state.save()

                # Create event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="audio_toggled",
                    user=user,
                    metadata={"muted": muted, "timestamp": timezone.now().isoformat()},
                )

                response_data = {
                    "success": True,
                    "audioMuted": muted,
                    "timestamp": timezone.now().isoformat(),
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in TrainerToggleAudioView: {str(e)}")
            return Response(
                {"error": "INTERNAL_SERVER_ERROR", "message": "Failed to toggle audio"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainerToggleVideoView(APIView):
    """
    POST /api/lms/trainer/meeting/{meetingId}/media/video - Toggle video on/off (trainer view)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Toggle video enabled/disabled state for participant"""
        user = request.user
        data = request.data

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = meeting.attendees.filter(user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if meeting is active
                if meeting.status != "active":
                    return Response(
                        {
                            "error": "MEETING_NOT_ACTIVE",
                            "message": "Meeting is not currently active",
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Check if user is currently joined
                if not attendee.is_currently_joined:
                    return Response(
                        {
                            "error": "NOT_JOINED",
                            "message": "You must join the meeting first",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Update video state
                enabled = data.get(
                    "enabled", not attendee.is_video_enabled
                )  # Toggle if not specified
                attendee.is_video_enabled = enabled
                attendee.save()

                # Update media state
                media_state, created = MeetingMediaState.objects.get_or_create(
                    meeting=meeting, user=user, defaults={"is_video_enabled": enabled}
                )
                if not created:
                    media_state.is_video_enabled = enabled
                    media_state.save()

                # Create event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="video_toggled",
                    user=user,
                    metadata={
                        "enabled": enabled,
                        "timestamp": timezone.now().isoformat(),
                    },
                )

                response_data = {
                    "success": True,
                    "videoEnabled": enabled,
                    "timestamp": timezone.now().isoformat(),
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in TrainerToggleVideoView: {str(e)}")
            return Response(
                {"error": "INTERNAL_SERVER_ERROR", "message": "Failed to toggle video"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainerSetSpotlightView(APIView):
    """
    POST /api/lms/trainer/meeting/{meetingId}/spotlight - Set spotlight on participant (trainer view)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Pin/spotlight a specific participant's video to main view"""
        user = request.user
        data = request.data

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = meeting.attendees.filter(user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if meeting is active or scheduled (both states allow spotlight changes)
                if meeting.status not in ["active", "scheduled"]:
                    return Response(
                        {
                            "error": "MEETING_NOT_AVAILABLE",
                            "message": "Meeting is not available for spotlighting - it may have ended",
                            "status": meeting.status,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Get spotlight user ID
                spotlight_user_id = data.get("spotlightUserId")
                if not spotlight_user_id:
                    return Response(
                        {
                            "error": "INVALID_REQUEST",
                            "message": "spotlightUserId is required",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Get the user to be spotlighted
                try:
                    spotlight_user = meeting.attendees.get(
                        user_id=spotlight_user_id
                    ).user
                except MeetingAttendee.DoesNotExist:
                    return Response(
                        {
                            "error": "USER_NOT_PARTICIPANT",
                            "message": "Specified user is not a participant in this meeting",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if spotlighted user is currently joined (only required for active meetings)
                spotlight_attendee = meeting.attendees.get(user=spotlight_user)
                if (
                    meeting.status == "active"
                    and not spotlight_attendee.is_currently_joined
                ):
                    return Response(
                        {
                            "error": "USER_NOT_JOINED",
                            "message": "Specified user is not currently in the meeting",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Store previous spotlight for event logging
                previous_spotlight = meeting.spotlighted_participant

                # Set new spotlight
                meeting.spotlighted_participant = spotlight_user
                meeting.save()

                # Create event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="spotlight_changed",
                    user=user,
                    target_user=spotlight_user,
                    metadata={
                        "spotlighted_user_id": str(spotlight_user.id),
                        "previous_spotlighted_user_id": (
                            str(previous_spotlight.id) if previous_spotlight else None
                        ),
                        "timestamp": timezone.now().isoformat(),
                    },
                )

                response_data = {
                    "success": True,
                    "spotlightedUser": {
                        "userId": str(spotlight_user.id),
                        "name": spotlight_user.get_full_name()
                        or spotlight_user.username,
                    },
                    "timestamp": timezone.now().isoformat(),
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in TrainerSetSpotlightView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to set spotlight",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainerMeetingParticipantsView(APIView):
    """
    GET /api/lms/trainer/meeting/{meetingId}/participants - Get current meeting participants (trainer view)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get current participants and their states"""
        user = request.user

        try:
            meeting = get_object_or_404(Meeting, id=meeting_id)

            # Check if user is a participant
            attendee = meeting.attendees.filter(user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get all currently joined participants
            participants = []
            for att in meeting.attendees.filter(is_currently_joined=True):
                # Get user profile picture if available
                avatar_url = None
                if hasattr(att.user, "profile") and att.user.profile.profile_picture:
                    avatar_url = request.build_absolute_uri(
                        att.user.profile.profile_picture.url
                    )

                participants.append(
                    {
                        "userId": str(att.user.id),
                        "name": att.user.get_full_name() or att.user.username,
                        "role": att.role,
                        "email": att.user.email,
                        "avatar": avatar_url,
                        "joinedAt": (
                            att.joined_at.isoformat() if att.joined_at else None
                        ),
                        "isAudioMuted": att.is_audio_muted,
                        "isVideoEnabled": att.is_video_enabled,
                        "isSpotlighted": meeting.spotlighted_participant == att.user,
                        "isCurrentUser": att.user == user,
                    }
                )

            response_data = {
                "meetingId": str(meeting.id),
                "status": meeting.status,
                "totalParticipants": len(participants),
                "spotlightedUserId": (
                    str(meeting.spotlighted_participant.id)
                    if meeting.spotlighted_participant
                    else None
                ),
                "participants": participants,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in TrainerMeetingParticipantsView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to get participants",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainerMeetingEventsView(APIView):
    """
    GET /api/lms/trainer/meeting/{meetingId}/events - Get meeting events for debugging (trainer view)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get meeting events (for debugging/monitoring)"""
        user = request.user

        try:
            meeting = get_object_or_404(Meeting, id=meeting_id)

            # Check if user is a participant
            attendee = meeting.attendees.filter(user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get recent events (last 50)
            events = meeting.events.select_related("user", "target_user").order_by(
                "-timestamp"
            )[:50]

            events_data = []
            for event in events:
                events_data.append(
                    {
                        "id": event.id,
                        "eventType": event.event_type,
                        "user": {
                            "id": str(event.user.id),
                            "name": event.user.get_full_name() or event.user.username,
                        },
                        "targetUser": (
                            {
                                "id": str(event.target_user.id),
                                "name": event.target_user.get_full_name()
                                or event.target_user.username,
                            }
                            if event.target_user
                            else None
                        ),
                        "timestamp": event.timestamp.isoformat(),
                        "metadata": event.metadata,
                    }
                )

            response_data = {"meetingId": str(meeting.id), "events": events_data}

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in TrainerMeetingEventsView: {str(e)}")
            return Response(
                {"error": "INTERNAL_SERVER_ERROR", "message": "Failed to get events"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
