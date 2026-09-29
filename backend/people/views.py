from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import models, transaction
from datetime import time, timedelta
from .models import Client, Lead, LeadAssessmentEntry, ClientNote
from .serializers import (
    SalesClientsResponseSerializer,
    SalesClientDetailResponseSerializer,
    ExistingClientsResponseSerializer,
    SalesCreateClientSerializer,
    LeadSerializer,
    LeadCreateSerializer,
    ClientDetailSerializer,
    LeadVerifyCodeSerializer,
    LeadAssessmentEntrySerializer,
    LeadSaveProgressSerializer,
    TrainerClientsResponseSerializer,
    # New serializers for client dashboard
    ClientProfileSerializer,
    ClientProfileUpdateSerializer,
    ClientMeetingSerializer,
    ClientMeetingCreateSerializer,
    ClientServicesSerializer,
    ClientNoteSerializer,
    ClientNoteCreateSerializer,
    ClientNoteUpdateSerializer,
    ClientChatSessionSerializer,
    ClientChatMessageSerializer,
    ClientChatMessageCreateSerializer,
)
from accounts.permissions import IsSales, IsTrainer, IsClientOrAssignedAdvisor
from comms.utils import (
    INFO_EMAIL,
    PAYMENT_CONFIRMATION_EMAILS,
    create_notifications,
    get_configured_recipients,
    send_internal_email,
    send_ops_email,
)
from scheduling.models import Appointment, Meeting, MeetingAttendee, MeetingType
from lms.models import Enrollment, Progress, Service
from messaging.models import ChatSession, ChatMessage, ChatMember
from django.utils import timezone
from django.utils.crypto import get_random_string
import secrets
import string
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
import uuid
from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import stripe
from rest_framework.permissions import AllowAny
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

ZERO_DECIMAL_CURRENCIES = {
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "ugx",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf",
}


CLIENT_LOGIN_URL = "https://theceoinfluencers.com/login"
CLIENT_FORGOT_PASSWORD_URL = "https://theceoinfluencers.com/forget-password"
CLIENT_DASHBOARD_URL = "https://theceoinfluencers.com/client-dashboard"
CLIENT_CALENDAR_URL = "https://theceoinfluencers.com/client-dashboard/calendar"
CLIENT_DASHBOARD_PROCESS_VIDEO_URL = "https://theceoinfluencers.com/videos/intro-video.mp4"
CLIENT_ASSESSMENT_URL = "https://assessment.theceoinfluencers.com"
CLIENT_SUPPORT_EMAIL = INFO_EMAIL


def _display_name(user):
    if not user:
        return ""
    return (user.get_full_name() or "").strip() or user.email or user.username


def _format_money(amount, currency):
    try:
        amount_decimal = Decimal(str(amount))
        if str(currency).lower() in ZERO_DECIMAL_CURRENCIES:
            amount_decimal = amount_decimal.quantize(Decimal("1"))
        else:
            amount_decimal = amount_decimal.quantize(Decimal("0.01"))
        return f"{amount_decimal} {str(currency).upper()}"
    except Exception:
        return f"{amount} {str(currency).upper()}"


def _service_coaching_team(service):
    if not service:
        return []

    team = []
    if service.trainer:
        team.append(service.trainer)
    team.extend(service.advisors.all())

    unique_team = []
    seen_user_ids = set()
    for staff_user in team:
        if not staff_user or staff_user.id in seen_user_ids:
            continue
        seen_user_ids.add(staff_user.id)
        unique_team.append(staff_user)
    return unique_team


def _service_from_metadata(metadata):
    program_id = (
        metadata.get("program_id")
        or metadata.get("service_id")
        or metadata.get("program")
    )
    if not program_id:
        return None

    return Service.objects.filter(id=program_id).first()


def _payment_metadata(stripe_payment, payment_intent=None):
    metadata = {}
    if stripe_payment and isinstance(stripe_payment.metadata, dict):
        metadata.update(stripe_payment.metadata)
    if payment_intent is not None:
        intent_metadata = payment_intent.get("metadata", {})
        if hasattr(intent_metadata, "to_dict_recursive"):
            metadata.update(intent_metadata.to_dict_recursive())
        elif isinstance(intent_metadata, dict):
            metadata.update(intent_metadata)
        else:
            try:
                metadata.update(dict(intent_metadata))
            except (TypeError, ValueError):
                pass
    return metadata


def _paid_client_confirmation_cc(user, service=None):
    recipients = get_configured_recipients(
        "PAID_CLIENT_CONFIRMATION_CC_EMAILS", [INFO_EMAIL]
    )

    if service:
        recipients.extend(
            staff_user.email
            for staff_user in _service_coaching_team(service)
            if staff_user.email
        )
    else:
        recipients.extend(
            staff_user.email
            for staff_user in _get_client_payment_notification_users(user)
            if staff_user.email
        )

    normalized = []
    seen = {str(user.email or "").strip().lower()}
    for recipient in recipients:
        email = str(recipient or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        normalized.append(email)
    return normalized


def _next_coaching_meeting(user, service=None):
    meetings = (
        Meeting.objects.filter(
            attendees__user=user,
            attendees__role="client",
            scheduled_at__gte=timezone.now(),
            status__in=["scheduled", "confirmed", "active"],
        )
        .select_related("meeting_type", "service")
        .order_by("scheduled_at")
        .distinct()
    )

    if service:
        service_team_ids = [staff_user.id for staff_user in _service_coaching_team(service)]
        scoped_meetings = meetings.filter(
            models.Q(service=service)
            | models.Q(title__icontains=service.title)
            | models.Q(attendees__user_id__in=service_team_ids)
        ).distinct()
        meeting = scoped_meetings.first()
        if meeting:
            return meeting

    return meetings.first()


def _create_first_coaching_meeting(user, service):
    if not user or not service:
        return None

    coaching_team = _service_coaching_team(service)
    if not coaching_team:
        return None

    participants = [user] + coaching_team
    meeting_duration = timedelta(hours=1)
    candidate_times = [
        time(10, 0),
        time(11, 0),
        time(14, 0),
        time(15, 0),
        time(16, 0),
    ]
    allowed_weekdays = {1, 2, 3}  # Tuesday, Wednesday, Thursday
    today = timezone.localdate()

    meeting_type, _ = MeetingType.objects.get_or_create(
        name="Program Session",
        defaults={
            "description": "Training session for enrolled programs",
            "requires_trainers": True,
            "allows_multiple_trainers": True,
        },
    )

    for day_offset in range(1, 31):
        candidate_date = today + timedelta(days=day_offset)
        if candidate_date.weekday() not in allowed_weekdays:
            continue

        for candidate_time in candidate_times:
            scheduled_at = timezone.datetime.combine(candidate_date, candidate_time)
            if timezone.is_naive(scheduled_at):
                scheduled_at = timezone.make_aware(
                    scheduled_at, timezone.get_current_timezone()
                )
            if scheduled_at <= timezone.now():
                continue

            with transaction.atomic():
                Meeting.lock_users_for_scheduling(participants)
                if _next_coaching_meeting(user, service):
                    return _next_coaching_meeting(user, service)
                if Meeting.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
                    duration=meeting_duration,
                ):
                    continue
                if Appointment.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
                    duration=meeting_duration,
                ):
                    continue

                meeting = Meeting.objects.create(
                    title=f"{service.title} - First Coaching Advisor Meeting",
                    meeting_type=meeting_type,
                    scheduled_by=coaching_team[0],
                    scheduled_at=scheduled_at,
                    duration=meeting_duration,
                    status="scheduled",
                    notes=(
                        "Automatically scheduled after client payment confirmation."
                    ),
                    location="Online",
                    service=service,
                )
                MeetingAttendee.objects.create(
                    meeting=meeting,
                    user=user,
                    role="client",
                    is_confirmed=True,
                )
                for staff_user in coaching_team:
                    MeetingAttendee.objects.create(
                        meeting=meeting,
                        user=staff_user,
                        role="trainer",
                        is_confirmed=False,
                    )
                return meeting

    return None


def _ensure_first_coaching_meeting(user, service=None):
    meeting = _next_coaching_meeting(user, service)
    if meeting:
        return meeting
    return _create_first_coaching_meeting(user, service)


def _meeting_schedule_line(user, service=None, meeting=None):
    meeting = meeting or _next_coaching_meeting(user, service)
    if not meeting:
        return (
            "Your first coaching influencer advisor meeting is not scheduled yet. "
            f"Please schedule it from your Client Dashboard calendar: {CLIENT_CALENDAR_URL}"
        )

    local_time = timezone.localtime(meeting.scheduled_at)
    return (
        "Your first coaching influencer advisor meeting is scheduled for "
        f"{local_time.strftime('%A, %B %d, %Y at %I:%M %p %Z')}."
    )


def _apply_paid_program_access(user, metadata):
    """Mark the client paid and enroll them in the selected program when provided."""

    service = _service_from_metadata(metadata)

    client = getattr(user, "client_profile", None)
    if client:
        client.program_status = "paid"
        client.contract_status = "signed"
        client.save(update_fields=["program_status", "contract_status", "updated_at"])

    user.status = "paid"
    user.save(update_fields=["status"])

    enrollment = None
    if service:
        enrollment, _ = Enrollment.objects.get_or_create(
            user=user,
            service=service,
            defaults={"completed": False},
        )

    return service, enrollment


