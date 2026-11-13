from django.db import models
from django.utils import timezone
from .models import MeetingAttendee

def determine_meeting_staff_role(meeting):
    """
    Determine the internal staff role responsible for this meeting:
    - Sales: Yellow (#F6B72D)
    - Coaching: Green (#10B981)
    - Administrator: Red (#EF4444)
    """
    type_name = (meeting.meeting_type.name if meeting.meeting_type else "").lower()
    title_text = (meeting.title or "").lower()
    combined_text = f"{type_name} {title_text}"

    # Check meeting type or title keywords first for explicit call types
    if any(k in combined_text for k in ["discovery", "sales call", "sales meeting", "consultation", "closing"]):
        return {
            "role": "sales",
            "color": "#F6B72D",
            "label": "Sales"
        }

    if any(k in combined_text for k in ["coaching", "trainer", "workout", "session", "1:1 coaching", "fitness", "training"]):
        return {
            "role": "coaching",
            "color": "#10B981",
            "label": "Coaching"
        }

    if any(k in combined_text for k in ["admin", "executive", "board", "internal", "operations", "ops"]):
        return {
            "role": "admin",
            "color": "#EF4444",
            "label": "Administrator"
        }

    # Check staff attendees or scheduled_by
    scheduled_by_role = getattr(meeting.scheduled_by, "role", None)

    # Check attendees
    staff_attendees = MeetingAttendee.objects.filter(
        meeting=meeting
    ).exclude(role="client").select_related("user")

    for attendee in staff_attendees:
        a_role = (attendee.role or "").lower()
        u_role = (getattr(attendee.user, "role", "") or "").lower()
        if a_role == "sales" or u_role == "sales":
            return {"role": "sales", "color": "#F6B72D", "label": "Sales"}
        if a_role == "trainer" or u_role == "trainer":
            return {"role": "coaching", "color": "#10B981", "label": "Coaching"}
        if a_role in ["admin", "master"] or u_role in ["admin", "master"]:
            return {"role": "admin", "color": "#EF4444", "label": "Administrator"}

    if scheduled_by_role == "sales":
        return {"role": "sales", "color": "#F6B72D", "label": "Sales"}
    elif scheduled_by_role == "trainer":
        return {"role": "coaching", "color": "#10B981", "label": "Coaching"}
    elif scheduled_by_role in ["admin", "master"]:
        return {"role": "admin", "color": "#EF4444", "label": "Administrator"}

    # Default to Sales if initial/discovery, otherwise Coaching
    if "initial" in combined_text:
        return {"role": "sales", "color": "#F6B72D", "label": "Sales"}
    return {"role": "coaching", "color": "#10B981", "label": "Coaching"}


def format_meeting_for_calendar(meeting):
    """
    Format a Meeting instance for Master Calendar consumption with hover details.
    """
    role_info = determine_meeting_staff_role(meeting)

    # Client attendee
    client_attendee = (
        MeetingAttendee.objects.filter(meeting=meeting, role="client")
        .select_related("user")
        .first()
    )

    client_name = "Prospective Client"
    client_programs = []
    if client_attendee and client_attendee.user:
        name = f"{client_attendee.user.first_name} {client_attendee.user.last_name}".strip()
        client_name = name or client_attendee.user.username or client_attendee.user.email

        from lms.models import Enrollment
        enrollments = Enrollment.objects.filter(user=client_attendee.user).select_related("service")[:3]
        client_programs = [e.service.title for e in enrollments if e.service]

    program_display = (
        " & ".join(client_programs)
        if client_programs
        else "CEO Influencers Program"
    )

    # Advisor / Staff attendees
    staff_attendees = (
        MeetingAttendee.objects.filter(meeting=meeting)
        .exclude(role="client")
        .select_related("user")
    )
    advisor_names = []
    for sa in staff_attendees:
        if sa.user:
            name = f"{sa.user.first_name} {sa.user.last_name}".strip()
            if not name:
                name = sa.user.username or sa.user.email
            advisor_names.append(name)

    if not advisor_names and meeting.scheduled_by:
        name = f"{meeting.scheduled_by.first_name} {meeting.scheduled_by.last_name}".strip()
        if not name:
            name = meeting.scheduled_by.username
        advisor_names.append(name)

    advisor_display = ", ".join(advisor_names) if advisor_names else "Assigned Staff"

    meeting_type_name = meeting.meeting_type.name if meeting.meeting_type else "Meeting"

    # Legacy type code: 01 for sales, 02 for coaching, 03 for admin
    type_code = "01" if role_info["role"] == "sales" else "02" if role_info["role"] == "coaching" else "03"

    duration_min = int(meeting.duration.total_seconds() / 60) if meeting.duration else 30

    return {
        "id": meeting.id,
        "title": meeting.title or meeting_type_name,
        "advisor": advisor_display,
        "advisor_name": advisor_display,
        "program": program_display,
        "program_name": program_display,
        "meetingType": meeting_type_name,
        "meeting_type": meeting_type_name,
        "clientName": client_name,
        "client_name": client_name,
        "time": meeting.scheduled_at.strftime("%I:%M %p"),
        "scheduled_at": meeting.scheduled_at.isoformat(),
        "duration_minutes": duration_min,
        "status": meeting.status,
        "type": type_code,
        "staff_role": role_info["role"],
        "role": role_info["role"],
        "role_color": role_info["color"],
        "role_label": role_info["label"],
        "color": role_info["color"],
    }

