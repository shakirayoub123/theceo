from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import User
from scheduling.models import Appointment, Meeting, MeetingAttendee, MeetingType
from scheduling.views import ScheduleMeetingView


class ScheduleMeetingViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self._original_throttle_classes = ScheduleMeetingView.throttle_classes
        ScheduleMeetingView.throttle_classes = []
        self.addCleanup(
            setattr,
            ScheduleMeetingView,
            "throttle_classes",
            self._original_throttle_classes,
        )
        self.view = ScheduleMeetingView.as_view()

        self.sales = User.objects.create_user(
            username="sales-user",
            email="sales@example.com",
            password="StrongPass123!",
            role="sales",
            is_active=True,
        )
        self.client_a = User.objects.create_user(
            username="client-a",
            email="client-a@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        self.client_b = User.objects.create_user(
            username="client-b",
            email="client-b@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        self.trainer = User.objects.create_user(
            username="trainer-user",
            email="trainer@example.com",
            password="StrongPass123!",
            role="trainer",
            is_active=True,
            is_approved=True,
            is_suspended=False,
        )

    def _schedule(self, payload):
        request = self.factory.post("/api/scheduling/schedule/", payload, format="json")
        force_authenticate(request, user=self.sales)
        return self.view(request)

    def test_overlap_with_existing_client_meeting_is_rejected_without_creating_row(self):
        meeting_type = MeetingType.objects.create(
            name="Sales Intro",
            requires_trainers=False,
        )
        start = timezone.now() + timedelta(days=1)

        existing = Meeting.objects.create(
            title="Existing",
            meeting_type=meeting_type,
            scheduled_by=self.sales,
            scheduled_at=start,
            duration=timedelta(hours=1),
            status="scheduled",
        )
        MeetingAttendee.objects.bulk_create(
            [
                MeetingAttendee(meeting=existing, user=self.sales, role="organizer"),
                MeetingAttendee(meeting=existing, user=self.client_a, role="client"),
            ]
        )

        response = self._schedule(
            {
                "title": "Conflict Meeting",
                "meeting_type_id": meeting_type.id,
                "client_id": self.client_a.id,
                "scheduled_at": (start + timedelta(minutes=30)).isoformat(),
                "duration": 60,
            }
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Meeting.objects.count(), 1)
        self.assertEqual(response.data["error"], "Selected time conflicts with an existing meeting")

    def test_overlap_with_sales_organizer_time_is_rejected(self):
        meeting_type = MeetingType.objects.create(
            name="Sales Follow-up",
            requires_trainers=False,
        )
        start = timezone.now() + timedelta(days=2)

        existing = Meeting.objects.create(
            title="Existing Sales Meeting",
            meeting_type=meeting_type,
            scheduled_by=self.sales,
            scheduled_at=start,
            duration=timedelta(hours=1),
            status="scheduled",
        )
        MeetingAttendee.objects.bulk_create(
            [
                MeetingAttendee(meeting=existing, user=self.sales, role="organizer"),
                MeetingAttendee(meeting=existing, user=self.client_a, role="client"),
            ]
        )

        response = self._schedule(
            {
                "title": "Organizer Conflict",
                "meeting_type_id": meeting_type.id,
                "client_id": self.client_b.id,
                "scheduled_at": start.isoformat(),
                "duration": 45,
            }
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Selected time conflicts with an existing meeting")

    def test_overlap_with_existing_trainer_appointment_is_rejected(self):
        meeting_type = MeetingType.objects.create(
            name="Training Session",
            requires_trainers=True,
            allows_multiple_trainers=False,
        )
        start = timezone.now() + timedelta(days=3)

        Appointment.objects.create(
            trainer=self.trainer,
            client=self.client_a,
            scheduled_at=start,
            duration=timedelta(hours=1),
            status="scheduled",
        )

        response = self._schedule(
            {
                "title": "Appointment Conflict",
                "meeting_type_id": meeting_type.id,
                "client_id": self.client_b.id,
                "trainer_ids": [self.trainer.id],
                "scheduled_at": (start + timedelta(minutes=15)).isoformat(),
                "duration": 30,
            }
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["error"],
            "Selected time conflicts with an existing appointment",
        )
