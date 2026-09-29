from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
from comms.models import Notification
from comms.utils import send_ops_email
from .models import Availability, Meeting, MeetingType, MeetingAttendee, Appointment
from .serializers import (
    TrainerSerializer,
    MeetingTypeSerializer,
    AvailableSlotSerializer,
    MeetingSerializer,
    MeetingDetailSerializer,
)
from accounts.permissions import IsSales, IsTrainer

User = get_user_model()


class GetAvailableTrainersView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        """Get all available trainers for scheduling"""
        trainers = User.objects.filter(
            role="trainer", is_approved=True, is_suspended=False
        )
        serializer = TrainerSerializer(trainers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetMeetingTypesView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def get(self, request):
        """Get all available meeting types"""
        meeting_types = MeetingType.objects.all()
        serializer = MeetingTypeSerializer(meeting_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetAvailableSlotsView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        """Get available time slots for selected trainers"""
        trainer_ids = request.data.get("trainer_ids", [])
        meeting_type_id = request.data.get("meeting_type_id")
        date = request.data.get("date")  # Format: YYYY-MM-DD

        if not trainer_ids or not meeting_type_id or not date:
            return Response(
                {"error": "trainer_ids, meeting_type_id, and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            meeting_type = MeetingType.objects.get(id=meeting_type_id)
            date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except (MeetingType.DoesNotExist, ValueError):
            return Response(
                {"error": "Invalid meeting type or date format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get selected trainers
        trainers = User.objects.filter(id__in=trainer_ids, role="trainer")

        if len(trainers) != len(trainer_ids):
            return Response(
                {"error": "Some trainers not found or not available"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find common available slots
        available_slots = self._find_common_slots(trainers, date_obj, meeting_type)

        serializer = AvailableSlotSerializer(available_slots, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _find_common_slots(self, trainers, date, meeting_type):
        """Find common available time slots for all selected trainers"""
        day_name = date.strftime("%A").lower()

        # Get availability for each trainer on this day
        trainer_availabilities = []
        for trainer in trainers:
            availabilities = Availability.objects.filter(
                trainer=trainer, day_of_week=day_name
            )
            if availabilities.exists():
                trainer_availabilities.append(list(availabilities))

        if not trainer_availabilities:
            return []

        # Find intersection of all trainers' availability
        if len(trainer_availabilities) == 1:
            common_slots = trainer_availabilities[0]
        else:
            # Find overlapping time slots
            common_slots = self._find_overlapping_slots(trainer_availabilities)

        # Filter out slots that are already booked
        available_slots = []
        for slot in common_slots:
            if self._is_slot_available(slot, trainers, date):
                available_slots.append(
                    {
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                        "trainer_ids": [t.id for t in trainers],
                    }
                )

        return available_slots

    def _find_overlapping_slots(self, trainer_availabilities):
        """Find overlapping time slots between multiple trainers"""
        if not trainer_availabilities:
            return []

        # Start with first trainer's slots
        common = trainer_availabilities[0]

        for trainer_slots in trainer_availabilities[1:]:
            new_common = []
            for slot1 in common:
                for slot2 in trainer_slots:
                    overlap = self._get_overlap(slot1, slot2)
                    if overlap:
                        new_common.append(overlap)
            common = new_common

        return common

    def _get_overlap(self, slot1, slot2):
        """Get overlapping time between two availability slots"""
        start = max(slot1.start_time, slot2.start_time)
        end = min(slot1.end_time, slot2.end_time)

        if start < end:
            # Create a mock availability object for the overlap
            class OverlapSlot:
                def __init__(self, start_time, end_time):
                    self.start_time = start_time
                    self.end_time = end_time

            return OverlapSlot(start, end)
        return None

    def _is_slot_available(self, slot, trainers, date):
        """Check if a time slot is available for all trainers"""
        slot_start = datetime.combine(date, slot.start_time)
        slot_end = datetime.combine(date, slot.end_time)

        if timezone.is_naive(slot_start):
            slot_start = timezone.make_aware(slot_start, timezone.get_current_timezone())
        if timezone.is_naive(slot_end):
            slot_end = timezone.make_aware(slot_end, timezone.get_current_timezone())

        duration = slot_end - slot_start
        if duration.total_seconds() <= 0:
            return False

        trainer_list = list(trainers)

        # Check meeting conflicts for any trainer during this slot.
        if Meeting.find_conflict(
            users=trainer_list,
            start_dt=slot_start,
            duration=duration,
        ):
            return False

        # Check legacy trainer appointments as well.
        if Appointment.find_conflict(
            users=trainer_list,
            start_dt=slot_start,
            duration=duration,
        ):
            return False

        return True


class ScheduleMeetingView(APIView):
    permission_classes = [IsAuthenticated, IsSales]

    def post(self, request):
        """Schedule a new meeting"""
        data = request.data
        required_fields = [
            "title",
            "meeting_type_id",
            "client_id",
            "scheduled_at",
            "duration",
        ]

        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            meeting_type = MeetingType.objects.get(id=data["meeting_type_id"])
            client = User.objects.get(id=data["client_id"], role="client")
            scheduled_at = datetime.fromisoformat(
                data["scheduled_at"].replace("Z", "+00:00")
            )
            duration_minutes = int(data["duration"])
        except (MeetingType.DoesNotExist, User.DoesNotExist, ValueError):
            return Response(
                {"error": "Invalid meeting type, client, date format, or duration"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if duration_minutes <= 0:
            return Response(
                {"error": "Duration must be a positive number of minutes"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.is_naive(scheduled_at):
            scheduled_at = timezone.make_aware(
                scheduled_at, timezone.get_current_timezone()
            )

        if scheduled_at <= timezone.now():
            return Response(
                {"error": "Meeting must be scheduled in the future"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate trainer selection based on meeting type
        trainer_ids = data.get("trainer_ids", [])
        if meeting_type.requires_trainers and not trainer_ids:
            return Response(
                {"error": "Trainers are required for this meeting type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not meeting_type.requires_trainers and trainer_ids:
            return Response(
                {"error": "Trainers should not be selected for this meeting type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate trainers exist and are available
        trainers = []
        if trainer_ids:
            trainer_ids = list(dict.fromkeys(trainer_ids))
            trainers = list(
                User.objects.filter(
                    id__in=trainer_ids,
                    role="trainer",
                    is_approved=True,
                    is_suspended=False,
                    is_active=True,
                )
            )
            if len(trainers) != len(trainer_ids):
                return Response(
                    {"error": "Some trainers were not found or are not available"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        meeting_duration = timedelta(minutes=duration_minutes)
        participants = [request.user, client] + list(trainers)

        with transaction.atomic():
            Meeting.lock_users_for_scheduling(participants)

            conflict = Meeting.find_conflict(
                users=participants,
                start_dt=scheduled_at,
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

            appointment_conflict = Appointment.find_conflict(
                users=participants,
                start_dt=scheduled_at,
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

            meeting = Meeting.objects.create(
                title=data["title"],
                meeting_type=meeting_type,
                scheduled_by=request.user,
                scheduled_at=scheduled_at,
                duration=meeting_duration,
                notes=data.get("notes", ""),
                location=data.get("location", ""),
                status="scheduled",
            )

            attendees = [
                MeetingAttendee(meeting=meeting, user=request.user, role="organizer"),
                MeetingAttendee(meeting=meeting, user=client, role="client"),
            ]
            for trainer in trainers:
                attendees.append(
                    MeetingAttendee(meeting=meeting, user=trainer, role="trainer")
                )
            MeetingAttendee.objects.bulk_create(attendees)

        # Create notifications for all attendees
        meeting_time = meeting.scheduled_at.strftime("%I:%M %p on %B %d, %Y")
        meeting_title = meeting.title
        organizer_name = request.user.get_full_name() or request.user.username

        # Notification for client
        Notification.objects.create(
            user=client,
            title="New Meeting Scheduled",
            message=f"{meeting_title} scheduled with {organizer_name} at {meeting_time}",
            type="meeting",
            related_id=meeting.id,
        )

        # Notification for organizer (sales)
        Notification.objects.create(
            user=request.user,
            title="New Meeting Scheduled",
            message=f"You have scheduled {meeting_title} with {client.get_full_name() or client.username} at {meeting_time}",
            type="meeting",
            related_id=meeting.id,
        )

        # Notifications for trainers if any
        for trainer in trainers:
            Notification.objects.create(
                user=trainer,
                title="New Meeting Assignment",
                message=f"You have been assigned to {meeting_title} at {meeting_time}",
                type="meeting",
                related_id=meeting.id,
            )

        # Send invitation emails
        meeting.send_invitation_emails()

        # Ops notification
        send_ops_email(
            subject="Meeting Scheduled",
            message=(
                f"Title: {meeting_title}\n"
                f"Client: {client.get_full_name()} ({client.email})\n"
                f"Organizer: {organizer_name}\n"
                f"When: {meeting_time}\n"
                f"Meeting ID: {meeting.id}"
            ),
        )

        serializer = MeetingSerializer(meeting)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MeetingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, meeting_id):
        """Get meeting details"""
        meeting = get_object_or_404(Meeting, id=meeting_id)

        # Check if user is an attendee
        is_attendee = MeetingAttendee.objects.filter(
            meeting=meeting, user=request.user
        ).exists()

        if not is_attendee and request.user.role != "admin":
            return Response(
                {"error": "You are not authorized to view this meeting"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MeetingDetailSerializer(meeting)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConfirmMeetingAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, meeting_id):
        """Confirm attendance for a meeting"""
        meeting = get_object_or_404(Meeting, id=meeting_id)

        attendee = get_object_or_404(
            MeetingAttendee, meeting=meeting, user=request.user
        )

        attendee.is_confirmed = True
        attendee.joined_at = timezone.now()
        attendee.save()

        return Response(
            {"message": "Attendance confirmed successfully"}, status=status.HTTP_200_OK
        )


class MyMeetingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get meetings for the current user"""
        user_meetings = MeetingAttendee.objects.filter(
            user=request.user
        ).select_related("meeting", "meeting__meeting_type")

        meetings_data = []
        for attendee in user_meetings:
            meeting = attendee.meeting
            meetings_data.append(
                {
                    "id": meeting.id,
                    "title": meeting.title,
                    "meeting_type": meeting.meeting_type.name,
                    "scheduled_at": meeting.scheduled_at,
                    "duration": meeting.duration,
                    "status": meeting.status,
                    "location": meeting.location,
                    "my_role": attendee.role,
                    "is_confirmed": attendee.is_confirmed,
                }
            )

        return Response(meetings_data, status=status.HTTP_200_OK)


class CalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get meetings for calendar view"""
        # Get date range from query parameters
        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if not year or not month:
            # Default to current month
            now = timezone.now()
            year = now.year
            month = now.month
        else:
            year = int(year)
            month = int(month)

        # Calculate start and end dates for the month
        from calendar import monthrange

        start_date = timezone.datetime(year, month, 1).date()
        _, last_day = monthrange(year, month)
        end_date = timezone.datetime(year, month, last_day).date()

        # Get user's meetings for this month
        user_meetings = MeetingAttendee.objects.filter(
            user=request.user,
            meeting__scheduled_at__date__gte=start_date,
            meeting__scheduled_at__date__lte=end_date,
            meeting__status__in=["scheduled", "confirmed", "active"],
        ).select_related("meeting", "meeting__meeting_type")

        # Group meetings by date
        meetings_by_date = {}
        meeting_colors = self._get_meeting_type_colors()

        for attendee in user_meetings:
            meeting = attendee.meeting
            meeting_date = meeting.scheduled_at.date()

            if meeting_date not in meetings_by_date:
                meetings_by_date[meeting_date] = []

            # Get attendees for this meeting
            attendees = (
                MeetingAttendee.objects.filter(meeting=meeting)
                .select_related("user")
                .values_list("user__first_name", "user__last_name", "role")
            )

            attendee_names = []
            for first_name, last_name, role in attendees:
                name = f"{first_name} {last_name}".strip()
                if role == "organizer":
                    attendee_names.insert(0, f"{name} (Organizer)")
                else:
                    attendee_names.append(f"{name} ({role.title()})")

            meeting_data = {
                "id": meeting.id,
                "title": meeting.title,
                "meeting_type": meeting.meeting_type.name,
                "scheduled_at": meeting.scheduled_at,
                "duration_minutes": int(meeting.duration.total_seconds() / 60),
                "status": meeting.status,
                "location": meeting.location,
                "notes": meeting.notes,
                "attendees": attendee_names,
                "my_role": attendee.role,
                "is_confirmed": attendee.is_confirmed,
                "color": meeting_colors.get(
                    meeting.meeting_type.name, "#3174ad"
                ),  # Default blue
                "time_display": meeting.scheduled_at.strftime("%I:%M %p"),
                "end_time_display": (meeting.scheduled_at + meeting.duration).strftime(
                    "%I:%M %p"
                ),
            }

            meetings_by_date[meeting_date].append(meeting_data)

        # Convert to list format for frontend
        calendar_data = []
        for date, meetings in meetings_by_date.items():
            calendar_data.append({"date": date.isoformat(), "meetings": meetings})

        return Response(
            {
                "year": year,
                "month": month,
                "meetings": calendar_data,
                "meeting_types": list(meeting_colors.keys()),
            },
            status=status.HTTP_200_OK,
        )

    def _get_meeting_type_colors(self):
        """Get color scheme for different meeting types"""
        return {
            "Initial Sales Meeting": "#e74c3c",  # Red
            "Program Review Meeting": "#27ae60",  # Green
            "Follow-up Meeting": "#f39c12",  # Orange
            "Consultation": "#9b59b6",  # Purple
            "Assessment": "#1abc9c",  # Teal
            "Training Session": "#34495e",  # Dark Blue
            "Group Meeting": "#e67e22",  # Carrot
            "One-on-One": "#16a085",  # Dark Teal
        }


class TrainerCalendarView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        """Get calendar data for the logged-in trainer"""
        # Get date range from query parameters
        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if not year or not month:
            # Default to current month
            now = timezone.now()
            year = now.year
            month = now.month
        else:
            year = int(year)
            month = int(month)

        # Calculate start and end dates for the month
        from calendar import monthrange

        start_date = timezone.datetime(year, month, 1).date()
        _, last_day = monthrange(year, month)
        end_date = timezone.datetime(year, month, last_day).date()

        trainer = request.user

        # Get trainer's appointments for this month
        appointments = Appointment.objects.filter(
            trainer=trainer,
            scheduled_at__date__gte=start_date,
            scheduled_at__date__lte=end_date,
            status__in=["scheduled"],
        ).select_related("client")

        # Get trainer's meeting attendances for this month
        meeting_attendances = MeetingAttendee.objects.filter(
            user=trainer,
            meeting__scheduled_at__date__gte=start_date,
            meeting__scheduled_at__date__lte=end_date,
            meeting__status__in=["scheduled", "confirmed", "active"],
        ).select_related("meeting", "meeting__meeting_type")

        # Group events by date
        events_by_date = {}
        meeting_colors = self._get_meeting_type_colors()

        # Process appointments
        for appointment in appointments:
            event_date = appointment.scheduled_at.date()

            if event_date not in events_by_date:
                events_by_date[event_date] = []

            event_data = {
                "id": f"appointment_{appointment.id}",
                "type": "appointment",
                "title": f"Appointment with {appointment.client.first_name} {appointment.client.last_name}",
                "client_name": f"{appointment.client.first_name} {appointment.client.last_name}",
                "scheduled_at": appointment.scheduled_at,
                "duration_minutes": int(appointment.duration.total_seconds() / 60),
                "status": appointment.status,
                "notes": appointment.notes,
                "color": "#27ae60",  # Green for appointments
                "time_display": appointment.scheduled_at.strftime("%I:%M %p"),
                "end_time_display": (
                    appointment.scheduled_at + appointment.duration
                ).strftime("%I:%M %p"),
            }

            events_by_date[event_date].append(event_data)

        # Process meetings
        for attendee in meeting_attendances:
            meeting = attendee.meeting
            event_date = meeting.scheduled_at.date()

            if event_date not in events_by_date:
                events_by_date[event_date] = []

            # Get other attendees for this meeting
            other_attendees = (
                MeetingAttendee.objects.filter(meeting=meeting)
                .exclude(user=trainer)
                .select_related("user")
                .values_list("user__first_name", "user__last_name", "role")
            )

            attendee_names = []
            for first_name, last_name, role in other_attendees:
                name = f"{first_name} {last_name}".strip()
                attendee_names.append(f"{name} ({role.title()})")

            event_data = {
                "id": f"meeting_{meeting.id}",
                "type": "meeting",
                "title": meeting.title,
                "meeting_type": meeting.meeting_type.name,
                "scheduled_at": meeting.scheduled_at,
                "duration_minutes": int(meeting.duration.total_seconds() / 60),
                "status": meeting.status,
                "location": meeting.location,
                "notes": meeting.notes,
                "attendees": attendee_names,
                "my_role": attendee.role,
                "is_confirmed": attendee.is_confirmed,
                "color": meeting_colors.get(meeting.meeting_type.name, "#3174ad"),
                "time_display": meeting.scheduled_at.strftime("%I:%M %p"),
                "end_time_display": (meeting.scheduled_at + meeting.duration).strftime(
                    "%I:%M %p"
                ),
            }

            events_by_date[event_date].append(event_data)

        # Convert to list format for frontend
        calendar_data = []
        for date, events in events_by_date.items():
            # Sort events by time
            events.sort(key=lambda x: x["scheduled_at"])
            calendar_data.append({"date": date.isoformat(), "events": events})

        return Response(
            {
                "year": year,
                "month": month,
                "events": calendar_data,
                "total_appointments": len(appointments),
                "total_meetings": len(meeting_attendances),
            },
            status=status.HTTP_200_OK,
        )

    def _get_meeting_type_colors(self):
        """Get color scheme for different meeting types"""
        return {
            "Initial Sales Meeting": "#e74c3c",  # Red
            "Program Review Meeting": "#27ae60",  # Green
            "Follow-up Meeting": "#f39c12",  # Orange
            "Consultation": "#9b59b6",  # Purple
            "Assessment": "#1abc9c",  # Teal
            "Training Session": "#34495e",  # Dark Blue
            "Group Meeting": "#e67e22",  # Carrot
            "One-on-One": "#16a085",  # Dark Teal
        }


class TrainerScheduleMeetingView(APIView):
    permission_classes = [IsAuthenticated, IsTrainer]

    def post(self, request):
        """Schedule a meeting as a trainer"""
        data = request.data

        # Required fields
        required_fields = [
            "client_uuid",
            "meeting_date",  # Format: YYYY-MM-DD
            "meeting_time",  # Format: HH:MM
            "meeting_title",
        ]

        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            # Parse date and time
            meeting_date = datetime.strptime(data["meeting_date"], "%Y-%m-%d").date()
            meeting_time = datetime.strptime(data["meeting_time"], "%H:%M").time()
            scheduled_at = timezone.datetime.combine(meeting_date, meeting_time)
            if timezone.is_naive(scheduled_at):
                scheduled_at = timezone.make_aware(
                    scheduled_at, timezone.get_current_timezone()
                )

            if scheduled_at <= timezone.now():
                return Response(
                    {"error": "Meeting must be scheduled in the future"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get client
            client = User.objects.get(id=data["client_uuid"], role="client")

            # Get other trainers (optional)
            other_trainer_uuids = data.get("other_trainer_uuids", [])
            other_trainers = []

            if other_trainer_uuids:
                other_trainers = User.objects.filter(
                    id__in=other_trainer_uuids,
                    role="trainer",
                    is_approved=True,
                    is_suspended=False,
                )

                if len(other_trainers) != len(other_trainer_uuids):
                    return Response(
                        {"error": "Some specified trainers not found or not available"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # All trainers for this meeting (logged-in trainer + other trainers)
            trainer_map = {str(request.user.id): request.user}
            for trainer in other_trainers:
                trainer_map[str(trainer.id)] = trainer
            all_trainers = list(trainer_map.values())
            participants = [client] + all_trainers
            meeting_duration = timedelta(hours=1)

            # Create meeting type (use default or create one)
            meeting_type, created = MeetingType.objects.get_or_create(
                name="Trainer Scheduled Meeting",
                defaults={
                    "description": "Meeting scheduled by trainer",
                    "requires_trainers": True,
                    "allows_multiple_trainers": True,
                },
            )

            with transaction.atomic():
                Meeting.lock_users_for_scheduling(participants)

                conflict = Meeting.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
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

                appointment_conflict = Appointment.find_conflict(
                    users=participants,
                    start_dt=scheduled_at,
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

                meeting = Meeting.objects.create(
                    title=data["meeting_title"],
                    meeting_type=meeting_type,
                    scheduled_by=request.user,
                    scheduled_at=scheduled_at,
                    duration=meeting_duration,  # Default duration
                    notes=data.get("notes", ""),
                    location=data.get("location", ""),
                    status="scheduled",
                )

                attendees = [MeetingAttendee(meeting=meeting, user=client, role="client")]
                for trainer in all_trainers:
                    role = "organizer" if trainer == request.user else "trainer"
                    attendees.append(
                        MeetingAttendee(meeting=meeting, user=trainer, role=role)
                    )

                MeetingAttendee.objects.bulk_create(attendees)

            # Create notifications for all attendees
            meeting_time = scheduled_at.strftime("%I:%M %p on %B %d, %Y")
            meeting_title = data["meeting_title"]
            trainer_name = request.user.get_full_name() or request.user.username
            client_name = client.get_full_name() or client.username

            # Notification for client
            Notification.objects.create(
                user=client,
                title="New Training Session Scheduled",
                message=f"{meeting_title} scheduled with {trainer_name} at {meeting_time}",
                type="meeting",
                related_id=meeting.id,
            )

            # Notification for organizer (primary trainer)
            Notification.objects.create(
                user=request.user,
                title="New Training Session Scheduled",
                message=f"You have scheduled {meeting_title} with {client_name} at {meeting_time}",
                type="meeting",
                related_id=meeting.id,
            )

            # Notifications for additional trainers
            for trainer in other_trainers:
                Notification.objects.create(
                    user=trainer,
                    title="Training Session Assignment",
                    message=f"You have been assigned to {meeting_title} with {client_name} at {meeting_time}",
                    type="meeting",
                    related_id=meeting.id,
                )

            # Send invitation emails
            meeting.send_invitation_emails()

            # Ops notification
            send_ops_email(
                subject="Trainer Meeting Scheduled",
                message=(
                    f"Primary trainer: {request.user.email}\n"
                    f"Client: {client.email}\n"
                    f"When: {meeting_time}\n"
                    f"Meeting ID: {meeting.id}"
                ),
            )

            return Response(
                {
                    "message": "Meeting scheduled successfully",
                    "meeting_id": meeting.id,
                    "scheduled_at": meeting.scheduled_at,
                    "attendees_count": len(attendees),
                    "trainers_count": len(all_trainers),
                },
                status=status.HTTP_201_CREATED,
            )

        except User.DoesNotExist:
            return Response(
                {"error": "Client not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as e:
            return Response(
                {"error": f"Invalid date/time format: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
