from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from datetime import timedelta
import logging

from scheduling.models import (
    Meeting,
    MeetingAttendee,
    MeetingParticipantSession,
    MeetingEvent,
    MeetingMediaState,
)
from comms.models import Notification
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


class MeetingDetailView(APIView):
    """
    GET /api/lms/client/meeting/{meetingId} - Get meeting details for video call
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get meeting details and determine if user can initiate/join"""
        user = request.user

        try:
            meeting = get_object_or_404(Meeting, id=meeting_id)

            logger.info(f"User: {user.username} (ID: {user.id}), Meeting ID: {meeting_id}")

            # Check if user is a participant
            attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get all participants with their current state
            participants = []
            for att in meeting.attendees.all():
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
                        "isJoined": att.is_currently_joined,
                        "joinedAt": (
                            att.joined_at.isoformat() if att.joined_at else None
                        ),
                    }
                )

            # Determine if user can initiate meeting
            can_initiate = meeting.can_initiate(user)
            minutes_until_start = meeting.get_minutes_until_start()

            # Check if user is host (primary trainer or meeting organizer)
            is_host = (
                attendee.role in ["trainer", "organizer"]
                or meeting.scheduled_by == user
            )

            # Get or generate room ID
            room_id = meeting.get_room_id()

            # Get service/program information if available
            program_info = {}
            if getattr(meeting, "service_id", None):
                program_info = {
                    "programId": str(meeting.service.id),
                    "programTitle": meeting.service.title,
                }
            else:
                try:
                    from lms.models import Enrollment

                    # Backward-compatible fallback: infer from attendee enrollments (may be ambiguous)
                    enrollments = (
                        Enrollment.objects.filter(
                            user__in=[att.user for att in meeting.attendees.all()]
                        )
                        .select_related("service")
                        .first()
                    )

                    if enrollments and enrollments.service:
                        program_info = {
                            "programId": str(enrollments.service.id),
                            "programTitle": enrollments.service.title,
                        }
                except Exception:
                    pass  # No service information available

            # Get user's meeting notes
            meeting_note = None
            try:
                from scheduling.models import MeetingNotes

                user_note = MeetingNotes.objects.filter(
                    meeting=meeting, user=user
                ).first()
                if user_note:
                    # Just return the content string directly
                    meeting_note = user_note.content
            except Exception as e:
                logger.warning(f"Failed to get meeting notes: {e}")

            response_data = {
                "id": str(meeting.id),
                "meetingId": str(meeting.id),
                "title": meeting.title,
                "sessionNumber": 1,  # Could be enhanced to track actual session numbers
                "scheduledStartTime": meeting.scheduled_at.isoformat(),
                "scheduledEndTime": (
                    meeting.scheduled_at + meeting.duration
                ).isoformat(),
                "status": meeting.status,
                "participants": participants,
                "canInitiate": can_initiate,
                "minutesUntilStart": minutes_until_start,
                "roomId": room_id,
                "isHost": is_host,
                "meeting_note": meeting_note,
                **program_info,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in MeetingDetailView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InitiateMeetingView(APIView):
    """
    POST /api/lms/client/meeting/{meetingId}/initiate - Start video meeting
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Initiate a video meeting"""
        user = request.user

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if meeting can be initiated
                if not meeting.can_initiate(user):
                    if meeting.status == "active":
                        return Response(
                            {
                                "error": "MEETING_ALREADY_ACTIVE",
                                "message": "Meeting has already been initiated",
                                "startedAt": (
                                    meeting.initiated_at.isoformat()
                                    if meeting.initiated_at
                                    else None
                                ),
                            },
                            status=status.HTTP_409_CONFLICT,
                        )
                    elif meeting.status == "ended":
                        return Response(
                            {
                                "error": "MEETING_ALREADY_ENDED",
                                "message": "This meeting has already ended",
                            },
                            status=status.HTTP_409_CONFLICT,
                        )
                    else:
                        minutes_until = meeting.get_minutes_until_start()
                        if minutes_until > 2:
                            return Response(
                                {
                                    "error": "TOO_EARLY",
                                    "message": "Cannot initiate meeting yet",
                                    "minutesUntilAllowed": minutes_until - 2,
                                    "details": "Meeting can only be initiated 2 minutes before scheduled start time",
                                },
                                status=status.HTTP_403_FORBIDDEN,
                            )

                # Initiate the meeting
                now = timezone.now()
                meeting.status = "active"
                meeting.initiated_at = now
                meeting.initiated_by = user

                # Create Daily.co room
                try:
                    meeting.create_daily_room()
                except Exception as e:
                    logger.error(f"Failed to create Daily.co room: {e}")
                    return Response(
                        {
                            "error": "ROOM_CREATION_FAILED",
                            "message": "Failed to create video room",
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                meeting.save()

                # Create meeting initiated event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="meeting_initiated",
                    user=user,
                    metadata={"initiated_at": now.isoformat()},
                )

                # Send notifications to all attendees
                self.send_meeting_notifications(meeting, "initiated")

                # Prepare response
                response_data = {
                    "success": True,
                    "message": "Meeting initiated successfully",
                    "meeting": {
                        "meetingId": str(meeting.id),
                        "status": meeting.status,
                        "roomId": meeting.get_room_id(),
                        "startedAt": meeting.initiated_at.isoformat(),
                        "roomUrl": meeting.get_room_join_url(user),
                        "isHost": True,  # Initiator is always host
                    },
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in InitiateMeetingView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to initiate meeting",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def send_meeting_notifications(self, meeting, action):
        """Send notifications to all attendees"""
        attendees = meeting.attendees.all()

        for attendee in attendees:
            if action == "initiated":
                title = f"Meeting Started: {meeting.title}"
                message = f"The meeting '{meeting.title}' has been started and is ready to join."
            else:
                title = f"Meeting Update: {meeting.title}"
                message = f"There has been an update to the meeting '{meeting.title}'."

            # Create in-app notification
            Notification.objects.create(
                user=attendee.user,
                title=title,
                message=message,
                type="meeting",
                related_id=meeting.id,
            )

            # Send email notification
            try:
                email_subject = title
                email_message = f"""
                {message}
                
                Meeting Details:
                - Title: {meeting.title}
                - Started At: {meeting.initiated_at.strftime("%Y-%m-%d %H:%M") if meeting.initiated_at else "N/A"}
                - Duration: {meeting.duration}
                
                You can join the meeting from your dashboard.
                """

                send_mail(
                    email_subject,
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [attendee.user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send email to {attendee.user.email}: {e}")


class JoinMeetingView(APIView):
    """
    POST /api/lms/client/meeting/{meetingId}/join - Join active meeting
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Join an active meeting"""
        user = request.user
        data = request.data

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
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
                    if meeting.status == "scheduled":
                        return Response(
                            {
                                "error": "MEETING_NOT_ACTIVE",
                                "message": "Meeting has not been initiated yet",
                                "status": meeting.status,
                                "scheduledStartTime": meeting.scheduled_at.isoformat(),
                            },
                            status=status.HTTP_409_CONFLICT,
                        )
                    elif meeting.status == "ended":
                        return Response(
                            {
                                "error": "MEETING_ALREADY_ENDED",
                                "message": "This meeting has already ended",
                            },
                            status=status.HTTP_409_CONFLICT,
                        )

                # Check if user is already joined
                if attendee.is_currently_joined:
                    return Response(
                        {
                            "error": "ALREADY_JOINED",
                            "message": "You have already joined this meeting",
                            "joinedAt": (
                                attendee.joined_at.isoformat()
                                if attendee.joined_at
                                else None
                            ),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Join the meeting
                now = timezone.now()
                attendee.joined_at = now
                attendee.is_currently_joined = True

                # Set media preferences from request
                media_prefs = data.get("mediaPreferences", {})
                attendee.is_audio_muted = not media_prefs.get("audioEnabled", True)
                attendee.is_video_enabled = media_prefs.get("videoEnabled", True)
                attendee.save()

                # Create participant session
                session = MeetingParticipantSession.objects.create(
                    meeting=meeting, user=user, joined_at=now
                )

                # Create media state record
                MeetingMediaState.objects.update_or_create(
                    meeting=meeting,
                    user=user,
                    defaults={
                        "is_audio_muted": attendee.is_audio_muted,
                        "is_video_enabled": attendee.is_video_enabled,
                        "is_screen_sharing": False,
                    },
                )

                # Create join event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="participant_joined",
                    user=user,
                    metadata={"session_id": session.id},
                )

                # Update meeting participant count
                meeting.total_participants = meeting.attendees.filter(
                    is_currently_joined=True
                ).count()
                if meeting.total_participants > meeting.max_participants_reached:
                    meeting.max_participants_reached = meeting.total_participants
                meeting.save()

                # Get active participants
                active_participants = []
                for att in meeting.attendees.filter(is_currently_joined=True).exclude(
                    user=user
                ):
                    active_participants.append(
                        {
                            "userId": str(att.user.id),
                            "name": att.user.get_full_name() or att.user.username,
                            "role": att.role,
                            "joinedAt": (
                                att.joined_at.isoformat() if att.joined_at else None
                            ),
                            "isAudioMuted": att.is_audio_muted,
                            "isVideoEnabled": att.is_video_enabled,
                            "isSpotlighted": meeting.spotlighted_participant
                            == att.user,
                        }
                    )

                # Ensure Daily.co room is created if needed
                if not meeting.daily_room_url or not meeting.is_daily_room_active:
                    meeting.create_daily_room()

                # Get room join URL with token
                try:
                    room_url = meeting.get_room_join_url(user)
                except Exception as e:
                    logger.error(f"Failed to generate Daily.co join URL: {str(e)}")
                    room_url = None

                response_data = {
                    "success": True,
                    "meeting": {
                        "meetingId": str(meeting.id),
                        "roomId": meeting.get_room_id(),
                        "status": meeting.status,
                        "joinedAt": attendee.joined_at.isoformat(),
                        "roomUrl": room_url,
                        "dailyRoomName": meeting.daily_room_name,
                        "activeParticipants": active_participants,
                    },
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in JoinMeetingView: {str(e)}")
            return Response(
                {"error": "INTERNAL_SERVER_ERROR", "message": "Failed to join meeting"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LeaveMeetingView(APIView):
    """
    POST /api/lms/client/meeting/{meetingId}/leave - Leave meeting
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Leave a meeting"""
        user = request.user

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if user is currently joined
                if not attendee.is_currently_joined:
                    return Response(
                        {
                            "error": "NOT_JOINED",
                            "message": "You are not currently in this meeting",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

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
                    session.leave_reason = "user_left"
                    session.duration = now - session.joined_at
                    session.save()

                # Create leave event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="participant_left",
                    user=user,
                    metadata={"left_at": now.isoformat(), "reason": "user_left"},
                )

                # Update meeting participant count
                meeting.total_participants = meeting.attendees.filter(
                    is_currently_joined=True
                ).count()

                # If no participants left, end the meeting
                if meeting.total_participants == 0:
                    meeting.status = "ended"
                    meeting.ended_at = now
                    meeting.ended_by = user

                meeting.save()

                response_data = {
                    "success": True,
                    "message": "Left meeting successfully",
                    "leftAt": now.isoformat(),
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in LeaveMeetingView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to leave meeting",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetRoomUrlView(APIView):
    """
    GET /api/lms/client/meeting/{meetingId}/room-url - Get Daily.co room URL with token
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get the Daily.co room URL with token for the current user"""
        user = request.user

        try:
            meeting = get_object_or_404(Meeting, id=meeting_id)

            # Check if user is a participant
            attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if meeting is active
            if meeting.status == "scheduled" and (
                meeting.scheduled_by == user
                or attendee.role in ["trainer", "sales", "organizer"]
            ):
                now = timezone.now()
                meeting.status = "active"
                meeting.initiated_at = meeting.initiated_at or now
                meeting.initiated_by = meeting.initiated_by or user
                meeting.create_daily_room()
                meeting.save(update_fields=[
                    "status",
                    "initiated_at",
                    "initiated_by",
                    "daily_room_name",
                    "daily_room_url",
                    "is_daily_room_active",
                    "updated_at",
                ])
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="meeting_initiated",
                    user=user,
                    metadata={"initiated_at": meeting.initiated_at.isoformat()},
                )
            elif meeting.status != "active":
                logger.warning(
                    f"User {user.username} attempted to get room URL for inactive meeting {meeting_id}"
                )

            room_url = meeting.get_room_join_url(user)

            response_data = {
                "meetingId": str(meeting.id),
                "roomUrl": room_url,
                "roomName": meeting.daily_room_name,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in GetRoomUrlView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to get room URL",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CloseMeetingView(APIView):
    """
    POST /api/lms/client/meeting/{meetingId}/close - End meeting for all participants
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Close meeting for all participants"""
        user = request.user
        data = request.data

        try:
            with transaction.atomic():
                meeting = get_object_or_404(Meeting, id=meeting_id)

                # Check if user is a participant
                attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
                if not attendee:
                    return Response(
                        {
                            "error": "NOT_PARTICIPANT",
                            "message": "You are not a participant in this meeting",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Check if user has permission to close (any participant can close)
                # In a more restrictive setup, you could limit this to trainers only

                # Check if meeting is active
                if meeting.status == "ended":
                    return Response(
                        {
                            "error": "MEETING_ALREADY_ENDED",
                            "message": "This meeting has already ended",
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                # Close the meeting
                now = timezone.now()
                meeting.status = "ended"
                meeting.ended_at = now
                meeting.ended_by = user

                # Calculate total duration
                if meeting.initiated_at:
                    total_duration = (now - meeting.initiated_at).total_seconds()
                else:
                    total_duration = 0

                # End Daily.co room
                try:
                    meeting.end_daily_room()
                except Exception as e:
                    logger.error(f"Failed to end Daily.co room: {e}")
                    # Don't fail the meeting close if room ending fails

                meeting.save()

                # Update all currently joined participants
                for att in meeting.attendees.filter(is_currently_joined=True):
                    att.left_at = now
                    att.is_currently_joined = False

                    # Calculate individual duration
                    if att.joined_at:
                        session_duration = now - att.joined_at
                        att.total_duration = (
                            att.total_duration or timedelta(0)
                        ) + session_duration

                    att.save()

                # Close all open sessions
                open_sessions = MeetingParticipantSession.objects.filter(
                    meeting=meeting, left_at__isnull=True
                )

                for session in open_sessions:
                    session.left_at = now
                    session.leave_reason = "meeting_ended"
                    session.duration = now - session.joined_at
                    session.save()

                # Create meeting ended event
                MeetingEvent.objects.create(
                    meeting=meeting,
                    event_type="meeting_ended",
                    user=user,
                    metadata={
                        "ended_at": now.isoformat(),
                        "reason": data.get("reason", "Meeting completed"),
                        "total_duration": total_duration,
                    },
                )

                # Send notifications
                self.send_meeting_end_notifications(
                    meeting, user, data.get("reason", "Meeting completed")
                )

                # Prepare statistics
                stats = {
                    "totalParticipants": meeting.max_participants_reached,
                    "totalDuration": int(total_duration),
                    "recordingAvailable": False,  # No recording feature
                    "recordingUrl": None,
                }

                response_data = {
                    "success": True,
                    "message": "Meeting ended successfully",
                    "meeting": {
                        "meetingId": str(meeting.id),
                        "status": meeting.status,
                        "endedAt": meeting.ended_at.isoformat(),
                        "endedBy": {
                            "userId": str(user.id),
                            "name": user.get_full_name() or user.username,
                        },
                        "duration": int(total_duration),
                        "statistics": stats,
                    },
                }

                return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in CloseMeetingView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to close meeting",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def send_meeting_end_notifications(self, meeting, ended_by, reason):
        """Send notifications to all attendees about meeting end"""
        attendees = meeting.attendees.all()

        for attendee in attendees:
            title = f"Meeting Ended: {meeting.title}"
            message = f"The meeting '{meeting.title}' has ended. Reason: {reason}"

            # Create in-app notification
            Notification.objects.create(
                user=attendee.user,
                title=title,
                message=message,
                type="meeting",
                related_id=meeting.id,
            )

            # Send email notification
            try:
                email_subject = title
                email_message = f"""
                The meeting '{meeting.title}' has ended.
                
                Meeting Details:
                - Ended By: {ended_by.get_full_name() or ended_by.username}
                - Ended At: {meeting.ended_at.strftime("%Y-%m-%d %H:%M")}
                - Reason: {reason}
                
                Thank you for participating.
                """

                send_mail(
                    email_subject,
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [attendee.user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send email to {attendee.user.email}: {e}")


class MeetingNoteView(APIView):
    """
    GET /api/lms/meeting-note/<meeting_id>/ - Get meeting notes for current user
    POST /api/lms/meeting-note/ - Create or update meeting notes
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get meeting notes for the current user"""
        user = request.user

        try:
            meeting = get_object_or_404(Meeting, id=meeting_id)

            # Check if user is a participant
            attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get user's meeting notes
            from scheduling.models import MeetingNotes
            user_note = MeetingNotes.objects.filter(
                meeting=meeting, user=user
            ).first()

            response_data = {
                "meeting_id": str(meeting.id),
                "user_id": str(user.id),
                "content": user_note.content if user_note else "",
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in MeetingNoteView GET: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to retrieve meeting notes",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create or update meeting notes for the current user"""
        user = request.user
        data = request.data

        try:
            meeting_id = data.get("meeting_id")
            note_id = data.get("note_id")  # Optional, for updates
            content = data.get("content", "")

            if not meeting_id:
                return Response(
                    {
                        "error": "MEETING_ID_REQUIRED",
                        "message": "meeting_id is required",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify user is a participant in the meeting
            meeting = get_object_or_404(Meeting, id=meeting_id)
            attendee = MeetingAttendee.objects.filter(meeting=meeting, user=user).first()
            if not attendee:
                return Response(
                    {
                        "error": "NOT_PARTICIPANT",
                        "message": "You are not a participant in this meeting",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            from scheduling.models import MeetingNotes

            # If note_id is provided, try to update existing note
            if note_id:
                try:
                    note = MeetingNotes.objects.get(
                        id=note_id, user=user, meeting=meeting
                    )
                    note.content = content
                    note.save()
                except MeetingNotes.DoesNotExist:
                    return Response(
                        {
                            "error": "NOTE_NOT_FOUND",
                            "message": "Note not found or access denied",
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                # Create new note or update existing one for this user/meeting
                note, created = MeetingNotes.objects.update_or_create(
                    user=user, meeting=meeting, defaults={"content": content}
                )

            response_data = {
                "success": True,
                "message": "Meeting note saved successfully",
                "meeting_note": note.content,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in MeetingNoteView: {str(e)}")
            return Response(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "Failed to save meeting note",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