def send_paid_client_welcome_email_once(
    stripe_payment, user, service=None, first_meeting=None
):
    """Send the advisor-team welcome email once per successful client payment."""

    if not stripe_payment or not user or not user.email:
        return

    metadata = (
        stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    )
    if metadata.get("paid_client_welcome_email_sent"):
        return

    client_name = (user.get_full_name() or "").strip() or (user.first_name or "").strip() or "there"
    coaching_team = _service_coaching_team(service)

    # Contact line always leads with admin, followed by any assigned advisors.
    contact_parts = [f"Administration <{CLIENT_SUPPORT_EMAIL}>"]
    for staff_user in coaching_team:
        name = _display_name(staff_user)
        contact_parts.append(
            f"{name} <{staff_user.email}>" if staff_user.email else name
        )
    coaching_team_contacts = ", ".join(contact_parts)

    # Advisory team intro paragraph uses the dynamically assigned advisor names.
    if coaching_team:
        team_names = " and ".join(_display_name(m) for m in coaching_team)
        team_intro = (
            f"Your new coaching influencer advisory team will be comprised of {team_names} "
            "who are ready to fully support your full cycle new client journey to success."
        )
    else:
        team_intro = (
            "Your new coaching influencer advisory team is ready to fully support "
            "your full cycle new client journey to success."
        )

    dashboard_video_url = getattr(
        settings,
        "CLIENT_DASHBOARD_PROCESS_VIDEO_URL",
        CLIENT_DASHBOARD_PROCESS_VIDEO_URL,
    )

    subject = "Welcome to Your CEO Influencers Program"
    message = (
        f"Hello and Welcome {client_name},\n\n"
        "On behalf of the entire CEO Influencers team, we want to welcome you to the program "
        "and thank you for the trust you have placed in us! We are excited to collaborate on "
        "your new program journey together and have outlined our step-by-step process below to "
        "help best support your success in your Live 2:1 Executive Leadership Coaching Program journey.\n\n"
        f"{team_intro}\n\n"
        f"{_meeting_schedule_line(user, service, meeting=first_meeting)}\n\n"
        "Prior to your first 2-hour new client Coaching Discovery Meeting, you will need to complete "
        "our 6 comprehensive personal and professional assessments. These will provide us with the "
        "critical foundational information needed to help customize and fully optimize your program. "
        "All of your information is kept STRICTLY CONFIDENTIAL and will only be reviewed and accessed "
        "by your assigned coaching advisory team to review together during your initial 2-hour coaching "
        "discovery meeting.\n\n"
        "Here is a brief overview of your new client process:\n"
        "- Please log in to your personalized Client Dashboard and to review your program overview.\n"
        "- Then complete the 6 new client onboarding assessment questionnaires or assigned homework before each meeting.\n"
        "- Please keep your weekly one-hour coaching sessions calendar open for Tuesday, Wednesday, or Thursday to keep a consistent weekly meeting cadence.\n\n"
        "Advisory team contact and communication standards:\n"
        f"- Coaching advisor team: {coaching_team_contacts}\n"
        "- Advisor office hours are Monday and Friday for questions, follow-up, and weekly session planning.\n"
        "- Client coaching meetings are scheduled every Tuesday, Wednesday, and Thursday for a 1-hour coaching session.\n"
        "- For urgent client issues or platform challenges, email info@theceoinfluencers.com anytime.\n\n"
        "Client Login and Client Dashboard Reference:\n"
        f"- Login page: {CLIENT_LOGIN_URL}\n"
        f"- Client Dashboard: {CLIENT_DASHBOARD_URL}\n"
        f"- Dashboard Process Video: {dashboard_video_url}\n\n"
        "Please flag and keep this email for future reference throughout the program.\n\n"
        "Best regards,\n"
        "The CEO Influencers Coaching Advisor Team"
    )

    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
        cc=_paid_client_confirmation_cc(user, service),
    )
    sent = email.send(fail_silently=True)
    if sent:
        metadata["paid_client_welcome_email_sent"] = True
        metadata["paid_client_welcome_email_sent_at"] = timezone.now().isoformat()
        stripe_payment.metadata = metadata
        stripe_payment.save(update_fields=["metadata"])


def send_payment_thank_you_once(
    stripe_payment,
    user,
    amount,
    currency,
    payment_intent_id,
    service=None,
    first_meeting=None,
):
    """Send a payment verification email once per successful payment record."""
    if not stripe_payment or not user or not user.email:
        return

    metadata = (
        stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    )
    if metadata.get("thank_you_email_sent"):
        return

    first_name = (user.first_name or "").strip() or "there"
    program_name = service.title if service else metadata.get("program_title", "your program")
    subject = "Payment Confirmed - The CEO Influencers"
    meeting_step = (
        f"- {_meeting_schedule_line(user, service, meeting=first_meeting)}"
        if first_meeting
        else f"- Schedule your first coaching influencer advisor meeting: {CLIENT_CALENDAR_URL}"
    )
    message = (
        f"Hi {first_name},\n\n"
        "Your payment has been verified successfully.\n\n"
        f"Program: {program_name}\n"
        f"Amount: {_format_money(amount, currency)}\n"
        f"Reference: {payment_intent_id}\n\n"
        "Next steps:\n"
        f"- Log in to your Client Dashboard: {CLIENT_DASHBOARD_URL}\n"
        f"{meeting_step}\n"
        "- Complete any onboarding questionnaire or homework before your first meeting.\n"
        "- Keep Tuesday, Wednesday, or Thursday available for your weekly one-hour coaching sessions.\n\n"
        "You will also receive a welcome email from your coaching influencer advisor team with preparation details, office hours, and dashboard reference instructions.\n\n"
        f"For support, contact {CLIENT_SUPPORT_EMAIL}.\n\n"
        "Best regards,\n"
        "The CEO Influencers Team"
    )

    try:
        email = EmailMessage(
            subject=subject,
            from_email=settings.DEFAULT_FROM_EMAIL,
            body=message,
            to=[user.email],
            cc=_paid_client_confirmation_cc(user, service),
        )
        email.send(fail_silently=True)
        metadata["thank_you_email_sent"] = True
        metadata["thank_you_email_sent_at"] = timezone.now().isoformat()
        stripe_payment.metadata = metadata
        stripe_payment.save(update_fields=["metadata"])
    except Exception:
        logger.exception(
            "Failed to send payment thank-you email for payment intent %s",
            payment_intent_id,
        )


def _get_client_payment_notification_users(user):
    client_profile = getattr(user, "client_profile", None)
    staff_users = []

    if client_profile and client_profile.assigned_sales:
        staff_users.append(client_profile.assigned_sales)

    enrollments = (
        Enrollment.objects.filter(user=user)
        .select_related("service__trainer")
        .prefetch_related("service__advisors")
    )
    for enrollment in enrollments:
        service = getattr(enrollment, "service", None)
        if not service:
            continue
        if service.trainer:
            staff_users.append(service.trainer)
        staff_users.extend(service.advisors.all())

    unique_staff = []
    seen_user_ids = set()
    for staff_user in staff_users:
        if not staff_user or staff_user.id in seen_user_ids:
            continue
        seen_user_ids.add(staff_user.id)
        unique_staff.append(staff_user)
    return unique_staff


def send_staff_payment_notifications_once(
    stripe_payment, user, amount, currency, payment_intent_id
):
    if not stripe_payment or not user:
        return

    metadata = (
        stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    )
    staff_users = _get_client_payment_notification_users(user)
    internal_recipients = get_configured_recipients(
        "PAYMENT_CONFIRMATION_NOTIFICATION_EMAILS", PAYMENT_CONFIRMATION_EMAILS
    )
    staff_email_recipients = internal_recipients + [
        staff_user.email for staff_user in staff_users if staff_user.email
    ]
    subject = "Client Payment Confirmed - The CEO Influencers"
    message = (
        f"Client: {user.get_full_name().strip() or user.email}\n"
        f"Email: {user.email}\n"
        f"Amount: ${amount}\n"
        f"Currency: {currency}\n"
        f"Reference: {payment_intent_id}\n"
        f"Program status: {getattr(getattr(user, 'client_profile', None), 'program_status', 'unknown')}"
    )

    metadata_updated = False

    if not metadata.get("staff_payment_confirmation_email_sent"):
        email_sent = send_internal_email(
            subject=subject,
            message=message,
            recipient_list=staff_email_recipients,
            fail_silently=True,
        )
        if email_sent:
            metadata["staff_payment_confirmation_email_sent"] = True
            metadata["staff_payment_confirmation_email_sent_at"] = (
                timezone.now().isoformat()
            )
            metadata_updated = True

    if not metadata.get("staff_payment_notification_sent"):
        created_count = create_notifications(
            staff_users,
            title="Client payment confirmed",
            message=(
                f"{user.get_full_name().strip() or user.email} has completed payment. Reference: {payment_intent_id}."
            ),
            notification_type="system",
        )
        if created_count:
            metadata["staff_payment_notification_sent"] = True
            metadata["staff_payment_notification_sent_at"] = timezone.now().isoformat()
            metadata_updated = True

    if metadata_updated:
        stripe_payment.metadata = metadata
        stripe_payment.save(update_fields=["metadata"])


def finalize_successful_client_payment(
    stripe_payment, user, amount, currency, payment_intent_id, payment_intent=None
):
    metadata = _payment_metadata(stripe_payment, payment_intent)
    service, enrollment = _apply_paid_program_access(user, metadata)
    first_meeting = _ensure_first_coaching_meeting(user, service)

    stored_metadata = (
        stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    )
    stored_metadata.update(metadata)
    if service:
        stored_metadata["program_id"] = str(service.id)
        stored_metadata["program_title"] = service.title
    if enrollment:
        stored_metadata["enrollment_id"] = str(enrollment.id)

    stripe_payment.status = "succeeded"
    stripe_payment.metadata = stored_metadata
    stripe_payment.save(update_fields=["status", "metadata"])

    send_payment_thank_you_once(
        stripe_payment,
        user,
        amount,
        currency,
        payment_intent_id,
        service=service,
        first_meeting=first_meeting,
    )
    send_paid_client_welcome_email_once(
        stripe_payment,
        user,
        service=service,
        first_meeting=first_meeting,
    )
    send_staff_payment_notifications_once(
        stripe_payment,
        user,
        amount,
        currency,
        payment_intent_id,
    )

    return service, enrollment


class SalesClientsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Get current user (sales person)
        sales_person = request.user

        # Get clients assigned to this sales person
        clients = Client.objects.filter(assigned_sales=sales_person).order_by(
            "-created_at"
        )

        # Calculate statistics
        calls_pending = 0  # Placeholder - SalesCall model not implemented
        calls_scheduled = 0  # Placeholder - SalesCall model not implemented

        awaiting_purchase = clients.filter(is_awaiting_purchase=True).count()

        response_data = {
            "callsPending": calls_pending,
            "callsScheduled": calls_scheduled,
            "awaitingPurchase": awaiting_purchase,
            "clients": clients,
        }

        serializer = SalesClientsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SalesClientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request, user_uuid):
        # Get current user (sales person)
        sales_person = request.user

        # Get the client - ensure it's assigned to this sales person
        client = get_object_or_404(
            Client, user__id=user_uuid, assigned_sales=sales_person
        )

        # Get meetings between sales person and client
        meetings = Appointment.objects.filter(
            trainer=sales_person, client=client.user
        ).order_by("-scheduled_at")

        # Get services enrolled by the client
        services_enrolled = (
            Enrollment.objects.filter(user=client.user)
            .select_related("service")
            .order_by("-enrolled_at")
        )

        response_data = {
            "clientDetails": client,
            "meetings": meetings,
            "servicesEnrolled": services_enrolled,
        }

        serializer = SalesClientDetailResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GeneratePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request, user_uuid):
        # Get current user (sales person)
        sales_person = request.user

        # Get the client - ensure it's assigned to this sales person
        client = get_object_or_404(
            Client, user__id=user_uuid, assigned_sales=sales_person
        )

        # Generate a secure random password
        password_length = 12
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        secure_password = "".join(
            secrets.choice(characters) for _ in range(password_length)
        )

        # Set hashed password directly; never persist plaintext.
        client.user.set_password(secure_password)
        client.user.save(update_fields=["password"])

        return Response(
            {
                "message": "Password generated successfully",
                "newPassword": secure_password,
                "clientId": str(client.user.id),
                "clientName": client.full_name,
            },
            status=status.HTTP_200_OK,
        )


class ExistingClientsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Get current user (sales person)
        sales_person = request.user

        # Get clients assigned to this sales person with pending meeting status
        clients = Client.objects.filter(
            assigned_sales=sales_person, meeting_status="pending"
        ).order_by("-created_at")

        # Calculate statistics for pending clients
        total_pending = clients.count()
        awaiting_purchase = clients.filter(is_awaiting_purchase=True).count()

        response_data = {
            "totalPending": total_pending,
            "awaitingPurchase": awaiting_purchase,
            "clients": clients,
        }

        serializer = ExistingClientsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LeadsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Self-heal: if a sales meeting exists, ensure the client isn't stuck in "pending".
        pending_unpaid_ids = Client.objects.filter(
            program_status="unpaid", meeting_status="pending"
        ).values_list("user_id", flat=True)
        scheduled_client_ids = (
            MeetingAttendee.objects.filter(
                role="client",
                user_id__in=pending_unpaid_ids,
                meeting__status__in=["scheduled", "confirmed", "active"],
            )
            .filter(
                models.Q(meeting__scheduled_by__role="sales")
                | models.Q(meeting__attendees__role__in=["sales", "organizer"])
            )
            .values_list("user_id", flat=True)
            .distinct()
        )
        Client.objects.filter(
            meeting_status="pending", user_id__in=scheduled_client_ids
        ).update(meeting_status="scheduled")

        leads = Client.objects.filter(program_status="unpaid").order_by("-created_at")

        # Calculate count
        count = leads.count()

        response_data = {"count": count, "leads": leads}

        # Use existing ClientSerializer for the leads
        from .serializers import ClientSerializer

        serializer = ClientSerializer(leads, many=True)

        return Response(
            {"count": count, "leads": serializer.data}, status=status.HTTP_200_OK
        )


