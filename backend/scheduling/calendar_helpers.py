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


def determine_call_type(meeting, role_info, client_user=None):
    """Human call type for the calendar hover: Discovery / Sales / Coaching / Admin."""
    if role_info["role"] == "coaching":
        return "Coaching Call"
    if role_info["role"] == "admin":
        return "Admin Meeting"

    type_name = (meeting.meeting_type.name if meeting.meeting_type else "").lower()
    text = f"{type_name} {(meeting.title or '').lower()}"
    if "discovery" in text or "initial" in text:
        return "Discovery Call"
    if client_user is not None:
        # The client's earliest (non-cancelled) sales meeting is their discovery call.
        from .models import Meeting

        has_earlier_sales_meeting = (
            Meeting.objects.filter(attendees__user=client_user, scheduled_by__role="sales")
            .exclude(id=meeting.id)
            .exclude(status="cancelled")
            .filter(
                models.Q(scheduled_at__lt=meeting.scheduled_at)
                | models.Q(scheduled_at=meeting.scheduled_at, id__lt=meeting.id)
            )
            .exists()
        )
        if not has_earlier_sales_meeting:
            return "Discovery Call"
    return "Sales Call"


def determine_program_name(meeting, client_user=None):
    """Program for the meeting: linked program, then enrollment, then program of interest."""
    service = getattr(meeting, "service", None)
    if service is not None:
        return service.title

    if client_user is None:
        return None

    from lms.models import Enrollment

    enrolled = [
        e.service.title
        for e in Enrollment.objects.filter(user=client_user).select_related("service")[:3]
        if e.service
    ]
    if enrolled:
        return " & ".join(enrolled)

    profile = getattr(client_user, "client_profile", None)
    interest = (getattr(profile, "program_of_interest", None) or "").strip()
    if interest:
        return f"{interest} (interest)"

    from lms.models import Appointment

    appointment = (
        Appointment.objects.filter(user=client_user)
        .exclude(program_of_interest__isnull=True)
        .exclude(program_of_interest="")
        .order_by("-id")
        .first()
    )
    if appointment:
        return f"{appointment.program_of_interest} (interest)"
    return None


def _person_name(user):
    if not user:
        return ""
    return f"{user.first_name} {user.last_name}".strip() or user.username or user.email


def program_number_for(title):
    """1-based Program # (by display order) for a program title, or None."""
    if not title:
        return None
    from lms.models import Service

    clean = title.replace(" (interest)", "").strip().lower()
    ordered = list(
        Service.objects.filter(status="active").order_by("order", "id").values_list("title", flat=True)
    )
    for idx, name in enumerate(ordered, start=1):
        if (name or "").strip().lower() == clean:
            return idx
    return None


def meeting_topic_for(meeting, call_type, client_user=None):
    """Plain-language topic, e.g. 'New Client Sales Discovery Meeting'."""
    if call_type == "Discovery Call":
        return "New Client Sales Discovery Meeting"
    if call_type == "Sales Call":
        return "Sales Follow-up Meeting"
    if call_type == "Coaching Call":
        if client_user is not None:
            from .models import Meeting

            earlier_coaching = (
                Meeting.objects.filter(attendees__user=client_user)
                .exclude(id=meeting.id)
                .exclude(status="cancelled")
                .filter(
                    models.Q(scheduled_at__lt=meeting.scheduled_at)
                    & (models.Q(service__isnull=False) | models.Q(attendees__role="trainer"))
                )
                .exists()
            )
            if not earlier_coaching:
                return "Initial 2-Hour Coaching Discovery Meeting"
        return "Weekly Coaching Session"
    return meeting.title or "Administration Meeting"


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

    client_user = client_attendee.user if client_attendee and client_attendee.user else None
    client_name = "No client attached"
    if client_user:
        name = f"{client_user.first_name} {client_user.last_name}".strip()
        client_name = name or client_user.username or client_user.email

    program_display = determine_program_name(meeting, client_user) or "Not selected yet"
    call_type = determine_call_type(meeting, role_info, client_user)

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

    # Drill-down details: coaches, salesperson, Program #, meeting topic.
    coach_names, sales_names = [], []
    for sa in staff_attendees:
        if not sa.user:
            continue
        name = _person_name(sa.user)
        if sa.role == "trainer" or getattr(sa.user, "role", "") == "trainer":
            coach_names.append(name)
        elif sa.role == "sales" or getattr(sa.user, "role", "") == "sales":
            sales_names.append(name)
    if not sales_names and getattr(meeting.scheduled_by, "role", "") == "sales":
        sales_names.append(_person_name(meeting.scheduled_by))
    if not sales_names and client_user is not None:
        profile = getattr(client_user, "client_profile", None)
        if profile is not None and profile.assigned_sales:
            sales_names.append(_person_name(profile.assigned_sales))
    if not coach_names and getattr(meeting, "service", None) is not None:
        service = meeting.service
        team = ([service.trainer] if service.trainer and service.trainer.role == "trainer" else [])
        team += list(service.advisors.all())
        coach_names = [_person_name(u) for u in team]
    coach_names = list(dict.fromkeys(n for n in coach_names if n))
    sales_names = list(dict.fromkeys(n for n in sales_names if n))
    program_number = program_number_for(
        meeting.service.title if getattr(meeting, "service", None) else program_display
    )
    meeting_topic = meeting_topic_for(meeting, call_type, client_user)

    return {
        "coaches": ", ".join(coach_names),
        "salesperson": ", ".join(sales_names),
        "programNumber": program_number,
        "meetingTopic": meeting_topic,
        "id": meeting.id,
        "title": meeting.title or meeting_type_name,
        "advisor": advisor_display,
        "advisor_name": advisor_display,
        "program": program_display,
        "program_name": program_display,
        "meetingType": meeting_type_name,
        "meeting_type": meeting_type_name,
        "callType": call_type,
        "call_type": call_type,
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

