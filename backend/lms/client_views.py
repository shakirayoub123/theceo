from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from comms.utils import send_ops_email
import logging
import mimetypes

from .models import (
    Enrollment,
    Service,
    Ebook,
    EbookPurchase,
    ServiceFile,
    ClientFormAnswers,
)
from .serializers import ClientEbookSerializer, ClientScheduleMeetingSerializer
from .download_security import user_has_ebook_access, validate_signed_download_token
from .client_serializers import (
    ClientOverviewSerializer,
    EnrolledProgramSerializer,
    ClientServiceDetailSerializer,
)
from scheduling.models import (
    Meeting,
    MeetingAttendee,
    MeetingType,
    Appointment as SchedulingAppointment,
)

logger = logging.getLogger(__name__)


def _get_client_profile(user):
    return getattr(user, "client_profile", None)


def _client_has_full_dashboard_access(user):
    client_profile = _get_client_profile(user)
    if client_profile is None:
        return True
    return client_profile.has_full_dashboard_access


def _full_dashboard_access_error():
    return Response(
        {
            "error": "Full dashboard access is available after payment confirmation."
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def _display_name(user):
    if not user:
        return ""
    return user.get_full_name().strip() or user.username or user.email or ""


def _format_dashboard_meeting(meeting, client_user, sales_advisor_name=""):
    if not meeting:
        return None

    sales_attendee = (
        MeetingAttendee.objects.filter(meeting=meeting, role="sales")
        .select_related("user")
        .first()
    )
    trainer_attendees = (
        MeetingAttendee.objects.filter(
            meeting=meeting, role__in=["trainer", "organizer"]
        )
        .select_related("user")
        .exclude(user=client_user)
        .exclude(user__role="sales")
    )

    advisor_names = []
    for trainer_attendee in trainer_attendees:
        name = _display_name(trainer_attendee.user)
        if name and name not in advisor_names:
            advisor_names.append(name)

    service = getattr(meeting, "service", None)
    sales_name = (
        _display_name(sales_attendee.user) if sales_attendee else sales_advisor_name
    )

    return {
        "id": meeting.id,
        "title": meeting.title,
        "scheduledAt": meeting.scheduled_at.isoformat(),
        "date": meeting.scheduled_at.date().isoformat(),
        "time": meeting.scheduled_at.strftime("%I:%M %p"),
        "meetingType": meeting.meeting_type.name if meeting.meeting_type else "",
        "program": service.title if service else "General Consultation",
        "programName": service.title if service else "General Consultation",
        "programId": str(service.id) if service else None,
        "serviceId": str(service.id) if service else None,
        "serviceTitle": service.title if service else None,
        "status": meeting.status,
        "bookedAt": meeting.created_at.isoformat() if meeting.created_at else None,
        "createdAt": meeting.created_at.isoformat() if meeting.created_at else None,
        "salesAdvisor": sales_name,
        "salesInfluencer": sales_name,
        "advisor": ", ".join(advisor_names),
        "otherTrainers": advisor_names,
    }


class ClientOverviewView(APIView):
    """
    GET /api/lms/client/overview/ - Get client dashboard overview
    Returns statistics and recent data for the client dashboard
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            client_profile = _get_client_profile(user)
            has_full_dashboard_access = _client_has_full_dashboard_access(user)

            # Get current date for filtering
            today = timezone.now().date()
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())

            # Make today_start and today_end timezone aware
            today_start = timezone.make_aware(today_start)
            today_end = timezone.make_aware(today_end)

            # Programs statistics
            enrollments = Enrollment.objects.filter(user=user)
            programs_enrolled = enrollments.count() if has_full_dashboard_access else 0

            # Ebooks statistics
            ebooks_bought = EbookPurchase.objects.filter(user=user).count()

            # Meetings statistics
            # Get meeting attendee records for this user
            attendee_records = MeetingAttendee.objects.filter(user=user)
            meeting_ids = attendee_records.values_list("meeting_id", flat=True)

            # Get meetings for today
            meetings_today = Meeting.objects.filter(
                id__in=meeting_ids,
                scheduled_at__range=(today_start, today_end),
                status__in=["scheduled", "confirmed"],
            ).count()

            # Get latest meeting timestamp
            latest_meeting = (
                Meeting.objects.filter(
                    id__in=meeting_ids, status__in=["completed", "confirmed"]
                )
                .order_by("-scheduled_at")
                .first()
            )

            latest_meeting_on = None
            if latest_meeting:
                latest_meeting_on = latest_meeting.scheduled_at.isoformat()

            # Get meetings by month
            # We'll create a list of all months and then populate with actual data
            current_year = timezone.now().year

            # Initialize meetings by month with all months
            months_abbr = [
                "JAN",
                "FEB",
                "MARCH",
                "APRIL",
                "MAY",
                "JUNE",
                "JULY",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC",
            ]
            meetings_by_month = [
                {"month": month, "meetings": 0} for month in months_abbr
            ]

            # Get the actual meeting counts by month
            meetings = Meeting.objects.filter(
                id__in=meeting_ids,
                scheduled_at__year=current_year,
            )

            # Count meetings by month
            for meeting in meetings:
                month_index = (
                    meeting.scheduled_at.month - 1
                )  # Adjust for 0-indexed list
                meetings_by_month[month_index]["meetings"] += 1

            # Coaching influencers (trainer + advisors) from most recent enrollment
            coaching_influencers = []
            if has_full_dashboard_access:
                latest_enrollment = (
                    enrollments.select_related("service__trainer")
                    .prefetch_related("service__advisors")
                    .order_by("-enrolled_at")
                    .first()
                )
                if latest_enrollment and latest_enrollment.service:
                    trainer = latest_enrollment.service.trainer
                    if trainer:
                        trainer_name = trainer.get_full_name().strip() or trainer.username
                        if trainer_name:
                            coaching_influencers.append(trainer_name)
                    for advisor in latest_enrollment.service.advisors.all():
                        advisor_name = (
                            advisor.get_full_name().strip() or advisor.username
                        )
                        if advisor_name and advisor_name not in coaching_influencers:
                            coaching_influencers.append(advisor_name)

            client_name = user.get_full_name().strip() or user.username
            client_id = str(user.id)
            sales_advisor_name = ""
            if client_profile and client_profile.assigned_sales:
                sales_advisor_name = _display_name(client_profile.assigned_sales)
            if not sales_advisor_name:
                sales_advisor_name = (user.sales_influencer_assigned or "").strip()

            latest_booked_meeting = (
                Meeting.objects.filter(
                    id__in=meeting_ids,
                    status__in=["scheduled", "confirmed", "active"],
                )
                .select_related("meeting_type", "service")
                .order_by("-created_at", "-scheduled_at", "-id")
                .first()
            )
            latest_booked_meeting_data = _format_dashboard_meeting(
                latest_booked_meeting,
                user,
                sales_advisor_name=sales_advisor_name,
            )

            discovery_meeting = (
                Meeting.objects.filter(
                    id__in=meeting_ids,
                    scheduled_at__date__gte=today,
                    status__in=["scheduled", "confirmed", "active"],
                )
                .filter(
                    Q(meeting_type__name__icontains="Discovery")
                    | Q(meeting_type__name__icontains="Initial")
                    | Q(meeting_type__name__icontains="Consultation")
                    | Q(title__icontains="Discovery")
                    | Q(title__icontains="Sales Meeting")
                )
                .select_related("meeting_type")
                .order_by("scheduled_at", "id")
                .first()
            )
            discovery_call = None
            if discovery_meeting:
                sales_attendee = (
                    MeetingAttendee.objects.filter(
                        meeting=discovery_meeting, role="sales"
                    )
                    .select_related("user")
                    .first()
                )
                discovery_call = {
                    "id": discovery_meeting.id,
                    "title": discovery_meeting.title,
                    "scheduledAt": discovery_meeting.scheduled_at.isoformat(),
                    "date": discovery_meeting.scheduled_at.date().isoformat(),
                    "time": discovery_meeting.scheduled_at.strftime("%I:%M %p"),
                    "meetingType": discovery_meeting.meeting_type.name,
                    "salesAdvisor": _display_name(sales_attendee.user)
                    if sales_attendee
                    else sales_advisor_name,
                }

            # Prepare response data
            overview_data = {
                "programsEnrolled": programs_enrolled,
                "ebooksBought": ebooks_bought,
                "meetingsToday": meetings_today,
                "latestMeetingOn": latest_meeting_on,
                "meetingsByMonth": meetings_by_month,  # Include all months
                "clientName": client_name,
                "clientId": client_id,
                "salesInfluencer": sales_advisor_name,
                "salesAdvisor": sales_advisor_name,
                "sales_influencer": sales_advisor_name,
                "sales_advisor": sales_advisor_name,
                "coachingInfluencers": coaching_influencers,
                "hasFullDashboardAccess": has_full_dashboard_access,
                "dashboardAccessLevel": (
                    client_profile.dashboard_access_level
                    if client_profile
                    else "full"
                ),
                "clientProgramStatus": (
                    client_profile.program_status if client_profile else None
                ),
                "clientContractStatus": (
                    client_profile.contract_status if client_profile else None
                ),
                "discoveryCall": discovery_call,
                "latestBookedMeeting": latest_booked_meeting_data,
            }

            # Serialize the data
            serializer = ClientOverviewSerializer(overview_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientOverviewView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve client overview", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientProgramsListView(APIView):
    """
    GET /api/lms/client/programs/ - Get all programs enrolled by the logged-in user
    Returns list of programs with id, name, and enrolledOn
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            if not _client_has_full_dashboard_access(user):
                return Response([], status=status.HTTP_200_OK)

            # Get user enrollments
            enrollments = (
                Enrollment.objects.filter(user=user)
                .select_related("service")
                .order_by("-enrolled_at")
            )

            # Serialize the data
            serializer = EnrolledProgramSerializer(enrollments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientProgramsListView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve enrolled programs", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientServiceDetailView(APIView):
    """
    GET /api/lms/client/serviceDetails/<service_id>/ - Get detailed information about a specific service
    Returns complete service details including chapters, files and progress information
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, service_id):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            if not _client_has_full_dashboard_access(user):
                return _full_dashboard_access_error()

            # Try to get the service by ID
            try:
                service = Service.objects.get(pk=service_id)
            except Service.DoesNotExist:
                return Response(
                    {"error": f"Service with ID {service_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            is_enrolled = Enrollment.objects.filter(user=user, service=service).exists()
            if not is_enrolled:
                return Response(
                    {"error": "You are not enrolled in this service"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the user's progress for this service (for future implementation)
            # This will be used in the future for tracking progress
            # enrollment = Enrollment.objects.filter(user=user, service=service).first()
            # if enrollment:
            #     progress_records = Progress.objects.filter(enrollment=enrollment)

            # Serialize the service with detailed information
            serializer = ClientServiceDetailSerializer(
                service, context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientServiceDetailView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve service details", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientFileUploadView(APIView):
    """
    POST /api/lms/client/uploadFile/<service_id>/ - Upload a file for a specific service
    The file will be associated with the service and the logged-in user
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, service_id):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            if not _client_has_full_dashboard_access(user):
                return _full_dashboard_access_error()

            # Try to get the service by ID
            try:
                service = Service.objects.get(pk=service_id)
            except Service.DoesNotExist:
                return Response(
                    {"error": f"Service with ID {service_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            enrollment = Enrollment.objects.filter(user=user, service=service).first()
            if not enrollment:
                return Response(
                    {"error": "You are not enrolled in this service"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Check if file was provided in the request
            if "file" not in request.FILES:
                return Response(
                    {"error": "No file was provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            file_obj = request.FILES["file"]

            # Validate file with enhanced security checks
            from .file_validators import validate_uploaded_file
            from django.conf import settings
            from django.core.exceptions import ValidationError

            try:
                check_content = getattr(settings, "VALIDATE_FILE_CONTENT", True)
                validation_result = validate_uploaded_file(
                    file_obj,
                    file_type=None,  # Will auto-detect from extension
                    check_content=check_content,
                )

                # Use sanitized filename if enabled
                if getattr(settings, "SANITIZE_FILE_NAMES", True):
                    file_obj.name = validation_result["sanitized_filename"]

                file_type = validation_result.get(
                    "mime_type", "application/octet-stream"
                )
                file_extension = validation_result["file_extension"]

            except ValidationError as e:
                return Response(
                    {"error": "File validation failed", "details": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get optional title and description from the request
            title = request.data.get("title", file_obj.name)
            description = request.data.get("description", None)

            # Determine file type category based on extension
            filename = file_obj.name
            file_type_category = "document"  # Default

            if filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
                file_type_category = "image"
            elif filename.lower().endswith((".mp4", ".avi", ".mov", ".wmv")):
                file_type_category = "video"
            elif filename.lower().endswith((".mp3", ".wav", ".ogg")):
                file_type_category = "audio"
            elif filename.lower().endswith((".xls", ".xlsx", ".csv")):
                file_type_category = "spreadsheet"
            elif filename.lower().endswith((".ppt", ".pptx")):
                file_type_category = "presentation"
            elif filename.lower().endswith((".pdf", ".doc", ".docx", ".txt")):
                file_type_category = "document"

            # Create a ServiceFile object
            service_file = ServiceFile.objects.create(
                service=service,
                title=title,
                description=description,
                file=file_obj,
                file_type=file_type_category,
                file_size=file_obj.size,
                file_extension=file_extension,
                is_downloadable=True,
                order=0,  # Default order
            )

            # Create a response with the created file details
            from .client_serializers import ServiceFileSerializer

            serializer = ServiceFileSerializer(service_file)

            return Response(
                {"message": "File uploaded successfully", "file": serializer.data},
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Error in ClientFileUploadView: {str(e)}")
            return Response(
                {"error": "Failed to upload file", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientEbooksListView(APIView):
    """
    GET /api/lms/client/ebooks/ - Get all ebooks purchased by the logged-in client
    Returns list of ebooks with their details
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Get all ebook purchases for the user
            # This includes both authenticated purchases and guest purchases with the same email
            purchases = EbookPurchase.objects.filter(
                Q(user=user) | Q(customer_email=user.email),
                status="completed",  # Only include completed purchases
            ).select_related("ebook")

            # Extract unique ebooks from the purchases (remove duplicates)
            seen_ebooks = set()
            purchased_ebooks = []
            for purchase in purchases:
                if purchase.ebook.id not in seen_ebooks:
                    purchased_ebooks.append(purchase.ebook)
                    seen_ebooks.add(purchase.ebook.id)

            # Serialize the data
            serializer = ClientEbookSerializer(
                purchased_ebooks, many=True, context={"request": request}
            )

            return Response(
                {"count": len(purchased_ebooks), "ebooks": serializer.data},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error in ClientEbooksListView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve purchased ebooks", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientEbookDownloadView(APIView):
    """GET /api/lms/client/ebooks/<ebook_id>/download/ - Signed download for purchased ebooks"""

    permission_classes = [IsAuthenticated]

    def get(self, request, ebook_id):
        token = request.query_params.get("token", "")
        if not token:
            return Response(
                {"error": "Missing download token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not validate_signed_download_token(
            token=token,
            user_id=request.user.id,
            resource_type="ebook",
            resource_id=ebook_id,
        ):
            return Response(
                {"error": "Invalid or expired download link"},
                status=status.HTTP_403_FORBIDDEN,
            )

        ebook = get_object_or_404(Ebook, id=ebook_id, status="active")
        if not user_has_ebook_access(request.user, ebook):
            return Response(
                {"error": "You are not authorized to download this ebook"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not ebook.file:
            return Response(
                {"error": "Ebook file is not available"},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = ebook.file.name.rsplit("/", 1)[-1] or f"{ebook.title}.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            ebook.file.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class ClientCalendarView(APIView):
    """
    GET /api/lms/client/calendar/ - Get calendar meetings for the logged-in client
    Returns meetings in the same format as sales calendar
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get calendar meetings for the client user in the specified format"""
        client_user = request.user

        # Check if user is a client
        if client_user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

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

        try:
            # Query meetings where client user is involved
            client_meetings = (
                Meeting.objects.filter(
                    Q(attendees__user=client_user, attendees__role="client"),
                    scheduled_at__date__gte=start_date,
                    scheduled_at__date__lte=end_date,
                    status__in=["scheduled", "confirmed", "active"],
                )
                .select_related("meeting_type", "scheduled_by", "service")
                .distinct()
            )

            # Group meetings by date
            meetings_by_date = {}

            for meeting in client_meetings:
                meeting_date = (
                    meeting.scheduled_at.date().isoformat()
                )  # YYYY-MM-DD format

                if meeting_date not in meetings_by_date:
                    meetings_by_date[meeting_date] = []

                # Get sales person from meeting attendees
                sales_attendee = (
                    MeetingAttendee.objects.filter(meeting=meeting, role="sales")
                    .select_related("user")
                    .first()
                )

                sales_name = ""
                if sales_attendee:
                    sales_name = _display_name(sales_attendee.user)
                if not sales_name:
                    client_profile = _get_client_profile(client_user)
                    sales_name = _display_name(
                        client_profile.assigned_sales if client_profile else None
                    )

                # Get programs/services the client is enrolled in
                enrollments = Enrollment.objects.filter(
                    user=client_user
                ).select_related("service")[:3]  # Limit to 3 programs

                client_programs = [
                    enrollment.service.title for enrollment in enrollments
                ]

                # Get advisor/trainers from meeting attendees
                trainer_attendees = (
                    MeetingAttendee.objects.filter(
                        meeting=meeting, role__in=["trainer", "organizer"]
                    )
                    .select_related("user")
                    .exclude(user=client_user)
                    .exclude(user__role="sales")
                )

                advisor_names = []
                for trainer_attendee in trainer_attendees:
                    name = _display_name(trainer_attendee.user)
                    if name:
                        advisor_names.append(name)

                advisor_display = ", ".join(advisor_names)

                # Combine programs for display
                if meeting.service:
                    program_display = meeting.service.title
                else:
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
                    "salesAdvisor": sales_name,
                    "salesInfluencer": sales_name,
                    "program": program_display,
                    "programName": program_display,
                    "programId": str(meeting.service.id) if meeting.service else None,
                    "serviceId": str(meeting.service.id) if meeting.service else None,
                    "serviceTitle": meeting.service.title if meeting.service else None,
                    "meetingType": meeting.meeting_type.name,
                    "scheduledAt": meeting.scheduled_at.isoformat(),
                    "bookedAt": meeting.created_at.isoformat()
                    if meeting.created_at
                    else None,
                    "createdAt": meeting.created_at.isoformat()
                    if meeting.created_at
                    else None,
                    "status": meeting.status,
                    "clientName": f"{client_user.first_name} {client_user.last_name}".strip(),
                    "time": meeting.scheduled_at.strftime("%I:%M %p"),
                    "type": meeting_type_code,
                }

                meetings_by_date[meeting_date].append(meeting_data)

            return Response(meetings_by_date, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientCalendarView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve calendar meetings", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientScheduleMeetingView(APIView):
    """
    POST /api/lms/client/scheduleMeeting/<service_id>/ - Schedule a meeting with assigned trainers
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, service_id):
        """Schedule a meeting between client and service trainers"""
        client_user = request.user

        # Check if user is a client
        if client_user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            if not _client_has_full_dashboard_access(client_user):
                return _full_dashboard_access_error()

            # Get the service
            service = get_object_or_404(Service, id=service_id)

            # Check if client is enrolled in this service
            enrollment = Enrollment.objects.filter(
                user=client_user, service=service
            ).first()

            if not enrollment:
                return Response(
                    {"error": "You are not enrolled in this service"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Validate request data
            serializer = ClientScheduleMeetingSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            meeting_date = serializer.validated_data.get("date")
            meeting_time = serializer.validated_data.get("time")

            # Combine date and time
            meeting_datetime = timezone.datetime.combine(meeting_date, meeting_time)
            meeting_datetime = timezone.make_aware(meeting_datetime)

            # Check if the meeting is in the future
            if meeting_datetime <= timezone.now():
                return Response(
                    {"error": "Meeting must be scheduled for a future date and time"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get or create meeting type for program meetings
            meeting_type, created = MeetingType.objects.get_or_create(
                name="Program Session",
                defaults={
                    "description": "Training session for enrolled programs",
                    "requires_trainers": True,
                    "allows_multiple_trainers": True,
                },
            )

            # Collect all unique trainers (primary + advisors)
            all_trainers = set()
            if service.trainer:
                all_trainers.add(service.trainer)
            all_trainers.update(service.advisors.all())

            if not all_trainers:
                return Response(
                    {"error": "No trainers are assigned to this service"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            participants = list(all_trainers) + [client_user]
            meeting_duration = timedelta(hours=1)

            # Prevent double-booking for client or any assigned trainer
            with transaction.atomic():
                Meeting.lock_users_for_scheduling(participants)

                conflict = Meeting.find_conflict(
                    users=participants,
                    start_dt=meeting_datetime,
                    duration=meeting_duration,
                )
                if conflict:
                    return Response(
                        {
                            "error": "Selected time conflicts with an existing meeting",
                            "conflict_meeting_id": conflict.id,
                            "conflict_title": conflict.title,
                            "conflict_start": conflict.scheduled_at,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                appointment_conflict = SchedulingAppointment.find_conflict(
                    users=participants,
                    start_dt=meeting_datetime,
                    duration=meeting_duration,
                )
                if appointment_conflict:
                    return Response(
                        {
                            "error": "Selected time conflicts with an existing appointment",
                            "conflict_appointment_id": appointment_conflict.id,
                            "conflict_start": appointment_conflict.scheduled_at,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create the meeting
                meeting = Meeting.objects.create(
                    title=f"{service.title} - Training Session",
                    meeting_type=meeting_type,
                    scheduled_by=client_user,
                    scheduled_at=meeting_datetime,
                    duration=meeting_duration,
                    status="scheduled",
                    notes=f"Training session for {service.title} program with {client_user.get_full_name()}",
                    location="Online",  # Default to online
                    service=service,
                )

                # Add client as attendee
                MeetingAttendee.objects.get_or_create(
                    meeting=meeting,
                    user=client_user,
                    defaults={
                        "role": "client",
                        "is_confirmed": True,  # Client confirmed by scheduling
                    },
                )

                # Add all unique trainers as attendees
                for trainer in all_trainers:
                    MeetingAttendee.objects.get_or_create(
                        meeting=meeting,
                        user=trainer,
                        defaults={"role": "trainer", "is_confirmed": False},
                    )

            # Ops email for client-scheduled meeting
            send_ops_email(
                subject="Client Meeting Scheduled",
                message=(
                    f"Client: {client_user.email}\n"
                    f"Service: {service.title}\n"
                    f"Scheduled for: {meeting_datetime}\n"
                    f"Meeting ID: {meeting.id}"
                ),
            )

            # Send emails to all attendees
            try:
                meeting.send_invitation_emails()
            except Exception as e:
                logger.error(f"Failed to send meeting emails: {str(e)}")
                # Don't fail the meeting creation if email fails

            # Send in-app notifications to all attendees
            try:
                self.send_meeting_notifications(meeting)
            except Exception as e:
                logger.error(f"Failed to send meeting notifications: {str(e)}")
                # Don't fail the meeting creation if notifications fail

            # Prepare response data
            attendees_data = []
            for attendee in meeting.attendees.all():
                attendees_data.append(
                    {
                        "userId": str(attendee.user.id),
                        "name": attendee.user.get_full_name(),
                        "email": attendee.user.email,
                        "role": attendee.role,
                        "isConfirmed": attendee.is_confirmed,
                    }
                )

            response_data = {
                "message": "Meeting scheduled successfully",
                "meetingId": meeting.id,
                "title": meeting.title,
                "scheduledAt": meeting.scheduled_at.isoformat(),
                "duration": str(meeting.duration),
                "status": meeting.status,
                "service": {"id": service.id, "title": service.title},
                "attendees": attendees_data,
            }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in ClientScheduleMeetingView: {str(e)}")
            return Response(
                {"error": "Failed to schedule meeting", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def send_meeting_notifications(self, meeting):
        """Send in-app notifications to all meeting attendees"""
        from comms.models import Notification

        attendees = meeting.attendees.all()

        for attendee in attendees:
            # Create notification for each attendee
            notification_title = f"New Meeting: {meeting.title}"
            notification_message = f"You have been invited to a meeting on {meeting.scheduled_at.strftime('%Y-%m-%d at %H:%M')}. Duration: {meeting.duration}."

            Notification.objects.create(
                user=attendee.user,
                title=notification_title,
                message=notification_message,
                type="meeting",
                related_id=meeting.id,
            )


class ClientTrainerScheduleView(APIView):
    """
    GET /api/lms/client/schedule/<service_id>/ - Get available schedule slots for assigned trainers
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, service_id):
        """Get free time slots for all assigned trainers of a service"""
        client_user = request.user

        # Check if user is a client
        if client_user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            if not _client_has_full_dashboard_access(client_user):
                return _full_dashboard_access_error()

            # Get the service
            service = get_object_or_404(Service, id=service_id)

            # Check if client is enrolled in this service
            enrollment = Enrollment.objects.filter(
                user=client_user, service=service
            ).first()

            if not enrollment:
                return Response(
                    {"error": "You are not enrolled in this service"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get date range from query parameters (optional)
            days_ahead = int(request.query_params.get("days", 30))  # Default 30 days
            start_date = timezone.now().date()
            end_date = start_date + timedelta(days=days_ahead)

            # Collect all assigned trainers
            trainers = []
            if service.trainer:
                trainers.append(service.trainer)
            trainers.extend(service.advisors.all())

            if not trainers:
                return Response(
                    {"error": "No trainers assigned to this service"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Define working hours (9 AM to 6 PM, hourly slots)
            working_hours = [
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
                "18:00",
            ]

            # Get all existing meetings for these trainers in the date range
            trainer_meetings = Meeting.objects.filter(
                attendees__user__in=trainers,
                attendees__role__in=["trainer", "organizer"],
                scheduled_at__date__gte=start_date,
                scheduled_at__date__lte=end_date,
                status__in=["scheduled", "confirmed"],
            ).values_list("scheduled_at", "attendees__user_id")

            # Create a dictionary to track busy slots per trainer per day
            busy_slots = {}
            for meeting_datetime, trainer_id in trainer_meetings:
                meeting_date = meeting_datetime.date().strftime("%d-%m-%Y")
                meeting_time = meeting_datetime.strftime("%H:%M")

                if trainer_id not in busy_slots:
                    busy_slots[trainer_id] = {}
                if meeting_date not in busy_slots[trainer_id]:
                    busy_slots[trainer_id][meeting_date] = set()

                busy_slots[trainer_id][meeting_date].add(meeting_time)

            # Calculate free slots for each day
            free_days = {}
            current_date = start_date

            while current_date <= end_date:
                # Skip weekends (optional - you can remove this if needed)
                if current_date.weekday() < 5:  # Monday=0, Friday=4
                    date_str = current_date.strftime("%d-%m-%Y")

                    # Find slots that are free for ALL assigned trainers
                    available_slots = set(working_hours)

                    for trainer in trainers:
                        trainer_busy_slots = busy_slots.get(trainer.id, {}).get(
                            date_str, set()
                        )
                        # Remove busy slots from available slots
                        available_slots -= trainer_busy_slots

                    # Only include dates that have available slots
                    if available_slots:
                        free_days[date_str] = sorted(list(available_slots))

                current_date += timedelta(days=1)

            # Return only the free days
            return Response({"freeDays": free_days}, status=status.HTTP_200_OK)

        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in ClientTrainerScheduleView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve trainer schedule", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientOnboardingProgressView(APIView):
    """
    GET /api/lms/client/onboarding/progress - Get onboarding questionnaire progress
    Query param: user_email=<email>
    Returns list of questionnaires with questions answered count
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _client_has_full_dashboard_access(user):
            return _full_dashboard_access_error()

        # Get user_email from query parameters
        user_email = request.query_params.get("user_email")

        if not user_email:
            return Response(
                {"error": "user_email is required as query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the requested user_email matches the authenticated user
        if user_email != user.email:
            return Response(
                {"error": "You can only access your own onboarding progress"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Get all form answers for this user
            form_answers = ClientFormAnswers.objects.filter(user_email=user_email)

            # Group by questionnaire_title and count questions answered
            progress_data = []
            questionnaires = form_answers.values_list(
                "questionnaire_title", flat=True
            ).distinct()

            for title in questionnaires:
                # Get the latest submission for this questionnaire
                latest_answer = (
                    form_answers.filter(questionnaire_title=title)
                    .order_by("-created_at")
                    .first()
                )
                if latest_answer and latest_answer.data:
                    questions_answered = len(latest_answer.data)
                    progress_data.append(
                        {
                            "questionnaire_title": title,
                            "questions_answered": questions_answered,
                        }
                    )

            return Response(progress_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientOnboardingProgressView: {str(e)}")
            return Response(
                {"error": "Failed to retrieve onboarding progress", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientQuestionnaireProgressView(APIView):
    """
    GET /api/lms/client/onboarding/questionnaire/progress - Get specific questionnaire answers
    Query params: user_email=<email>&questionnaire_title=<title>
    Returns the question answers array
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _client_has_full_dashboard_access(user):
            return _full_dashboard_access_error()

        # Get parameters from query parameters
        user_email = request.query_params.get("user_email")
        questionnaire_title = request.query_params.get("questionnaire_title")

        if not user_email:
            return Response(
                {"error": "user_email is required as query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not questionnaire_title:
            return Response(
                {"error": "questionnaire_title is required as query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clean the questionnaire_title (remove trailing slash if present)
        questionnaire_title = questionnaire_title.rstrip("/")

        # Check if the requested user_email matches the authenticated user
        if user_email != user.email:
            return Response(
                {"error": "You can only access your own questionnaire progress"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Get the latest form answers for this user and questionnaire
            # Try with and without trailing slash
            form_answer = (
                ClientFormAnswers.objects.filter(
                    user_email=user_email,
                    questionnaire_title__in=[
                        questionnaire_title,
                        questionnaire_title + "/",
                    ],
                )
                .order_by("-created_at")
                .first()
            )

            if not form_answer:
                return Response(
                    {
                        "error": f"No answers found for questionnaire '{questionnaire_title}'"
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Return the data array
            return Response(form_answer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in ClientQuestionnaireProgressView: {str(e)}")
            return Response(
                {
                    "error": "Failed to retrieve questionnaire progress",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ClientOnboardingView(APIView):
    """
    POST /api/lms/client/onboarding/ - Save client onboarding questionnaire answers
    Accepts JSON with user_email, questionnaire_title, and data array
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if user is a client
        if user.role != "client":
            return Response(
                {"error": "This endpoint is only available for clients"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _client_has_full_dashboard_access(user):
            return _full_dashboard_access_error()

        try:
            # Get data from request
            user_email = request.data.get("user_email")
            questionnaire_title = request.data.get("questionnaire_title")
            data = request.data.get("data")

            # Validate required fields
            if not user_email:
                return Response(
                    {"error": "user_email is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not questionnaire_title:
                return Response(
                    {"error": "questionnaire_title is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Clean the questionnaire_title (remove trailing slash if present)
            questionnaire_title = questionnaire_title.rstrip("/")

            if not data or not isinstance(data, list):
                return Response(
                    {"error": "data must be a non-empty array"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate data format
            for item in data:
                if (
                    not isinstance(item, dict)
                    or "question" not in item
                    or "answer" not in item
                ):
                    return Response(
                        {
                            "error": "Each item in data must have 'question' and 'answer' fields"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Create the form answers record
            form_answer = ClientFormAnswers.objects.create(
                user_email=user_email,
                questionnaire_title=questionnaire_title,
                data=data,
            )

            # Check if all 6 assessments are now complete; if so, notify coaching advisors
            try:
                completed_count = ClientFormAnswers.objects.filter(
                    user_email=user_email
                ).values("questionnaire_title").distinct().count()
                if completed_count >= 6:
                    self._notify_advisors_of_completion(user)
            except Exception as notify_err:
                logger.warning(f"Failed to send advisor notification: {notify_err}")

            return Response(
                {
                    "message": "Questionnaire answers saved successfully",
                    "id": form_answer.id,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Error in ClientOnboardingView: {str(e)}")
            return Response(
                {"error": "Failed to save questionnaire answers", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _notify_advisors_of_completion(self, client_user):
        """Send in-app notification and email to coaching advisors when client completes all 6 assessments."""
        from comms.models import Notification
        from comms.utils import NEW_CLIENT_SIGNUP_EMAILS, send_internal_email
        from .models import Enrollment

        client_name = client_user.get_full_name().strip() or client_user.username
        notification_title = "Client Completed All 6 Assessments"
        notification_message = (
            f"{client_name} ({client_user.email}) has completed all 6 assessments. "
            f"Please review their responses in the client details page."
        )

        # Collect advisors from the client's program enrollments
        advisor_users = set()
        enrollments = (
            Enrollment.objects.filter(user=client_user)
            .select_related("service__trainer")
            .prefetch_related("service__advisors")
        )
        for enrollment in enrollments:
            service = enrollment.service
            if service.trainer:
                advisor_users.add(service.trainer)
            for advisor in service.advisors.all():
                advisor_users.add(advisor)

        # Send in-app notifications to each advisor
        for advisor in advisor_users:
            Notification.objects.create(
                user=advisor,
                title=notification_title,
                message=notification_message,
                type="system",
            )

        # Send email to all coaching advisor emails, fallback to default ops emails
        advisor_emails = [a.email for a in advisor_users if a.email]
        if not advisor_emails:
            advisor_emails = list(NEW_CLIENT_SIGNUP_EMAILS)
        email_body = (
            f"Hello,\n\n"
            f"{notification_message}\n\n"
            f"Log in to the coaching advisor dashboard to view their assessment responses.\n\n"
            f"The CEO Influencers"
        )
        send_internal_email(
            subject=f"[TCI] {notification_title}: {client_name}",
            message=email_body,
            recipient_list=advisor_emails,
        )
