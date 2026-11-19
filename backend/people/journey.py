"""Client journey stage tracking and next-step reminders.

Works out where each client is in the sales -> coaching journey from data the
system already records, and builds a "where you are / next steps" email plus a
dashboard notification for everyone involved: the client, their assigned
salesperson, and their program coaches.

Used by the `send_journey_reminders` management command (run daily by cron).
"""

import logging
from dataclasses import dataclass, field
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from comms.models import Notification
from comms.utils import INFO_EMAIL

logger = logging.getLogger(__name__)

TOTAL_ASSESSMENTS = 6
LOGIN_URL = "https://theceoinfluencers.com/login"
ASSESSMENT_URL = "https://assessment.theceoinfluencers.com"
TITLE_PREFIX = "Next steps:"

# How often to repeat a reminder while a client stays in the same stage.
DEFAULT_REMINDER_DAYS = 3
ACTIVE_COACHING_REMINDER_DAYS = 7

STAGE_LABELS = {
    "account_created": "Account created - discovery call to be scheduled",
    "discovery_scheduled": "Discovery call scheduled",
    "awaiting_payment": "Discovery call done - awaiting program payment",
    "onboarding": "Program paid - onboarding assessments",
    "coaching": "Active coaching program",
}


@dataclass
class Message:
    user: object
    role: str
    subject: str
    body: str
    notification: str


@dataclass
class JourneyState:
    client: object
    stage: str
    completed_assessments: int
    next_meeting: object = None
    coaches: list = field(default_factory=list)
    had_discovery_meeting: bool = False

    @property
    def label(self):
        return STAGE_LABELS[self.stage]

    @property
    def reminder_days(self):
        return ACTIVE_COACHING_REMINDER_DAYS if self.stage == "coaching" else DEFAULT_REMINDER_DAYS


def _name(user):
    if not user:
        return ""
    return (user.get_full_name() or "").strip() or user.email or user.username


def _first_name(user):
    return (getattr(user, "first_name", "") or "").strip() or "there"


def _fmt(dt):
    if not dt:
        return "TBD"
    local = timezone.localtime(dt)
    return f"{local.strftime('%A, %B %d, %Y at %I:%M %p')} ({local.tzname() or settings.TIME_ZONE})"


def _completed_assessments(client):
    from lms.models import ClientFormAnswers

    return (
        ClientFormAnswers.objects.filter(user_email__iexact=client.email)
        .exclude(questionnaire_title__startswith="__")
        .values("questionnaire_title")
        .distinct()
        .count()
    )


def _coaches(client):
    """Trainer + advisors of every program the client is enrolled in."""
    from lms.models import Enrollment

    coaches, seen = [], set()
    enrollments = (
        Enrollment.objects.filter(user=client.user)
        .select_related("service__trainer")
        .prefetch_related("service__advisors")
    )
    for enrollment in enrollments:
        service = enrollment.service
        if not service:
            continue
        for coach in [service.trainer, *service.advisors.all()]:
            if coach and coach.id not in seen and coach.is_active:
                seen.add(coach.id)
                coaches.append(coach)
    return coaches


def _next_meeting(client):
    from scheduling.models import Meeting

    return (
        Meeting.objects.filter(
            attendees__user=client.user,
            status__in=["scheduled", "confirmed"],
            scheduled_at__gte=timezone.now(),
        )
        .order_by("scheduled_at")
        .distinct()
        .first()
    )


def _had_coaching_discovery_meeting(client):
    """True once the client's first coaching meeting (the 2-hour discovery) has happened."""
    from django.db.models import Q

    from scheduling.models import Meeting

    return (
        Meeting.objects.filter(attendees__user=client.user)
        .exclude(status="cancelled")
        .filter(scheduled_at__lt=timezone.now())
        .filter(Q(service__isnull=False) | Q(attendees__role="trainer"))
        .exists()
    )