# Lead Management Views
class CreateLeadView(APIView):
    """Public endpoint for website lead capture form"""

    def post(self, request):
        serializer = LeadCreateSerializer(data=request.data)
        if serializer.is_valid():
            lead = serializer.save()
            return Response(
                {
                    "message": "Lead created successfully",
                    "lead_id": lead.id,
                    "access_code_sent": True,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeadsListView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        """Get all leads for sales admin panel"""
        leads = Lead.objects.all().order_by("-created_at")
        serializer = LeadSerializer(leads, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApproveMeetingView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request, lead_id):
        """Approve or reschedule meeting for a lead"""
        lead = get_object_or_404(Lead, id=lead_id)

        action = request.data.get("action")  # 'approve' or 'reschedule'
        approved_date = request.data.get("approved_date")
        approved_time = request.data.get("approved_time")

        if action == "approve":
            if not approved_date or not approved_time:
                return Response(
                    {
                        "error": "approved_date and approved_time are required for approval"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lead.approved_meeting_date = approved_date
            lead.approved_meeting_time = approved_time
            lead.meeting_status = "approved"
            lead.status = "meeting_scheduled"
            lead.assigned_sales = request.user
            lead.save()

            return Response(
                {
                    "message": "Meeting approved successfully",
                    "lead": LeadSerializer(lead).data,
                },
                status=status.HTTP_200_OK,
            )

        elif action == "reschedule":
            if not approved_date or not approved_time:
                return Response(
                    {
                        "error": "approved_date and approved_time are required for rescheduling"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lead.approved_meeting_date = approved_date
            lead.approved_meeting_time = approved_time
            lead.meeting_status = "rescheduled"
            lead.save()

            return Response(
                {
                    "message": "Meeting rescheduled successfully",
                    "lead": LeadSerializer(lead).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class AccessCodeLoginView(APIView):
    """Login endpoint for assessment website using access code"""

    def post(self, request):
        access_code = request.data.get("access_code")
        email = request.data.get("email")

        if not access_code or not email:
            return Response(
                {"error": "Access code and email are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lead = Lead.objects.get(
                email=email, access_code=access_code, access_code_used=False
            )

            # Mark access code as used
            lead.access_code_used = True
            lead.status = "qualified"
            lead.save()

            return Response(
                {
                    "message": "Login successful",
                    "lead_id": lead.id,
                    "lead_name": lead.full_name,
                    "has_assessment": hasattr(lead, "assessment"),
                },
                status=status.HTTP_200_OK,
            )

        except Lead.DoesNotExist:
            return Response(
                {"error": "Invalid access code or email"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubmitAssessmentView(APIView):
    """Submit assessment data for a lead"""

    def post(self, request, lead_id):
        try:
            lead = Lead.objects.get(id=lead_id, access_code_used=True)
        except Lead.DoesNotExist:
            return Response(
                {"error": "Lead not found or not authorized"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if assessment already exists
        if hasattr(lead, "assessment"):
            # Update existing assessment
            lead.assessment.assessment_data = request.data
            lead.assessment.save()
        else:
            # Create new assessment
            from .serializers import LeadAssessmentCreateSerializer

            serializer = LeadAssessmentCreateSerializer(
                data={"assessment_data": request.data}, context={"lead": lead}
            )
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"message": "Assessment submitted successfully"}, status=status.HTTP_200_OK
        )


class SalesCreatePaymentLinkView(APIView):
    """Create a Stripe payment link for a lead and email it"""

    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        lead_id = request.data.get("lead_id")
        amount = request.data.get("amount")
        program_id = request.data.get("program_id") or request.data.get("service_id")

        if not lead_id or not program_id:
            return Response(
                {"error": "lead_id and program_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lead = User.objects.filter(id=lead_id).first()
        if not lead:
            return Response(
                {"error": "Lead user not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        service = Service.objects.filter(id=program_id).first()
        if not service:
            return Response(
                {"error": "Selected program not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        client_profile = getattr(lead, "client_profile", None)
        if client_profile and client_profile.assigned_sales not in (None, request.user):
            return Response(
                {"error": "You are not authorized to send payment links to this client"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if amount in (None, ""):
            amount = service.price

        try:
            amount_decimal = Decimal(str(amount))
        except (InvalidOperation, TypeError):
            return Response(
                {"error": "Invalid amount supplied"}, status=status.HTTP_400_BAD_REQUEST
            )

        if amount_decimal <= 0:
            return Response(
                {"error": "Amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
        if not stripe_secret:
            return Response(
                {"error": "Stripe secret key is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        stripe.api_key = stripe_secret
        currency = str(request.data.get("currency") or "usd").strip().lower()
        is_zero_decimal_currency = currency in ZERO_DECIMAL_CURRENCIES

        if is_zero_decimal_currency and amount_decimal != amount_decimal.to_integral_value():
            return Response(
                {
                    "error": f"Amount for {currency.upper()} must be a whole number"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        multiplier = Decimal("1") if is_zero_decimal_currency else Decimal("100")
        unit_amount = int(
            (amount_decimal * multiplier).quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
        )

        metadata_payload = {
            "user_id": str(lead.id),
            "lead_id": str(lead.id),
            "lead_email": lead.email,
            "program_id": str(service.id),
            "program_title": service.title,
            "sales_user_id": str(request.user.id),
        }
        product_name = f"The CEO Influencers - {service.title}"

        try:
            price = stripe.Price.create(
                currency=currency,
                unit_amount=unit_amount,
                product_data={
                    "name": product_name,
                    "metadata": metadata_payload,
                },
                metadata=metadata_payload,
            )
            price_id = getattr(price, "id", None) or (
                price.get("id") if hasattr(price, "get") else None
            )
            if not price_id:
                return Response(
                    {"error": "Stripe did not return a price ID"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            payment_link = stripe.PaymentLink.create(
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                payment_intent_data={"metadata": metadata_payload},
                metadata=metadata_payload,
            )
        except stripe.error.StripeError as exc:
            error_message = getattr(exc, "user_message", str(exc))
            return Response(
                {"error": "Failed to create payment link", "details": error_message},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment_url = payment_link.get("url")
        if not payment_url:
            return Response(
                {"error": "Stripe did not return a payment link URL"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        amount_display = amount_decimal.quantize(
            Decimal("1") if is_zero_decimal_currency else Decimal("0.01")
        )
        amount_with_currency = f"{amount_display} {currency.upper()}"

        subject = "Payment Link from The CEO Influencers"
        message = (
            f"Hi {lead.first_name or lead.email},\n\n"
            f"Your personalized payment link for {service.title} is ready.\n"
            f"Amount due: {amount_with_currency}\n\n"
            f"Please complete your payment using the link below:\n\n"
            f"{payment_url}\n\n"
            "After payment is verified, you will receive your payment confirmation, full client-dashboard access, "
            "and instructions to schedule your first coaching influencer advisor meeting.\n\n"
            "If you have any questions, reply to this email and our sales team will assist you.\n\n"
            "Best regards,\n"
            "The CEO Influencers Team"
        )

        if not lead.email:
            return Response(
                {
                    "error": "Payment link created but lead has no email address",
                    "payment_link": payment_url,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        try:
            validate_email(lead.email)
        except ValidationError:
            return Response(
                {
                    "error": "Payment link created but lead email address is invalid",
                    "payment_link": payment_url,
                    "email": lead.email,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            sent = send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [lead.email],
                fail_silently=False,
            )
            if sent != 1:
                raise RuntimeError(f"send_mail() returned {sent}")
        except Exception as exc:
            # Surface misconfiguration that "succeeds" but doesn't actually deliver (console backend).
            logger.exception(
                "Payment link email failed to send (backend=%s from=%s to=%s)",
                getattr(settings, "EMAIL_BACKEND", None),
                getattr(settings, "DEFAULT_FROM_EMAIL", None),
                lead.email,
            )
            return Response(
                {
                    "error": "Payment link created but email failed to send",
                    "payment_link": payment_url,
                    "details": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Create a StripePayment record for tracking (will be updated by webhook)
        from lms.models import StripePayment

        stripe_payment = StripePayment.objects.create(
            user=lead,
            stripe_payment_intent_id=None,  # Will be set by webhook when PaymentIntent is created
            amount=amount_decimal,
            currency=currency.lower(),
            status="pending",
            metadata={
                "payment_link_id": payment_link.get("id"),
                "price_id": price_id,
                **metadata_payload,
            },
        )

        if client_profile:
            client_profile.assigned_sales = client_profile.assigned_sales or request.user
            client_profile.program_status = "unpaid"
            client_profile.contract_status = "sent_signed"
            client_profile.save(
                update_fields=[
                    "assigned_sales",
                    "program_status",
                    "contract_status",
                    "updated_at",
                ]
            )

        # Notify ops of payment link issuance
        send_ops_email(
            subject="Payment Link Created",
            message=(
                f"Lead: {lead.email}\n"
                f"Program: {service.title}\n"
                f"Amount: {amount_with_currency}\n"
                f"Payment link ID: {payment_link.get('id')}\n"
                f"URL: {payment_url}"
            ),
        )

        lead.payment_link_sent = True
        lead.payment_link_sent_at = timezone.now()
        lead.status = "payment_sent"
        lead.stripe_payment_id = payment_link.get("id")
        lead.save(
            update_fields=[
                "payment_link_sent",
                "payment_link_sent_at",
                "status",
                "stripe_payment_id",
            ]
        )

        return Response(
            {
                "message": "Payment link created and emailed successfully",
                "payment_link": payment_url,
                "stripe_id": payment_link.get("id"),
                "currency": currency,
                "program_id": str(service.id),
                "program_title": service.title,
            },
            status=status.HTTP_201_CREATED,
        )


class SendPaymentLinkView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request, lead_id):
        """Send payment link to lead"""
        lead = get_object_or_404(Lead, id=lead_id)

        # Here you would integrate with Stripe to create a payment link
        # For now, we'll simulate this
        payment_link = f"https://stripe.com/pay/{lead.id}"

        # Send email with payment link
        subject = "Payment Link for Your Fitness Program"
        message = f"""
        Hi {lead.first_name},

        Thank you for completing your assessment!

        Please complete your payment using this link: {payment_link}

        Best regards,
        TCI Fitness Team
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [lead.email],
                fail_silently=False,
            )

            # Update lead status
            lead.payment_link_sent = True
            lead.payment_link_sent_at = timezone.now()
            lead.status = "qualified"
            lead.save()

            # Notify ops of manual payment link send
            send_ops_email(
                subject="Payment Link Sent",
                message=(
                    f"Lead: {lead.email}\n"
                    f"Link: {payment_link}\n"
                    f"Sent by: {request.user.email if request.user.is_authenticated else 'system'}"
                ),
            )

            return Response(
                {
                    "message": "Payment link sent successfully",
                    "payment_link": payment_link,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to send payment link: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FetchUserDetailsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request, user_uuid):
        """Fetch client details after conversion"""
        try:
            client = Client.objects.get(user__id=user_uuid)
            serializer = ClientDetailSerializer(client)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Client.DoesNotExist:
            return Response(
                {"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND
            )


class UpdateUserDetailsView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, user_uuid):
        """Update client details"""
        try:
            client = Client.objects.get(user__id=user_uuid)
        except Client.DoesNotExist:
            return Response(
                {"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Update client fields
        allowed_fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "meeting_status",
            "program_status",
            "contract_status",
        ]

        for field in allowed_fields:
            if field in request.data:
                setattr(client, field, request.data[field])

        client.save()

        # Update user fields if provided
        user = client.user
        user_fields = ["first_name", "last_name", "email"]
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        serializer = ClientDetailSerializer(client)
        return Response(
            {
                "message": "Client details updated successfully",
                "client": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class StripeWebhookView(APIView):
    """Handle Stripe webhook for payment completion"""

    permission_classes = [AllowAny]

    def post(self, request):
        import stripe
        from lms.models import StripePayment

        # Get the webhook secret from settings
        webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)
        if not webhook_secret:
            return Response(
                {"error": "Webhook secret not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Get the raw payload and signature
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            # Invalid payload
            return Response(
                {"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST
            )
        except stripe.error.SignatureVerificationError:
            # Invalid signature
            return Response(
                {"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Handle the event
        event_type = event["type"]
        event_data = event["data"]["object"]

        if event_type == "payment_intent.succeeded":
            # Payment was successful
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]
            currency = payment_intent["currency"].upper()
            amount_received = Decimal(str(payment_intent.get("amount_received", 0)))
            amount = (
                amount_received
                if currency.lower() in ZERO_DECIMAL_CURRENCIES
                else amount_received / Decimal("100")
            )

            try:
                stripe_payment = (
                    StripePayment.objects.filter(
                        stripe_payment_intent_id=payment_intent_id
                    )
                    .select_related("user")
                    .order_by("-created_at")
                    .first()
                )
                if stripe_payment is None:
                    raise StripePayment.DoesNotExist

                user = stripe_payment.user
                finalize_successful_client_payment(
                    stripe_payment,
                    user,
                    amount,
                    currency,
                    payment_intent_id,
                    payment_intent=payment_intent,
                )

                send_ops_email(
                    subject="Payment Succeeded (Webhook)",
                    message=(
                        f"User: {user.email}\n"
                        f"Amount: ${amount}\n"
                        f"Intent: {payment_intent_id}"
                    ),
                )

                return Response(
                    {"message": "Payment processed successfully"},
                    status=status.HTTP_200_OK,
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found in database - this could be from a PaymentLink
                # Try to find the user from PaymentIntent metadata or create a record
                user_id = payment_intent.get("metadata", {}).get("user_id")
                lead_id = payment_intent.get("metadata", {}).get("lead_id")

                user = None
                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        pass
                elif lead_id:
                    try:
                        user = User.objects.get(id=lead_id)
                    except User.DoesNotExist:
                        pass

                if user:
                    # Check if there's an existing StripePayment record for this user with matching amount and no PaymentIntent ID
                    try:
                        stripe_payment = (
                            StripePayment.objects.filter(
                                user=user,
                                amount=Decimal(str(amount)),
                                stripe_payment_intent_id__isnull=True,
                                status="pending",
                            )
                            .order_by("-created_at")
                            .first()
                        )
                        if stripe_payment is None:
                            raise StripePayment.DoesNotExist
                        # Update the existing record with the PaymentIntent ID
                        stripe_payment.stripe_payment_intent_id = payment_intent_id
                        stripe_payment.save(update_fields=["stripe_payment_intent_id"])

                        finalize_successful_client_payment(
                            stripe_payment,
                            user,
                            amount,
                            currency,
                            payment_intent_id,
                            payment_intent=payment_intent,
                        )

                        send_ops_email(
                            subject="Payment Succeeded (Webhook - PaymentLink)",
                            message=(
                                f"User: {user.email}\n"
                                f"Amount: ${amount}\n"
                                f"Intent: {payment_intent_id}"
                            ),
                        )

                        return Response(
                            {"message": "Payment processed successfully (PaymentLink)"},
                            status=status.HTTP_200_OK,
                        )

                    except StripePayment.DoesNotExist:
                        # No existing record found, create a new one
                        stripe_payment = StripePayment.objects.create(
                            user=user,
                            stripe_payment_intent_id=payment_intent_id,
                            amount=Decimal(str(amount)),
                            currency=currency.lower(),
                            status="succeeded",
                            metadata=payment_intent.get("metadata", {}),
                        )

                        finalize_successful_client_payment(
                            stripe_payment,
                            user,
                            amount,
                            currency,
                            payment_intent_id,
                            payment_intent=payment_intent,
                        )

                        return Response(
                            {"message": "Payment processed successfully (PaymentLink)"},
                            status=status.HTTP_200_OK,
                        )
                else:
                    # No user found in metadata, try to find pending payment by amount and currency
                    # This handles PaymentLink payments where metadata doesn't get passed to PaymentIntent
                    try:
                        stripe_payment = StripePayment.objects.get(
                            amount=Decimal(str(amount)),
                            currency__iexact=currency,
                            stripe_payment_intent_id__isnull=True,
                            status="pending",
                        )
                        # Update the existing record with the PaymentIntent ID
                        stripe_payment.stripe_payment_intent_id = payment_intent_id
                        stripe_payment.save(update_fields=["stripe_payment_intent_id"])

                        user = stripe_payment.user
                        finalize_successful_client_payment(
                            stripe_payment,
                            user,
                            amount,
                            currency,
                            payment_intent_id,
                            payment_intent=payment_intent,
                        )

                        return Response(
                            {
                                "message": "Payment processed successfully (PaymentLink - matched by amount)"
                            },
                            status=status.HTTP_200_OK,
                        )

                    except StripePayment.DoesNotExist:
                        # No matching pending payment found
                        return Response(
                            {
                                "error": f"PaymentIntent {payment_intent_id} could not be matched to any user"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    except StripePayment.MultipleObjectsReturned:
                        # Multiple pending payments with same amount - can't determine which one
                        return Response(
                            {
                                "error": f"PaymentIntent {payment_intent_id} matches multiple pending payments"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

        elif event_type == "payment_intent.payment_failed":
            # Payment failed
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "failed"
                stripe_payment.save()

                # Update user status if needed
                user = stripe_payment.user
                # Maybe set status to 'payment_failed' or keep as is

                return Response(
                    {"message": "Payment failure recorded"}, status=status.HTTP_200_OK
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                # For failed payments, we might not need to create a record, but log it
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} failed (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "payment_intent.canceled":
            # PaymentIntent was canceled
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "canceled"
                stripe_payment.save()

                return Response(
                    {"message": "PaymentIntent canceled"}, status=status.HTTP_200_OK
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} canceled (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "payment_intent.created":
            # PaymentIntent was created
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "created"
                stripe_payment.save()

                return Response(
                    {"message": "PaymentIntent created"}, status=status.HTTP_200_OK
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} created (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "payment_intent.partially_funded":
            # PaymentIntent was partially funded
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "partially_funded"
                stripe_payment.save()

                return Response(
                    {"message": "PaymentIntent partially funded"},
                    status=status.HTTP_200_OK,
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} partially funded (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "payment_intent.processing":
            # PaymentIntent is processing
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "processing"
                stripe_payment.save()

                return Response(
                    {"message": "PaymentIntent processing"}, status=status.HTTP_200_OK
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} processing (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "payment_intent.requires_action":
            # PaymentIntent requires action
            payment_intent = event_data
            payment_intent_id = payment_intent["id"]

            try:
                # Find the payment record
                stripe_payment = StripePayment.objects.get(
                    stripe_payment_intent_id=payment_intent_id
                )

                # Update StripePayment status
                stripe_payment.status = "requires_action"
                stripe_payment.save()

                return Response(
                    {"message": "PaymentIntent requires action"},
                    status=status.HTTP_200_OK,
                )

            except StripePayment.DoesNotExist:
                # PaymentIntent not found - this could be from a PaymentLink
                return Response(
                    {
                        "message": f"PaymentIntent {payment_intent_id} requires action (no record found)"
                    },
                    status=status.HTTP_200_OK,
                )

        elif event_type == "checkout.session.completed":
            # Handle payment link completion (existing logic)
            session = event_data
            lead_id = session.get("metadata", {}).get("lead_id")

            if lead_id:
                try:
                    user = User.objects.get(id=lead_id)

                    # Update user status to 'paid'
                    user.status = "paid"
                    user.save()

                    return Response(
                        {
                            "message": "Payment processed successfully",
                            "user_id": str(user.id),
                        },
                        status=status.HTTP_200_OK,
                    )

                except User.DoesNotExist:
                    return Response(
                        {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                    )

        # For unhandled events, just acknowledge receipt
        return Response(
            {"message": f"Event {event_type} received"}, status=status.HTTP_200_OK
        )


# Lead Progress Tracking Views
class VerifyLeadCodeView(APIView):
    """Verify access code and return lead UUID"""

    def post(self, request):
        serializer = LeadVerifyCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        access_code = serializer.validated_data["access_code"]

        try:
            lead = Lead.objects.get(access_code=access_code, access_code_used=True)
            return Response(
                {
                    "lead_uuid": str(lead.user.id),  # Using user ID as UUID
                    "lead_name": lead.full_name,
                    "email": lead.email,
                    "status": lead.status,
                },
                status=status.HTTP_200_OK,
            )
        except Lead.DoesNotExist:
            return Response(
                {"error": "Invalid or expired access code"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GetLeadProgressView(APIView):
    """Get overall progress of lead across all assessments"""

    def get(self, request, lead_uuid):
        try:
            # Find lead by user UUID
            lead = Lead.objects.get(user__id=lead_uuid, access_code_used=True)
        except Lead.DoesNotExist:
            return Response(
                {"error": "Lead not found or not authorized"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get all assessment entries for this lead
        assessment_entries = LeadAssessmentEntry.objects.filter(lead=lead)

        # Create progress data for all 6 assessments
        progress_data = []
        assessment_names = {
            1: "Fitness Assessment",
            2: "Nutrition Assessment",
            3: "Lifestyle Assessment",
            4: "Goal Setting",
            5: "Medical History",
            6: "Preferences & Availability",
        }

        for assessment_id in range(1, 7):
            try:
                entry = assessment_entries.get(assessment_id=assessment_id)
                progress_percentage = self._calculate_progress_percentage(
                    entry.assessment_data
                )
                progress_data.append(
                    {
                        "assessment_id": assessment_id,
                        "assessment_name": assessment_names[assessment_id],
                        "is_completed": entry.is_completed,
                        "progress_percentage": progress_percentage,
                        "last_updated": entry.updated_at,
                        "has_data": True,
                    }
                )
            except LeadAssessmentEntry.DoesNotExist:
                progress_data.append(
                    {
                        "assessment_id": assessment_id,
                        "assessment_name": assessment_names[assessment_id],
                        "is_completed": False,
                        "progress_percentage": 0,
                        "last_updated": None,
                        "has_data": False,
                    }
                )

        # Calculate overall progress
        total_progress = sum(item["progress_percentage"] for item in progress_data)
        overall_percentage = total_progress // 6

        return Response(
            {
                "lead_uuid": lead_uuid,
                "lead_name": lead.full_name,
                "overall_progress": overall_percentage,
                "assessments": progress_data,
            },
            status=status.HTTP_200_OK,
        )

    def _calculate_progress_percentage(self, assessment_data):
        """Calculate progress percentage based on data completeness"""
        if not assessment_data:
            return 0

        # Simple calculation based on number of fields filled
        total_fields = len(assessment_data)
        filled_fields = sum(
            1
            for value in assessment_data.values()
            if value is not None and str(value).strip() != ""
        )

        if total_fields == 0:
            return 0

        return min(100, (filled_fields * 100) // total_fields)


class GetLeadAssessmentProgressView(APIView):
    """Get progress for a specific assessment"""

    def get(self, request, lead_uuid, assessment_id):
        try:
            assessment_id = int(assessment_id)
            if assessment_id not in range(1, 7):
                return Response(
                    {"error": "Invalid assessment ID. Must be between 1 and 6"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lead = Lead.objects.get(user__id=lead_uuid, access_code_used=True)
        except (ValueError, Lead.DoesNotExist):
            return Response(
                {"error": "Lead not found or invalid assessment ID"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            entry = LeadAssessmentEntry.objects.get(
                lead=lead, assessment_id=assessment_id
            )
            serializer = LeadAssessmentEntrySerializer(entry)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except LeadAssessmentEntry.DoesNotExist:
            return Response(
                {
                    "assessment_id": assessment_id,
                    "assessment_name": dict(LeadAssessmentEntry.ASSESSMENT_CHOICES)[
                        assessment_id
                    ],
                    "assessment_data": {},
                    "is_completed": False,
                    "has_data": False,
                    "message": "No progress data found for this assessment",
                },
                status=status.HTTP_200_OK,
            )


class SaveLeadAssessmentProgressView(APIView):
    """Save progress for a specific assessment"""

    def post(self, request, lead_uuid, assessment_id):
        try:
            assessment_id = int(assessment_id)
            if assessment_id not in range(1, 7):
                return Response(
                    {"error": "Invalid assessment ID. Must be between 1 and 6"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lead = Lead.objects.get(user__id=lead_uuid, access_code_used=True)
        except (ValueError, Lead.DoesNotExist):
            return Response(
                {"error": "Lead not found or invalid assessment ID"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = LeadSaveProgressSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        assessment_data = serializer.validated_data["assessment_data"]

        # Get or create assessment entry
        entry, created = LeadAssessmentEntry.objects.get_or_create(
            lead=lead,
            assessment_id=assessment_id,
            defaults={"assessment_data": assessment_data},
        )

        if not created:
            # Update existing entry
            entry.assessment_data = assessment_data
            entry.save()

        # Check if assessment should be marked as completed
        progress_percentage = self._calculate_progress_percentage(assessment_data)
        if progress_percentage >= 80 and not entry.is_completed:
            entry.mark_completed()

        return Response(
            {
                "message": "Progress saved successfully",
                "assessment_id": assessment_id,
                "progress_percentage": progress_percentage,
                "is_completed": entry.is_completed,
                "created": created,
            },
            status=status.HTTP_200_OK,
        )

    def _calculate_progress_percentage(self, assessment_data):
        """Calculate progress percentage based on data completeness"""
        if not assessment_data:
            return 0

        # Simple calculation based on number of fields filled
        total_fields = len(assessment_data)
        filled_fields = sum(
            1
            for value in assessment_data.values()
            if value is not None and str(value).strip() != ""
        )

        if total_fields == 0:
            return 0

        return min(100, (filled_fields * 100) // total_fields)


class TrainerClientsView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        # Get current trainer
        trainer = request.user

        # Get all appointments for this trainer
        appointments = Appointment.objects.filter(trainer=trainer)

        # Get unique clients assigned to this trainer
        client_users = appointments.values_list("client", flat=True).distinct()
        clients_assigned = len(client_users)

        # Get clients with meetings today
        from django.utils import timezone

        today = timezone.now().date()
        today_start = timezone.datetime.combine(today, time.min)
        today_end = timezone.datetime.combine(today, time.max)

        meetings_today = (
            appointments.filter(
                scheduled_at__gte=today_start,
                scheduled_at__lte=today_end,
                status__in=["scheduled"],
            )
            .values_list("client", flat=True)
            .distinct()
        )
        clients_meetings_today = len(meetings_today)

        # Get client details
        clients_data = []
        for client_user_id in client_users:
            try:
                client_profile = Client.objects.get(user_id=client_user_id)
                clients_data.append(
                    {
                        "uuid": str(client_profile.user.id),
                        "name": client_profile.full_name,
                        "status": client_profile.program_status,
                    }
                )
            except Client.DoesNotExist:
                # If no client profile exists, skip this client
                continue

        response_data = {
            "clientsAssigned": clients_assigned,
            "clientsMeetingsToday": clients_meetings_today,
            "clients": clients_data,
        }

        serializer = TrainerClientsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Client Dashboard API Views


class ClientProfileView(APIView):
    """GET/PATCH /clients/:clientId - Client profile management"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions: client can view their own profile, trainers/admins can view any
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own profile.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access profiles of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client profile"""
        client = self.get_client(clientId, request.user)
        serializer = ClientProfileSerializer(client)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, clientId):
        """Update client profile (limited fields)"""
        client = self.get_client(clientId, request.user)

        # Only allow updates by trainers/sales, not by clients themselves
        if request.user.role == "client":
            return Response(
                {
                    "error": "Clients cannot update their own profile through this endpoint."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientProfileUpdateSerializer(
            client, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientOverviewView(APIView):
    """GET /clients/:clientId/overview - Client dashboard overview"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions: client can view their own profile, trainers/admins can view any
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own overview.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access overview of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client overview data"""
        client = self.get_client(clientId, request.user)

        # Get total programs enrolled
        total_programs_enrolled = Enrollment.objects.filter(user=client.user).count()

        # Get ebooks bought
        from lms.models import EbookPurchase

        ebooks_bought = EbookPurchase.objects.filter(user=client.user).count()

        # Get meetings today
        today = timezone.now().date()
        today_start = timezone.datetime.combine(today, time.min)
        today_end = timezone.datetime.combine(today, time.max)

        meetings_today = Meeting.objects.filter(
            attendees__user=client.user,
            scheduled_at__gte=today_start,
            scheduled_at__lte=today_end,
            status__in=["scheduled", "confirmed"],
        ).count()

        # Get latest meeting time
        latest_meeting = (
            Meeting.objects.filter(
                attendees__user=client.user,
                status__in=["scheduled", "confirmed", "completed"],
            )
            .order_by("-scheduled_at")
            .first()
        )

        latest_meeting_time = None
        if latest_meeting:
            latest_meeting_time = latest_meeting.scheduled_at.isoformat()

        # Get meetings graph data (last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        recent_meetings = Meeting.objects.filter(
            attendees__user=client.user,
            scheduled_at__gte=thirty_days_ago,
            status__in=["scheduled", "confirmed", "completed"],
        ).order_by("scheduled_at")

        # Group meetings by date
        meetings_by_date = {}
        for meeting in recent_meetings:
            date_str = meeting.scheduled_at.date().isoformat()
            if date_str not in meetings_by_date:
                meetings_by_date[date_str] = 0
            meetings_by_date[date_str] += 1

        # Create graph data array
        meetings_graph_data = []
        current_date = thirty_days_ago.date()
        end_date = timezone.now().date()

        while current_date <= end_date:
            date_str = current_date.isoformat()
            count = meetings_by_date.get(date_str, 0)
            meetings_graph_data.append({"date": date_str, "count": count})
            current_date += timezone.timedelta(days=1)

        response_data = {
            "totalProgramsEnrolled": total_programs_enrolled,
            "ebooksBought": ebooks_bought,
            "meetingsToday": meetings_today,
            "latestMeetingTime": latest_meeting_time,
            "meetingsGraphData": meetings_graph_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class ClientMeetingsView(APIView):
    """GET/POST /clients/:clientId/meetings - Client meetings management"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own meetings.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access meetings of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client meetings"""
        client = self.get_client(clientId, request.user)

        # Get meetings where client is an attendee
        meetings = (
            Meeting.objects.filter(attendees__user=client.user)
            .select_related("meeting_type")
            .order_by("-scheduled_at")
        )

        # Filter by status if provided
        status_filter = request.query_params.get("status")
        if status_filter:
            meetings = meetings.filter(status=status_filter)

        serializer = ClientMeetingSerializer(meetings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, clientId):
        """Schedule a new meeting for client"""
        client = self.get_client(clientId, request.user)

        # Only trainers/sales can schedule meetings
        if request.user.role == "client":
            return Response(
                {"error": "Clients cannot schedule meetings through this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientMeetingCreateSerializer(
            data=request.data, context={"client": client, "request": request}
        )
        if serializer.is_valid():
            meeting = serializer.save()
            response_serializer = ClientMeetingSerializer(meeting)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientMeetingTranscriptView(APIView):
    """GET /clients/:clientId/meetings/:meetingId/transcript - Get meeting transcript"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get(self, request, clientId, meetingId):
        """Get meeting transcript"""
        client = get_object_or_404(Client, user__id=clientId)

        # Check permissions
        if request.user.role == "client" and str(client.user.id) != str(
            request.user.id
        ):
            raise PermissionDenied("You can only access your own meeting transcripts.")
        elif (
            request.user.role in ["trainer", "sales"]
            and client.assigned_sales != request.user
        ):
            raise PermissionDenied(
                "You can only access transcripts of clients assigned to you."
            )

        # Get meeting
        meeting = get_object_or_404(Meeting, id=meetingId, attendees__user=client.user)

        # For now, return a placeholder response
        # In a real implementation, you'd retrieve the transcript from storage
        transcript_data = {
            "meetingId": str(meeting.id),
            "clientId": clientId,
            "transcript": "Transcript functionality will be implemented with audio recording integration.",
            "duration": str(meeting.duration),
            "recordedAt": meeting.scheduled_at.isoformat(),
            "status": "available",
        }

        return Response(transcript_data, status=status.HTTP_200_OK)


class ClientProgramsView(APIView):
    """GET /clients/:clientId/services - Client program enrollments"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own programs.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access programs of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client program enrollments in services format"""
        client = self.get_client(clientId, request.user)

        enrollments = (
            Enrollment.objects.filter(user=client.user)
            .select_related("service__trainer")
            .prefetch_related("service__advisors")
            .order_by("-enrolled_at")
        )

        serializer = ClientServicesSerializer(enrollments, many=True)
        return Response({"programs": serializer.data}, status=status.HTTP_200_OK)


class ClientNotesView(APIView):
    """GET/POST /clients/:clientId/notes - Client notes management"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Only trainers/sales can access notes
        if user.role == "client":
            raise PermissionDenied("Clients cannot access advisor notes.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access notes of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client notes"""
        client = self.get_client(clientId, request.user)

        notes = ClientNote.objects.filter(client=client).order_by("-updated_at")

        # Filter by category if provided
        category = request.query_params.get("category")
        if category:
            notes = notes.filter(category=category)

        # Filter by pinned if provided
        pinned = request.query_params.get("pinned")
        if pinned is not None:
            notes = notes.filter(is_pinned=pinned.lower() == "true")

        serializer = ClientNoteSerializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, clientId):
        """Create a new client note"""
        client = self.get_client(clientId, request.user)

        serializer = ClientNoteCreateSerializer(
            data=request.data, context={"client": client, "request": request}
        )
        if serializer.is_valid():
            note = serializer.save()
            response_serializer = ClientNoteSerializer(note)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientNoteDetailView(APIView):
    """GET/PUT/DELETE /clients/:clientId/notes/:noteId - Individual note management"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client_and_note(self, client_id, note_id, user):
        """Get client and note with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Only trainers/sales can access notes
        if user.role == "client":
            raise PermissionDenied("Clients cannot access advisor notes.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access notes of clients assigned to you."
            )

        note = get_object_or_404(ClientNote, id=note_id, client=client)
        return client, note

    def get(self, request, clientId, noteId):
        """Get a specific client note"""
        client, note = self.get_client_and_note(clientId, noteId, request.user)
        serializer = ClientNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, clientId, noteId):
        """Update a client note"""
        client, note = self.get_client_and_note(clientId, noteId, request.user)

        serializer = ClientNoteUpdateSerializer(note, data=request.data, partial=True)
        if serializer.is_valid():
            updated_note = serializer.save()
            response_serializer = ClientNoteSerializer(updated_note)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, clientId, noteId):
        """Delete a client note"""
        client, note = self.get_client_and_note(clientId, noteId, request.user)
        note.delete()
        return Response(
            {"message": "Note deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )


class ClientProgressView(APIView):
    """GET /clients/:clientId/progress - Client progress across programs"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own progress.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access progress of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client progress across all enrolled programs"""
        client = self.get_client(clientId, request.user)

        # Get all progress entries for this client
        progress_entries = (
            Progress.objects.filter(enrollment__user=client.user)
            .select_related("enrollment__service", "chapter")
            .order_by("-completed_at")
        )

        # Group by service/program
        programs_progress = {}
        for progress in progress_entries:
            service_id = str(progress.enrollment.service.id)
            if service_id not in programs_progress:
                programs_progress[service_id] = {
                    "programId": service_id,
                    "programName": progress.enrollment.service.title,
                    "chapters": [],
                }
            programs_progress[service_id]["chapters"].append(progress)

        # Convert to list and calculate completion percentages
        result = []
        for program_data in programs_progress.values():
            chapters_data = []
            for chapter_progress in program_data["chapters"]:
                chapters_data.append(
                    {
                        "chapterId": str(chapter_progress.chapter.id),
                        "title": chapter_progress.chapter.title,
                        "completionPercent": 100 if chapter_progress.completed else 0,
                        "updatedAt": (
                            chapter_progress.completed_at.isoformat()
                            if chapter_progress.completed_at
                            else None
                        ),
                    }
                )

            result.append(
                {
                    "programId": program_data["programId"],
                    "programName": program_data["programName"],
                    "chapters": chapters_data,
                }
            )

        return Response(result, status=status.HTTP_200_OK)


class ClientChatSessionsView(APIView):
    """GET /clients/:clientId/chat/sessions - Client chat sessions"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]

    def get_client(self, client_id, user):
        """Get client with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own chat sessions.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access chat sessions of clients assigned to you."
            )

        return client

    def get(self, request, clientId):
        """Get client chat sessions"""
        client = self.get_client(clientId, request.user)

        # Get chat sessions where client is a member
        sessions = (
            ChatSession.objects.filter(
                members__user=client.user, members__status="active"
            )
            .distinct()
            .order_by("-created_at")
        )

        serializer = ClientChatSessionSerializer(
            sessions, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientChatMessagesView(APIView):
    """GET/POST /clients/:clientId/chat/messages - Client chat messages"""

    permission_classes = [IsAuthenticated, IsClientOrAssignedAdvisor]
    pagination_class = PageNumberPagination

    def get_client_and_session(self, client_id, session_id, user):
        """Get client and session with proper permissions"""
        client = get_object_or_404(Client, user__id=client_id)

        # Check permissions
        if user.role == "client" and str(client.user.id) != str(user.id):
            raise PermissionDenied("You can only access your own chat.")
        elif user.role in ["trainer", "sales"] and client.assigned_sales != user:
            raise PermissionDenied(
                "You can only access chat of clients assigned to you."
            )

        # Get session and verify client is a member
        session = get_object_or_404(ChatSession, id=session_id)
        membership = get_object_or_404(
            ChatMember, session=session, user=client.user, status="active"
        )

        return client, session, membership

    def get(self, request, clientId, sessionId):
        """Get chat messages for a session"""
        client, session, membership = self.get_client_and_session(
            clientId, sessionId, request.user
        )

        # Get messages
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")

        # Mark messages as read by current user
        for message in messages:
            if str(request.user.id) not in message.read_by:
                message.mark_as_read(request.user)

        # Update last seen
        membership.last_seen_at = timezone.now()
        membership.save()

        # Paginate results
        paginator = self.pagination_class()
        paginated_messages = paginator.paginate_queryset(messages, request)
        serializer = ClientChatMessageSerializer(
            paginated_messages, many=True, context={"request": request}
        )

        return paginator.get_paginated_response(serializer.data)

    def post(self, request, clientId, sessionId):
        """Send a message in the chat session"""
        client, session, membership = self.get_client_and_session(
            clientId, sessionId, request.user
        )

        # Check if user can post in this session
        if not membership.can_post:
            return Response(
                {"error": "You are not allowed to post in this session."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ClientChatMessageCreateSerializer(
            data=request.data, context={"session": session, "request": request}
        )
        if serializer.is_valid():
            message = serializer.save()
            response_serializer = ClientChatMessageSerializer(
                message, context={"request": request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InitiateChatSessionView(APIView):
    """POST /chats - Initiate a chat session"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("userId")
        initiator_id = request.data.get("initiatorId", str(request.user.id))

        if not user_id:
            return Response(
                {"error": "userId is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_user = User.objects.get(id=user_id)
            initiator = User.objects.get(id=initiator_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions
        if request.user.role not in ["admin", "trainer", "sales"]:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # Create chat session
        from messaging.models import ChatSession, ChatMember

        session = ChatSession.objects.create(
            title=f"Chat with {target_user.get_full_name()}",
            client=target_user,  # Set the client field
            created_by=initiator,
            is_active=True,
        )

        # Add members
        ChatMember.objects.create(
            session=session,
            user=initiator,
            role=(
                initiator.role if initiator.role in ["trainer", "client"] else "trainer"
            ),
            can_post=True,
        )
        ChatMember.objects.create(
            session=session,
            user=target_user,
            role=(
                target_user.role
                if target_user.role in ["trainer", "client"]
                else "client"
            ),
            can_post=True,
        )

        # Generate session token (simplified)
        session_token = str(uuid.uuid4())

        return Response(
            {
                "chatId": str(session.id),
                "sessionToken": session_token,
                "participants": [
                    {
                        "id": str(initiator.id),
                        "name": initiator.get_full_name(),
                        "role": "initiator",
                    },
                    {
                        "id": str(target_user.id),
                        "name": target_user.get_full_name(),
                        "role": "participant",
                    },
                ],
            },
            status=status.HTTP_201_CREATED,
        )


class SendChatMessageView(APIView):
    """POST /chats/{chatId}/messages - Send a chat message"""

    permission_classes = [IsAuthenticated]

    def post(self, request, chat_id):
        text = request.data.get("text")
        sender_id = request.data.get("senderId", str(request.user.id))

        if not text:
            return Response(
                {"error": "text is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = ChatSession.objects.get(id=chat_id, is_active=True)
            sender = User.objects.get(id=sender_id)
        except (ChatSession.DoesNotExist, User.DoesNotExist):
            return Response(
                {"error": "Chat session or user not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user is a member of the session
        membership = ChatMember.objects.filter(
            session=session, user=sender, status="active"
        ).first()

        if not membership or not membership.can_post:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # Create message
        message = ChatMessage.objects.create(session=session, sender=sender, text=text)

        # Broadcast the message via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"messaging_{chat_id}",
            {
                "type": "chat_message",
                "message": message.text,
                "sender": message.sender.username,
                "sent_at": message.created_at.isoformat(),
                "message_id": str(message.id),
            },
        )

        return Response(
            {
                "messageId": str(message.id),
                "text": message.text,
                "senderId": str(sender.id),
                "senderName": sender.get_full_name(),
                "createdAt": message.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class EndChatSessionView(APIView):
    """DELETE /chats/{chatId} - End a chat session"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, chat_id):
        try:
            session = ChatSession.objects.get(id=chat_id)
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Chat session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions (only session creator or admin can end)
        if session.created_by != request.user and request.user.role != "admin":
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )

        # End session
        session.is_active = False
        session.save()

        # Mark all members as inactive
        ChatMember.objects.filter(session=session).update(status="inactive")

        return Response(
            {"message": "Chat session ended successfully"},
            status=status.HTTP_200_OK,
        )


class CancelMeetingView(APIView):
    """DELETE /meetings/{meetingId} - Cancel/delete a meeting"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, meeting_id):
        try:
            # Try Meeting model first
            from scheduling.models import Meeting

            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            # Try Appointment model as fallback
            try:
                from scheduling.models import Appointment

                meeting = Appointment.objects.get(id=meeting_id)
            except Appointment.DoesNotExist:
                return Response(
                    {"error": "Meeting not found"}, status=status.HTTP_404_NOT_FOUND
                )

        # Check permissions
        if request.user.role == "admin":
            pass  # Admin can cancel any meeting
        elif hasattr(meeting, "scheduled_by") and meeting.scheduled_by == request.user:
            pass  # Meeting creator can cancel
        elif hasattr(meeting, "trainer") and meeting.trainer == request.user:
            pass  # Trainer can cancel their meetings
        else:
            # Check if user is an attendee
            if hasattr(meeting, "attendees"):
                is_attendee = meeting.attendees.filter(user=request.user).exists()
                if not is_attendee:
                    return Response(
                        {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
                )

        # Cancel meeting
        if hasattr(meeting, "status"):
            meeting.status = "cancelled"
            meeting.save()
        else:
            # If no status field, delete the meeting
            meeting.delete()

        return Response(
            {"message": "Meeting cancelled successfully"},
            status=status.HTTP_200_OK,
        )


class SalesDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Get current sales user
        sales_person = request.user

        # Get all clients assigned to this sales person
        clients = Client.objects.filter(assigned_sales=sales_person)

        # Calculate statistics
        total_clients = clients.count()
        active_clients = clients.filter(program_status="paid").count()
        clients_awaiting_purchase = clients.filter(
            program_status="unpaid", contract_status="sent_signed"
        ).count()

        # Generate client trend data for last 6 months
        from django.utils import timezone
        import calendar

        # Get current date
        now = timezone.now()
        current_year = now.year
        current_month = now.month

        # Generate last 6 months data
        client_trend = []
        for i in range(5, -1, -1):  # 5 months back to current month
            # Calculate month and year
            month = current_month - i
            year = current_year
            if month <= 0:
                month += 12
                year -= 1

            # Get month name abbreviation
            month_name = calendar.month_abbr[month]

            # Count clients created in this month
            month_start = timezone.datetime(year, month, 1)
            if month == 12:
                month_end = timezone.datetime(year + 1, 1, 1)
            else:
                month_end = timezone.datetime(year, month + 1, 1)

            clients_in_month = clients.filter(
                created_at__gte=month_start, created_at__lt=month_end
            ).count()

            client_trend.append({"month": month_name, "clients": clients_in_month})

        response_data = {
            "totalClients": total_clients,
            "activeClients": active_clients,
            "clientsAwaitingPurchase": clients_awaiting_purchase,
            "clientTrend": client_trend,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class AssignSalesToClientView(APIView):
    """
    POST /lms/sales/assign-sales/<client_id> - Assign a sales user to a client
    """

    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request, client_id):
        """Assign a sales user to a client"""
        # Get the client
        client = get_object_or_404(Client, user__id=client_id)

        # Get sales_user_id from request body
        sales_user_id = request.data.get("sales_user_id")

        if not sales_user_id:
            return Response(
                {"error": "sales_user_id is required in request body"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the sales user
        try:
            sales_user = User.objects.get(id=sales_user_id, role="sales")
        except User.DoesNotExist:
            return Response(
                {"error": "Sales user not found or user is not a sales representative"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Assign the sales user to the client
        client.assigned_sales = sales_user
        client.save(update_fields=["assigned_sales", "updated_at"])

        # Return success response with updated client info
        from .serializers import ClientDetailSerializer

        serializer = ClientDetailSerializer(client)

        return Response(
            {
                "message": f"Sales representative '{sales_user.get_full_name()}' assigned to client '{client.full_name}' successfully",
                "client": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class SalesNewClientsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Get current sales user
        sales_person = request.user

        # Self-heal: if a sales meeting exists, ensure the client isn't stuck in "pending".
        pending_assigned_ids = Client.objects.filter(
            assigned_sales=sales_person, meeting_status="pending"
        ).values_list("user_id", flat=True)
        sales_meeting_ids = (
            Meeting.objects.filter(
                models.Q(scheduled_by=sales_person)
                | models.Q(
                    attendees__user=sales_person, attendees__role__in=["sales", "organizer"]
                ),
                status__in=["scheduled", "confirmed", "active"],
            )
            .values_list("id", flat=True)
            .distinct()
        )
        scheduled_client_ids = (
            MeetingAttendee.objects.filter(
                role="client",
                user_id__in=pending_assigned_ids,
                meeting_id__in=sales_meeting_ids,
            )
            .values_list("user_id", flat=True)
            .distinct()
        )
        Client.objects.filter(
            assigned_sales=sales_person,
            meeting_status="pending",
            user_id__in=scheduled_client_ids,
        ).update(meeting_status="scheduled")

        # Get clients assigned to this sales person
        clients = Client.objects.filter(assigned_sales=sales_person).order_by(
            "-created_at"
        )

        # Calculate statistics
        meetings_pending = clients.filter(meeting_status="pending").count()
        calls_scheduled = 0  # Placeholder - SalesCall model not implemented
        awaiting_purchase_clients = clients.filter(
            program_status="unpaid", contract_status="sent_signed"
        ).count()

        # Build clients array
        clients_data = []
        for client in clients:
            clients_data.append(
                {
                    "clientName": client.full_name,
                    "clientID": str(client.user.id),
                    "meetingStatus": client.meeting_status,
                    "serviceStatus": client.program_status,
                    "contractStatus": client.contract_status,
                }
            )

        response_data = {
            "meetingsPending": meetings_pending,
            "callsScheduled": calls_scheduled,
            "awaitingPurchaseClients": awaiting_purchase_clients,
            "clients": clients_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class SalesCreateClientView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def _send_client_onboarding_email(self, user, temporary_password, sales_user=None):
        first_name = (user.first_name or "").strip() or "there"
        salesperson_name = _display_name(sales_user) if sales_user else "our sales team"
        salesperson_email = (
            sales_user.email
            if sales_user and sales_user.email
            else CLIENT_SUPPORT_EMAIL
        )
        subject = "Your New Account Credentials - The CEO Influencers"
        message = (
            f"Hi {first_name},\n\n"
            "A client account is ready for you at The CEO Influencers.\n\n"
            f"You have been assigned to {salesperson_name} who will be your point of contact. "
            f"You can reach them at {salesperson_email}.\n\n"
            "Sign in using:\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n"
            f"Temporary password: {temporary_password}\n"
            f"Login page: {CLIENT_LOGIN_URL}\n\n"
            f"Please complete your assessment at {CLIENT_ASSESSMENT_URL}.\n\n"
            "If you have trouble signing in, use the Forgot Password option on the login page "
            f"with this same email address: {CLIENT_FORGOT_PASSWORD_URL}\n\n"
            "If you have any questions, reply to this email and our team will assist you."
        )
        sent = send_mail(
            subject=subject,
            message=message,
            recipient_list=[user.email],
            fail_silently=False,
            from_email=settings.DEFAULT_FROM_EMAIL,
        )
        if sent != 1:
            raise RuntimeError("Client onboarding email was not sent.")
        logger.info(
            "Sent client onboarding email to %s for user_id=%s",
            user.email,
            user.id,
        )

    def post(self, request):
        serializer = SalesCreateClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_created = False
        client_created = False
        generated_password = None
        credentials_sent = False
        email = data["email"]
        should_send_credentials = False

        with transaction.atomic():
            user = User.objects.filter(email__iexact=email).first()
            client = Client.objects.filter(user=user).first() if user else None
            needs_client_profile = client is None
            if client and client.assigned_sales and client.assigned_sales != request.user:
                return Response(
                    {"error": "Client is already assigned to another sales representative"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if user:
                user_updates = []
                if user.role != "client":
                    user.role = "client"
                    user_updates.append("role")
                if user.email != email:
                    user.email = email
                    user_updates.append("email")
                if user_updates:
                    user.save(update_fields=user_updates)
            else:
                username_base = email.split("@")[0]
                username = f"{username_base}{get_random_string(4)}"
                while User.objects.filter(username=username).exists():
                    username = f"{username_base}{get_random_string(4)}"

                generated_password = get_random_string(
                    length=12,
                    allowed_chars="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*",
                )

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=generated_password,
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    role="client",
                    is_active=True,
                )
                user_created = True

            user_name_updates = []
            if user.first_name != data["first_name"]:
                user.first_name = data["first_name"]
                user_name_updates.append("first_name")
            if user.last_name != data["last_name"]:
                user.last_name = data["last_name"]
                user_name_updates.append("last_name")
            if user_name_updates:
                user.save(update_fields=user_name_updates)

            # User create/role updates can auto-create the Client profile via signals.
            client = Client.objects.filter(user=user).first()

            if needs_client_profile and not client:
                client = Client.objects.create(
                    user=user,
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    email=email,
                    phone=data.get("phone") or "",
                    assigned_sales=request.user,
                )
            client_created = needs_client_profile

            client.first_name = data["first_name"]
            client.last_name = data["last_name"]
            client.email = email
            client.phone = data.get("phone") or client.phone
            client.address = data.get("address") or client.address
            client.job_title = data.get("job_title") or client.job_title
            client.position = data.get("position") or client.position
            client.industry = data.get("industry") or client.industry
            client.assigned_sales = request.user
            client.save()

            # Match the discovery-call flow: unpaid client accounts always get
            # fresh temporary credentials when sales creates/recreates them.
            is_paid_client = (
                client.program_status == "paid"
                or getattr(user, "status", None) == "paid"
            )
            should_send_credentials = user_created or not is_paid_client
            if should_send_credentials:
                if generated_password is None:
                    generated_password = user.generate_strong_password()

        if should_send_credentials:
            self._send_client_onboarding_email(
                user=user,
                temporary_password=generated_password,
                sales_user=request.user,
            )
            credentials_sent = True

        if client_created:
            send_ops_email(
                subject="New Client Added by Sales",
                message=(
                    f"Sales user: {request.user.get_full_name() or request.user.email}\n"
                    f"Client: {client.full_name}\n"
                    f"Email: {client.email}\n"
                    f"Phone: {client.phone or '-'}\n"
                    f"Client ID: {client.user.id}"
                ),
            )

        return Response(
            {
                "message": "Client created successfully",
                "client": ClientProfileSerializer(client).data,
                "user_created": user_created,
                "client_created": client_created,
                "credentials_sent": credentials_sent,
            },
            status=status.HTTP_201_CREATED,
        )


class SalesExistingClientsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        # Get current sales user
        sales_person = request.user

        # Get existing clients - those with meetings that have been scheduled, completed, or cancelled
        # (not pending, which would be "new" clients)
        existing_clients = (
            Client.objects.filter(assigned_sales=sales_person)
            .exclude(meeting_status="pending")
            .order_by("-created_at")
        )

        # Calculate total existing clients
        total_existing_clients = existing_clients.count()

        # Format client data
        clients_data = []
        for client in existing_clients:
            clients_data.append(
                {
                    "clientID": str(client.user.id),
                    "clientName": client.full_name,
                    "status": client.meeting_status,
                }
            )

        response_data = {
            "totalExistingClients": total_existing_clients,
            "clients": clients_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class SalesCalendarView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        """Get calendar meetings for the sales user in the specified format"""
        sales_user = request.user

        # Get date range from query parameters (optional)
        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if year and month:
            year = int(year)
            month = int(month)
            # Calculate start and end dates for the month
            from calendar import monthrange

            start_date = timezone.datetime(year, month, 1).date()
            _, last_day = monthrange(year, month)
            end_date = timezone.datetime(year, month, last_day).date()
        else:
            # Default to current month
            now = timezone.now()
            year = now.year
            month = now.month
            from calendar import monthrange

            start_date = timezone.datetime(year, month, 1).date()
            _, last_day = monthrange(year, month)
            end_date = timezone.datetime(year, month, last_day).date()

        # Query meetings directly instead of attendees to avoid duplicates
        # Get meetings where sales user is involved
        sales_meetings = (
            Meeting.objects.filter(
                models.Q(scheduled_by=sales_user)
                | models.Q(
                    attendees__user=sales_user,
                    attendees__role__in=["sales", "organizer"],
                ),
                scheduled_at__date__gte=start_date,
                scheduled_at__date__lte=end_date,
                status__in=["scheduled", "confirmed", "active"],
            )
            .select_related("meeting_type", "scheduled_by")
            .distinct()
        )

        # Group meetings by date
        meetings_by_date = {}

        for meeting in sales_meetings:
            meeting_date = meeting.scheduled_at.date().isoformat()  # YYYY-MM-DD format

            if meeting_date not in meetings_by_date:
                meetings_by_date[meeting_date] = []

            # Get client from meeting attendees
            client_attendee = (
                MeetingAttendee.objects.filter(meeting=meeting, role="client")
                .select_related("user")
                .first()
            )

            client_name = "Unknown Client"
            client_programs = []
            if client_attendee:
                client_name = f"{client_attendee.user.first_name} {client_attendee.user.last_name}".strip()

                # Get programs/services the client is enrolled in
                from lms.models import Enrollment

                enrollments = Enrollment.objects.filter(
                    user=client_attendee.user
                ).select_related("service")[
                    :3
                ]  # Limit to 3 programs

                client_programs = [
                    enrollment.service.title for enrollment in enrollments
                ]

            # Get advisor/trainers from meeting attendees
            trainer_attendees = (
                MeetingAttendee.objects.filter(
                    meeting=meeting, role__in=["trainer", "organizer"]
                )
                .select_related("user")
                .exclude(user=sales_user)
            )

            advisor_names = []
            for trainer_attendee in trainer_attendees:
                name = f"{trainer_attendee.user.first_name} {trainer_attendee.user.last_name}".strip()
                advisor_names.append(name)

            advisor_display = ", ".join(advisor_names) if advisor_names else "TBD"

            # Combine programs for display
            program_display = (
                " & ".join(client_programs)
                if client_programs
                else "General Consultation"
            )

            # Determine meeting type code (01 for initial, 02 for follow-up/program)
            meeting_type_code = "01"  # Default
            if (
                "Program" in meeting.meeting_type.name
                or "Follow" in meeting.meeting_type.name
            ):
                meeting_type_code = "02"

            meeting_data = {
                "id": meeting.id,
                "title": meeting.title,
                "advisor": advisor_display,
                "program": program_display,
                "meetingType": meeting.meeting_type.name,
                "clientName": client_name,
                "time": meeting.scheduled_at.strftime("%I:%M %p"),
                "type": meeting_type_code,
            }

            meetings_by_date[meeting_date].append(meeting_data)

        return Response(meetings_by_date, status=status.HTTP_200_OK)
