"""Client-facing confirmation emails for meetings scheduled by sales."""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from comms.utils import INFO_EMAIL

logger = logging.getLogger(__name__)

FRONTEND_BASE_URL = "https://theceoinfluencers.com"


def _display_name(user):
    if not user:
        return ""
    return (user.get_full_name() or "").strip() or user.email or user.username


def is_initial_sales_meeting(meeting, client_user):
    """True if this is the client's first (non-cancelled) meeting scheduled by sales."""
    from .models import Meeting

    return (
        not Meeting.objects.filter(attendees__user=client_user, scheduled_by__role="sales")
        .exclude(id=meeting.id)
        .exclude(status="cancelled")
        .exists()
    )


def _meeting_links(meeting, client_user):
    base_url = getattr(settings, "FRONTEND_BASE_URL", FRONTEND_BASE_URL).rstrip("/")
    links = {
        "login_url": f"{base_url}/login",
        "forgot_password_url": f"{base_url}/forget-password",
        "meeting_url": f"{base_url}/client/meeting/{meeting.id}",
        "direct_meeting_url": None,
    }
    try:
        links["direct_meeting_url"] = meeting.get_room_join_url(client_user, is_owner=False)
    except Exception:
        logger.exception(
            "Failed to generate direct video link for sales meeting %s", meeting.id
        )
    return links


def build_sales_meeting_confirmation_email(meeting, client_user, sales_user, *, is_discovery):
    first_name = (client_user.first_name or "").strip() or "there"
    sales_name = _display_name(sales_user) or "our sales team"
    sales_email = (sales_user.email if sales_user and sales_user.email else INFO_EMAIL)

    local_start = timezone.localtime(meeting.scheduled_at)
    when = local_start.strftime("%A, %B %d, %Y at %I:%M %p")
    tz_name = local_start.tzname() or settings.TIME_ZONE
    duration_minutes = int(meeting.duration.total_seconds() // 60) if meeting.duration else 60

    links = _meeting_links(meeting, client_user)
    join_line = (
        f"Direct video call link: {links['direct_meeting_url']}\n"
        if links["direct_meeting_url"]
        else ""
    )

    if is_discovery:
        subject = "Your Discovery Call Has Been Scheduled - The CEO Influencers"
        intro = "Your discovery call with The CEO Influencers has been scheduled."
    else:
        subject = "Your Meeting Has Been Scheduled - The CEO Influencers"
        intro = f"Your meeting \"{meeting.title}\" with The CEO Influencers has been scheduled."

    message = (
        f"Hi {first_name},\n\n"
        f"{intro}\n\n"
        f"Date & time: {when} ({tz_name})\n"
        f"Duration: {duration_minutes} minutes\n\n"
        f"You have been assigned to {sales_name} who will be your point of contact. "
        f"You can reach them at {sales_email}.\n\n"
        "To join your video call at the scheduled time, use:\n"
        f"{join_line}"
        f"Client meeting page: {links['meeting_url']}\n\n"
        f"Login page: {links['login_url']}\n\n"
        "If you have trouble signing in, use the Forgot Password option on the login page "
        f"with this same email address: {links['forgot_password_url']}\n\n"
        "If you have any questions, reply to this email and our team will assist you."
    )
    return subject, message


def send_sales_meeting_confirmation(meeting, client_user, sales_user):
    """Email the client a confirmation for a meeting scheduled by sales.

    The client's first sales meeting is confirmed as a Discovery Call.
    Returns True if the email was sent.
    """
    if not client_user or not client_user.email:
        logger.warning(
            "Skipping sales meeting confirmation for meeting %s: client has no email",
            meeting.id,
        )
        return False

    subject, message = build_sales_meeting_confirmation_email(
        meeting,
        client_user,
        sales_user,
        is_discovery=is_initial_sales_meeting(meeting, client_user),
    )
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            recipient_list=[client_user.email],
            fail_silently=False,
            from_email=settings.DEFAULT_FROM_EMAIL,
        )
    except Exception:
        logger.exception(
            "Failed to send sales meeting confirmation to client for meeting %s",
            meeting.id,
        )
        return False
    return sent == 1