def get_journey_state(client):
    """Return the client's current JourneyState, or None if no reminders apply."""
    user = client.user
    if not user or not user.is_active or getattr(user, "is_suspended", False):
        return None

    completed = _completed_assessments(client)
    next_meeting = _next_meeting(client)
    coaches = _coaches(client)
    now = timezone.now()

    if client.program_status in ("paid", "trial"):
        stage = "onboarding" if completed < TOTAL_ASSESSMENTS else "coaching"
    elif client.meeting_status == "scheduled" and (
        (client.meeting_scheduled_at and client.meeting_scheduled_at >= now) or next_meeting
    ):
        stage = "discovery_scheduled"
    elif client.meeting_status == "completed" or (
        client.meeting_status == "scheduled"
        and client.meeting_scheduled_at
        and client.meeting_scheduled_at < now
    ):
        stage = "awaiting_payment"
    else:
        stage = "account_created"

    return JourneyState(
        client=client,
        stage=stage,
        completed_assessments=completed,
        next_meeting=next_meeting,
        coaches=coaches,
        had_discovery_meeting=(
            _had_coaching_discovery_meeting(client) if stage in ("onboarding", "coaching") else False
        ),
    )


def _assessment_line(state):
    remaining = max(TOTAL_ASSESSMENTS - state.completed_assessments, 0)
    if not remaining:
        return f"Assessments: all {TOTAL_ASSESSMENTS} completed."
    return (
        f"Assessments: {state.completed_assessments} of {TOTAL_ASSESSMENTS} completed "
        f"({remaining} remaining)."
    )


def _meeting_when(state):
    if state.next_meeting:
        return _fmt(state.next_meeting.scheduled_at)
    return _fmt(state.client.meeting_scheduled_at)


def _client_steps(state):
    client = state.client
    sales = client.assigned_sales
    if state.stage == "account_created":
        steps = [
            f"Complete your {TOTAL_ASSESSMENTS} assessments at {ASSESSMENT_URL}.",
            "Your sales influencer will schedule your discovery call with you.",
        ]
    elif state.stage == "discovery_scheduled":
        steps = [
            f"Attend your discovery call on {_meeting_when(state)}.",
            f"Complete your assessments before the call at {ASSESSMENT_URL}.",
        ]
    elif state.stage == "awaiting_payment":
        steps = [
            "Review your program proposal and complete your program payment.",
            "Reply to your sales influencer with any questions about your program.",
        ]
    elif state.stage == "onboarding":
        steps = [
            (
                f"Complete your remaining assessments at {ASSESSMENT_URL} before your "
                "initial 2-hour new Client Discovery meeting."
                if not state.had_discovery_meeting
                else f"Complete your remaining assessments at {ASSESSMENT_URL}."
            ),
            (
                f"Attend your next coaching session on {_fmt(state.next_meeting.scheduled_at)}."
                if state.next_meeting
                else "Your coaching team will confirm your first coaching session."
            ),
        ]
        if not state.had_discovery_meeting:
            steps.append(
                "Your coaches will review your assessment results with you in that meeting."
            )
    else:
        steps = [
            (
                f"Attend your next coaching session on {_fmt(state.next_meeting.scheduled_at)}."
                if state.next_meeting
                else "Keep Tuesday, Wednesday, or Thursday open for your weekly coaching session."
            ),
            "Complete any homework assigned before each session.",
        ]

    contacts = []
    if state.stage in ("onboarding", "coaching") and state.coaches:
        for coach in state.coaches:
            contacts.append(f"{_name(coach)}: {coach.email}" if coach.email else _name(coach))
    elif sales:
        contacts.append(f"{_name(sales)}: {sales.email}" if sales.email else _name(sales))
    contacts.append(f"Administration: {INFO_EMAIL}")
    return steps, contacts


def _sales_steps(state):
    if state.stage == "account_created":
        return ["Schedule the client's discovery call from your sales dashboard."]
    if state.stage == "discovery_scheduled":
        return [
            f"Hold the discovery call on {_meeting_when(state)}.",
            "Remind the client to complete their assessments before the call.",
        ]
    if state.stage == "awaiting_payment":
        return [
            "Mark the discovery call completed and send the program payment link.",
            "Follow up with the client until payment is complete.",
        ]
    if state.stage == "onboarding":
        return ["Confirm the client's handoff to their coaching team."]
    return []


def _discovery_review_step(state):
    when = (
        f" on {_fmt(state.next_meeting.scheduled_at)}"
        if state.next_meeting
        else " (schedule it from your coaching dashboard)"
    )
    return (
        f"Review the client's {TOTAL_ASSESSMENTS} TCI assessment results with them in the "
        f"initial 2-hour new Client Discovery meeting{when}."
    )


