"""Client details shown inside the video call window for staff.

GET /api/scheduling/meetings/<meeting_id>/client-info/

Lets the salesperson/coach on a call see who the client is: name, company,
industry, job title, program of interest, etc. Only staff who are in the
meeting (or scheduled it) and admins can see it; clients get 403.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .calendar_helpers import (
    determine_call_type,
    determine_meeting_staff_role,
    determine_program_name,
)
from .models import Meeting, MeetingAttendee

STAFF_ROLES = {"sales", "trainer", "admin"}


def _clean(value):
    value = (value or "").strip() if isinstance(value, str) else value
    return value or None


class MeetingClientInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        meeting = get_object_or_404(Meeting, id=meeting_id)
        user = request.user
        role = getattr(user, "role", "")

        is_admin = role == "admin" or user.is_superuser
        is_staff_in_meeting = role in STAFF_ROLES and (
            meeting.scheduled_by_id == user.id
            or MeetingAttendee.objects.filter(meeting=meeting, user=user).exists()
        )
        if not (is_admin or is_staff_in_meeting):
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        attendee = (
            MeetingAttendee.objects.filter(meeting=meeting, role="client")
            .select_related("user")
            .first()
        )
        if attendee is None or attendee.user is None:
            return Response({"client": None}, status=status.HTTP_200_OK)

        client_user = attendee.user
        from people.models import Client

        profile = Client.objects.filter(user=client_user).select_related("assigned_sales").first()
        sales = profile.assigned_sales if profile else None

        from lms.models import Enrollment

        enrolled = [
            e.service.title
            for e in Enrollment.objects.filter(user=client_user).select_related("service")
            if e.service
        ]
        role_info = determine_meeting_staff_role(meeting)

        return Response(
            {
                "client": {
                    "userId": str(client_user.id),
                    "name": _clean(client_user.get_full_name()) or client_user.email,
                    "email": client_user.email,
                    "phone": _clean(getattr(profile, "phone", None)),
                    "company": _clean(getattr(profile, "position", None)),
                    "jobTitle": _clean(getattr(profile, "job_title", None)),
                    "industry": _clean(getattr(profile, "industry", None)),
                    "country": _clean(getattr(profile, "country", None)),
                    "referredBy": _clean(getattr(profile, "referred_by", None)),
                    "programOfInterest": _clean(getattr(profile, "program_of_interest", None))
                    or determine_program_name(meeting, client_user),
                    "enrolledPrograms": enrolled,
                    "programStatus": getattr(profile, "program_status", None),
                    "salesInfluencer": (
                        _clean(sales.get_full_name()) or sales.email if sales else None
                    ),
                },
                "meeting": {
                    "id": meeting.id,
                    "title": meeting.title,
                    "callType": determine_call_type(meeting, role_info, client_user),
                    "scheduledAt": meeting.scheduled_at.isoformat() if meeting.scheduled_at else None,
                },
            },
            status=status.HTTP_200_OK,
        )
