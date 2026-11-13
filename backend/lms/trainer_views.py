from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsTrainer
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, time as datetime_time
import calendar
from django.contrib.auth import get_user_model
from people.models import Client
from scheduling.models import Meeting, MeetingAttendee
from lms.models import Enrollment, Service, Progress, ClientFormAnswers, Chapter
from django.db import models

User = get_user_model()


class TrainerDashboardView(APIView):
    """GET /api/lms/trainer/dashboard/ - Get trainer dashboard data"""

    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        # Get current trainer
        trainer = request.user

        services = (
            Service.objects.filter(Q(trainer=trainer) | Q(advisors=trainer))
            .prefetch_related("chapters__chapter_files")
            .distinct()
            .order_by("order", "title")
        )

        # Get clients enrolled in services where the current user is either the trainer or an advisor
        clients_enrolled = User.objects.filter(
            Q(enrollments__service__trainer=trainer)
            | Q(enrollments__service__advisors=trainer),
            role="client",
        ).distinct()

        clients_assigned = clients_enrolled.count()

        # Get meetings with clients today
        today = timezone.now().date()
        today_start = timezone.make_aware(
            datetime.combine(today, datetime_time(0, 0, 0))
        )
        today_end = timezone.make_aware(
            datetime.combine(today, datetime_time(23, 59, 59, 999999))
        )

        # Find meetings where this trainer is either the organizer or an attendee with role="trainer"
        trainer_meetings_today = Meeting.objects.filter(
            Q(scheduled_by=trainer) | Q(attendees__user=trainer, attendees__role="trainer"),
            scheduled_at__range=(today_start, today_end),
            status__in=["scheduled", "confirmed"],
        ).distinct()

        # Get unique clients having meetings today - only those enrolled in trainer's services
        client_ids_with_meetings_today = (
            MeetingAttendee.objects.filter(
                meeting__in=trainer_meetings_today,
                role="client",
                user__in=clients_enrolled,  # Only clients enrolled in trainer's services
            )
            .values_list("user_id", flat=True)
            .distinct()
        )

        clients_meeting_today = len(client_ids_with_meetings_today)

        # Generate clients per month data for chart
        # Get current month and go back 6 months
        current_month = timezone.now().month
        current_year = timezone.now().year

        clients_by_month = []
        for i in range(6, -1, -1):
            # Calculate the month and year (going back i months)
            month_offset = (current_month - i - 1) % 12 + 1  # Adjust to 1-12 range
            year_offset = current_year - ((current_month - month_offset) // 12)

            # Get start and end date for the month
            start_date = datetime(year_offset, month_offset, 1)
            last_day = calendar.monthrange(year_offset, month_offset)[1]
            end_date = datetime(year_offset, month_offset, last_day, 23, 59, 59)

            # Make timezone-aware
            start_date = timezone.make_aware(start_date)
            end_date = timezone.make_aware(end_date)

            # Count clients enrolled in this trainer's services during this month
            count = (
                Enrollment.objects.filter(
                    (Q(service__trainer=trainer) | Q(service__advisors=trainer)),
                    enrolled_at__gte=start_date,
                    enrolled_at__lte=end_date,
                )
                .values("user")
                .distinct()
                .count()
            )

            # Get month abbreviation
            month_abbr = calendar.month_abbr[month_offset].upper()

            clients_by_month.append({"month": month_abbr, "clients": count})

        programs = []
        for service in services:
            latest_enrollment = (
                Enrollment.objects.filter(service=service)
                .order_by("-enrolled_at")
                .first()
            )
            enrolled_on = (
                latest_enrollment.enrolled_at.isoformat()
                if latest_enrollment and latest_enrollment.enrolled_at
                else None
            )
            chapters = [
                {
                    "id": str(chapter.id),
                    "title": chapter.title,
                    "shortDescription": chapter.short_description,
                    "description": chapter.description or chapter.content,
                    "content": chapter.content,
                    "order": chapter.order,
                    "week": chapter.week,
                    "files": [
                        {
                            "id": str(file.id),
                            "title": file.title,
                            "description": file.description,
                            "fileUrl": file.file.url if file.file else None,
                            "fileType": file.file_type,
                            "fileExtension": file.file_extension,
                        }
                        for file in chapter.chapter_files.all()
                    ],
                }
                for chapter in service.chapters.all().order_by("order")
            ]
            programs.append(
                {
                    "id": str(service.id),
                    "name": service.title,
                    "status": service.status,
                    "enrolledOn": enrolled_on,
                    "chapters": chapters,
                }
            )

        response_data = {
            "clientsAssigned": clients_assigned,
            "clientsMeetingToday": clients_meeting_today,
            "clients": clients_by_month,
            "programs": programs,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class TrainerClientsView(APIView):
    """GET /api/lms/trainer/clients/ - Get list of clients assigned to trainer"""

    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        # Get current trainer
        trainer = request.user

        # Get clients enrolled in services where the current user is either the trainer or an advisor
        clients_enrolled = User.objects.filter(
            Q(enrollments__service__trainer=trainer)
            | Q(enrollments__service__advisors=trainer),
            role="client",
        ).distinct()

        clients_assigned = clients_enrolled.count()

        # Get meetings with clients today
        today = timezone.now().date()
        today_start = timezone.make_aware(
            datetime.combine(today, datetime_time(0, 0, 0))
        )
        today_end = timezone.make_aware(
            datetime.combine(today, datetime_time(23, 59, 59, 999999))
        )

        # Find meetings where this trainer is either the organizer or an attendee with role="trainer"
        trainer_meetings_today = Meeting.objects.filter(
            Q(scheduled_by=trainer) | Q(attendees__user=trainer, attendees__role="trainer"),
            scheduled_at__range=(today_start, today_end),
            status__in=["scheduled", "confirmed"],
        ).distinct()

        # Get unique client IDs with meetings today
        client_ids_with_meetings_today = (
            MeetingAttendee.objects.filter(
                meeting__in=trainer_meetings_today,
                role="client",
                user__in=clients_enrolled,  # Only clients enrolled in trainer's services
            )
            .values_list("user_id", flat=True)
            .distinct()
        )

        clients_meeting_today = len(client_ids_with_meetings_today)

        # Prepare clients list data
        clients_data = []
        for client_user in clients_enrolled:
            try:
                # Try to get client profile info
                client_profile = Client.objects.get(user=client_user)
                # Get enrollment status from the most recent enrollment
                enrollment = (
                    Enrollment.objects.filter(
                        user=client_user,
                        service__in=Service.objects.filter(
                            Q(trainer=trainer) | Q(advisors=trainer)
                        ),
                    )
                    .order_by("-enrolled_at")
                    .first()
                )

                client_status = "active"
                if enrollment:
                    if enrollment.completed:
                        client_status = "completed"
                    elif not enrollment.service.status == "active":
                        client_status = "inactive"

                completed_count = ClientFormAnswers.objects.filter(
                    user_email=client_user.email
                ).values("questionnaire_title").distinct().count()

                clients_data.append(
                    {
                        "clientID": str(client_user.id),
                        "clientName": f"{client_user.first_name} {client_user.last_name}".strip()
                        or client_user.username,
                        "clientEmail": client_user.email,
                        "status": client_status,
                        "completedAssessments": completed_count,
                    }
                )
            except Client.DoesNotExist:
                completed_count = ClientFormAnswers.objects.filter(
                    user_email=client_user.email
                ).values("questionnaire_title").distinct().count()
                # If client profile doesn't exist, use basic user data
                clients_data.append(
                    {
                        "clientID": str(client_user.id),
                        "clientName": f"{client_user.first_name} {client_user.last_name}".strip()
                        or client_user.username,
                        "clientEmail": client_user.email,
                        "status": "unknown",
                        "completedAssessments": completed_count,
                    }
                )

        response_data = {
            "clientsAssigned": clients_assigned,
            "clientsMeetingToday": clients_meeting_today,
            "clients": clients_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)


class TrainerCalendarView(APIView):
    """GET /api/lms/trainer/calendar/ - Get trainer calendar data"""

    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        """Get calendar meetings for the trainer in the specified format"""
        trainer = request.user

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

        # Query meetings where trainer is either the organizer or an attendee with role="trainer"
        # Check if user requested mine-only or master calendar (default: master calendar for internal staff)
        is_mine_only = request.query_params.get("view") == "mine"

        if is_mine_only:
            trainer_meetings = (
                Meeting.objects.filter(
                    models.Q(scheduled_by=trainer)
                    | models.Q(
                        attendees__user=trainer,
                        attendees__role="trainer",
                    ),
                    scheduled_at__date__gte=start_date,
                    scheduled_at__date__lte=end_date,
                    status__in=["scheduled", "confirmed", "active"],
                )
                .select_related("meeting_type", "scheduled_by")
                .distinct()
            )
        else:
            trainer_meetings = (
                Meeting.objects.filter(
                    scheduled_at__date__gte=start_date,
                    scheduled_at__date__lte=end_date,
                    status__in=["scheduled", "confirmed", "active"],
                )
                .select_related("meeting_type", "scheduled_by")
                .distinct()
            )

        from scheduling.calendar_helpers import format_meeting_for_calendar

        # Group meetings by date
        meetings_by_date = {}

        for meeting in trainer_meetings:
            meeting_date = meeting.scheduled_at.date().isoformat()  # YYYY-MM-DD format

            if meeting_date not in meetings_by_date:
                meetings_by_date[meeting_date] = []

            meetings_by_date[meeting_date].append(format_meeting_for_calendar(meeting))

        return Response(meetings_by_date, status=status.HTTP_200_OK)


class TrainerClientDetailView(APIView):
    """GET /api/lms/trainer/clients/<client_id>/ - Get detailed client info for trainer"""

    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request, client_id):
        trainer = request.user

        try:
            client_user = User.objects.get(id=client_id, role="client")
        except User.DoesNotExist:
            return Response(
                {"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Ensure this trainer is assigned to the client via enrollments (trainer or advisor)
        trainer_services = Service.objects.filter(
            Q(trainer=trainer) | Q(advisors=trainer)
        ).distinct()

        enrollments = (
            Enrollment.objects.filter(user=client_user, service__in=trainer_services)
            .select_related("service")
            .order_by("-enrolled_at")
        )

        if not enrollments.exists():
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        # Get client profile if exists
        try:
            client_profile = Client.objects.get(user=client_user)
        except Client.DoesNotExist:
            client_profile = None

        # Client basic details
        client_name = client_user.get_full_name().strip() or client_user.username
        client_details = {
            "id": str(client_user.id),
            "name": client_name,
            "joinedOn": client_user.date_joined.isoformat()
            if client_user.date_joined
            else None,
            "email": client_user.email,
            "sales_influencer_assigned": (
                client_profile.assigned_sales.get_full_name()
                if client_profile and client_profile.assigned_sales
                else None
            ),
        }

        # Programs (only those relevant to this trainer)
        programs = [
            {
                "programId": str(enrollment.service.id),
                "programName": enrollment.service.title,
                "enrolledAt": enrollment.enrolled_at.isoformat()
                if enrollment.enrolled_at
                else None,
                "completed": enrollment.completed,
                "status": enrollment.service.status,
            }
            for enrollment in enrollments
        ]

        # Meetings between this trainer and this client
        meetings_organizer = Meeting.objects.filter(
            scheduled_by=trainer,
            attendees__user=client_user,
            attendees__role="client"
        )
        meetings_attendee = Meeting.objects.filter(
            Q(attendees__user=trainer) & Q(attendees__user=client_user) & Q(attendees__role="client")
        )
        meetings = (meetings_organizer | meetings_attendee).distinct().order_by("-scheduled_at")

        meetings_data = [
            {
                "meetingId": str(meeting.id),
                "title": meeting.title,
                "scheduledAt": meeting.scheduled_at.isoformat()
                if meeting.scheduled_at
                else None,
                "duration": (
                    int(meeting.duration.total_seconds())
                    if meeting.duration
                    else None
                ),
                "status": meeting.status,
                "notes": meeting.notes,
                "meetingType": meeting.meeting_type.name if meeting.meeting_type else None,
            }
            for meeting in meetings
        ]

        # Progress (only for programs relevant to this trainer)
        # Get all chapters for enrolled services
        chapters = Chapter.objects.filter(service__in=[e.service for e in enrollments]).select_related('service').order_by('service', 'order')
        
        # Get progress entries
        progress_entries = (
            Progress.objects.filter(enrollment__in=enrollments)
            .select_related("enrollment__service", "chapter")
        )
        
        # Create a dict of progress by enrollment and chapter
        progress_dict = {}
        for progress in progress_entries:
            key = (progress.enrollment.id, progress.chapter.id)
            progress_dict[key] = progress

        programs_progress = {}
        for chapter in chapters:
            service_id = str(chapter.service.id)
            enrollment = next((e for e in enrollments if e.service.id == chapter.service.id), None)
            if not enrollment:
                continue
                
            if service_id not in programs_progress:
                programs_progress[service_id] = {
                    "programId": service_id,
                    "programName": chapter.service.title,
                    "chapters": [],
                }
            
            # Check if there's progress for this chapter
            progress_key = (enrollment.id, chapter.id)
            progress_entry = progress_dict.get(progress_key)
            
            programs_progress[service_id]["chapters"].append(
                {
                    "chapterId": str(chapter.id),
                    "title": chapter.title,
                    "completionPercent": 100 if progress_entry and progress_entry.completed else 0,
                    "updatedAt": (
                        progress_entry.completed_at.isoformat() if progress_entry and progress_entry.completed_at else None
                    ),
                }
            )

        progress_data = list(programs_progress.values())

        # Questionnaire / form answers
        form_answers = ClientFormAnswers.objects.filter(
            user_email=client_user.email
        ).order_by("-created_at")

        form_answers_data = [
            {
                "questionnaireTitle": answer.questionnaire_title,
                "data": answer.data,
                "createdAt": answer.created_at.isoformat() if answer.created_at else None,
                "updatedAt": answer.updated_at.isoformat() if answer.updated_at else None,
            }
            for answer in form_answers
        ]

        # 6 Core Leadership Assessments for Initial Discovery Meeting
        SIX_ASSESSMENTS = [
            (
                1,
                "Fitness Assessment",
                [
                    "Current Weight",
                    "Target Weight",
                    "Height",
                    "Fitness Level",
                    "Exercise Frequency",
                    "Preferred Activities",
                ],
            ),
            (
                2,
                "Nutrition Assessment",
                [
                    "Diet Type",
                    "Meal Frequency",
                    "Water Intake",
                    "Food Allergies",
                    "Supplements",
                    "Eating Habits",
                ],
            ),
            (
                3,
                "Lifestyle Assessment",
                [
                    "Sleep Hours",
                    "Stress Level",
                    "Work Schedule",
                    "Smoking",
                    "Alcohol Consumption",
                    "Daily Routine",
                ],
            ),
            (
                4,
                "Goal Setting",
                [
                    "Primary Goal",
                    "Timeline",
                    "Motivation Level",
                    "Past Attempts",
                    "Support System",
                    "Measurement Preference",
                ],
            ),
            (
                5,
                "Medical History",
                [
                    "Medical Conditions",
                    "Medications",
                    "Injuries",
                    "Surgeries",
                    "Family History",
                    "Doctor Visits",
                ],
            ),
            (
                6,
                "Preferences & Availability",
                [
                    "Preferred Time",
                    "Available Days",
                    "Communication Preference",
                    "Workout Location",
                    "Equipment Access",
                    "Group Preference",
                ],
            ),
        ]

        from people.models import Lead, LeadAssessmentEntry

        lead = Lead.objects.filter(email__iexact=client_user.email).first()
        structured_assessments = []

        for a_id, a_title, default_questions in SIX_ASSESSMENTS:
            cfa = ClientFormAnswers.objects.filter(
                user_email__iexact=client_user.email,
                questionnaire_title__iexact=a_title,
            ).order_by("-created_at").first()

            lae = None
            if not cfa and lead:
                lae = LeadAssessmentEntry.objects.filter(
                    lead=lead, assessment_id=a_id
                ).first()

            if cfa and cfa.data:
                answered_count = len(
                    [x for x in cfa.data if str(x.get("answer", "")).strip()]
                )
                is_completed = answered_count > 0
                structured_assessments.append(
                    {
                        "id": a_id,
                        "title": a_title,
                        "completed": is_completed,
                        "completedAt": (
                            cfa.created_at.isoformat() if cfa.created_at else None
                        ),
                        "answeredCount": answered_count,
                        "totalQuestions": len(cfa.data),
                        "data": cfa.data,
                    }
                )
            elif lae and lae.assessment_data:
                formatted_data = [
                    {
                        "question": k.replace("_", " ").title(),
                        "answer": str(v),
                    }
                    for k, v in lae.assessment_data.items()
                ]
                is_completed = bool(getattr(lae, "is_completed", False)) or len(
                    formatted_data
                ) > 0
                structured_assessments.append(
                    {
                        "id": a_id,
                        "title": a_title,
                        "completed": is_completed,
                        "completedAt": (
                            lae.completed_at.isoformat()
                            if getattr(lae, "completed_at", None)
                            else None
                        ),
                        "answeredCount": len(formatted_data),
                        "totalQuestions": len(formatted_data),
                        "data": formatted_data,
                    }
                )
            else:
                structured_assessments.append(
                    {
                        "id": a_id,
                        "title": a_title,
                        "completed": False,
                        "completedAt": None,
                        "answeredCount": 0,
                        "totalQuestions": len(default_questions),
                        "data": [
                            {"question": q, "answer": ""}
                            for q in default_questions
                        ],
                    }
                )

        return Response(
            {
                "client": client_details,
                "programs": programs,
                "meetings": meetings_data,
                "progress": progress_data,
                "formAnswers": form_answers_data,
                "assessments": structured_assessments,
            },
            status=status.HTTP_200_OK,
        )


class TrainerClientAssessmentView(APIView):
    """
    POST /api/lms/trainer/clients/<client_id>/assessments/
    Save or update client assessment results in the master internal database.
    """

    permission_classes = [IsAuthenticated, IsTrainer]

    def post(self, request, client_id):
        try:
            client_user = User.objects.get(id=client_id, role="client")
        except User.DoesNotExist:
            return Response(
                {"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND
            )

        assessment_id = request.data.get("assessment_id")
        questionnaire_title = request.data.get("questionnaire_title")
        data = request.data.get("data") or []

        if not questionnaire_title:
            return Response(
                {"error": "questionnaire_title is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save to ClientFormAnswers in the master database
        form_answer, _ = ClientFormAnswers.objects.update_or_create(
            user_email=client_user.email,
            questionnaire_title=questionnaire_title,
            defaults={
                "data": data,
                "created_at": timezone.now(),
            },
        )

        # Also sync to LeadAssessmentEntry if a lead exists
        from people.models import Lead, LeadAssessmentEntry

        lead = Lead.objects.filter(email__iexact=client_user.email).first()
        if lead and assessment_id:
            try:
                dict_data = {
                    item.get("question", f"q{i}"): item.get("answer", "")
                    for i, item in enumerate(data)
                }
                LeadAssessmentEntry.objects.update_or_create(
                    lead=lead,
                    assessment_id=int(assessment_id),
                    defaults={
                        "assessment_data": dict_data,
                        "is_completed": True,
                        "completed_at": timezone.now(),
                    },
                )
            except Exception as e:
                logger.warning(f"Could not sync to LeadAssessmentEntry: {e}")

        return Response(
            {
                "message": f"{questionnaire_title} results saved to master internal database successfully.",
                "id": form_answer.id,
                "client": client_user.email,
                "questionnaire_title": questionnaire_title,
                "completed": True,
            },
            status=status.HTTP_200_OK,
        )