def _coach_steps(state):
    if state.stage in ("onboarding", "coaching") and not state.had_discovery_meeting:
        if state.stage == "onboarding":
            return [
                "Review the client's assessment results in your coaching dashboard as they are completed "
                f"({state.completed_assessments} of {TOTAL_ASSESSMENTS} so far).",
                _discovery_review_step(state),
            ]
        return [
            f"All {TOTAL_ASSESSMENTS} assessments are complete - review the results in your coaching dashboard.",
            _discovery_review_step(state),
        ]
    if state.stage == "onboarding":
        return [
            "Review the client's assessment results in your coaching dashboard as they are completed.",
            (
                f"Prepare for the next coaching session on {_fmt(state.next_meeting.scheduled_at)}."
                if state.next_meeting
                else "Schedule the client's next coaching session."
            ),
        ]
    if state.stage == "coaching":
        return [
            (
                f"Prepare for the next coaching session on {_fmt(state.next_meeting.scheduled_at)}."
                if state.next_meeting
                else "Schedule the client's next weekly coaching session."
            ),
            "Assign and review homework before each session.",
        ]
    return []


def _bullets(items):
    return "\n".join(f"- {item}" for item in items)


def build_messages(state):
    """Role-specific email + dashboard notification text for one client's stage."""
    client = state.client
    client_user = client.user
    client_name = _name(client_user)
    subject_tail = "The CEO Influencers"
    messages = []

    steps, contacts = _client_steps(state)
    messages.append(
        Message(
            user=client_user,
            role="client",
            subject=f"Your Next Steps: {state.label} - {subject_tail}",
            body=(
                f"Hi {_first_name(client_user)},\n\n"
                "Here is where you are in your CEO Influencers journey.\n\n"
                f"Current step: {state.label}\n"
                f"{_assessment_line(state)}\n\n"
                f"Your next steps:\n{_bullets(steps)}\n\n"
                f"Your points of contact:\n{_bullets(contacts)}\n\n"
                f"Login page: {LOGIN_URL}\n\n"
                "If you have any questions, reply to this email and our team will assist you."
            ),
            notification=f"Current step: {state.label}. Next: {steps[0]}",
        )
    )

    staff = []
    sales_steps = _sales_steps(state)
    if client.assigned_sales and sales_steps:
        staff.append((client.assigned_sales, "sales", sales_steps))
    coach_steps = _coach_steps(state)
    if coach_steps:
        staff.extend((coach, "coach", coach_steps) for coach in state.coaches)

    for user, role, role_steps in staff:
        messages.append(
            Message(
                user=user,
                role=role,
                subject=f"Client Next Steps: {client_name} - {state.label}",
                body=(
                    f"Hi {_first_name(user)},\n\n"
                    f"Here is where {client_name} is in the client journey.\n\n"
                    f"Client: {client_name} ({client_user.email})\n"
                    f"Current step: {state.label}\n"
                    f"{_assessment_line(state)}\n"
                    f"Next meeting: {_fmt(state.next_meeting.scheduled_at) if state.next_meeting else 'None scheduled'}\n\n"
                    f"Your next steps:\n{_bullets(role_steps)}\n\n"
                    f"Login page: {LOGIN_URL}"
                ),
                notification=f"{client_name} - {state.label}. Next: {role_steps[0]}",
            )
        )
    return messages


def _notification_title(state):
    return f"{TITLE_PREFIX} {state.label}"


def _recently_reminded(user, state, now):
    return Notification.objects.filter(
        user=user,
        title=_notification_title(state),
        related_id=state.client.id,
        created_at__gte=now - timedelta(days=state.reminder_days),
    ).exists()


def send_journey_reminders_for_client(client, *, dry_run=False, now=None):
    """Send due stage reminders for one client. Returns the list of Messages sent."""
    now = now or timezone.now()
    state = get_journey_state(client)
    if state is None:
        return []

    sent = []
    for message in build_messages(state):
        user = message.user
        if not user or not user.is_active or _recently_reminded(user, state, now):
            continue
        if dry_run:
            sent.append(message)
            continue

        Notification.objects.create(
            user=user,
            title=_notification_title(state),
            message=message.notification[:500],
            type="system",
            related_id=client.id,
        )
        if user.email:
            try:
                send_mail(
                    subject=message.subject,
                    message=message.body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception(
                    "Failed to send journey reminder (%s) to user %s for client %s",
                    state.stage,
                    user.id,
                    client.id,
                )
        sent.append(message)
    return sent
