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


from unittest.mock import patch

from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from people.models import Client


@override_settings(
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
@patch(
    "scheduling.models.Meeting.get_room_join_url",
    return_value="https://video.example.com/room?t=token",
)
class SalesMeetingClientConfirmationTests(TestCase):
    """The client must get a Discovery Call confirmation for the initial sales appointment."""

    def setUp(self):
        self.api = APIClient()
        self.sales_user = User.objects.create_user(
            username="confirm-sales",
            email="pete@example.com",
            password="StrongPass123!",
            first_name="Pete",
            last_name="Gates",
            role="sales",
            is_active=True,
        )
        self.client_user = User.objects.create_user(
            username="confirm-client",
            email="peter@example.com",
            password="StrongPass123!",
            first_name="Peter",
            last_name="Client",
            role="client",
            is_active=True,
        )
        profile = Client.objects.get(user=self.client_user)
        profile.assigned_sales = self.sales_user
        profile.save(update_fields=["assigned_sales", "updated_at"])
        self.api.force_authenticate(user=self.sales_user)
        self.meeting_type = MeetingType.objects.create(
            name="Discovery", requires_trainers=False
        )

    def _schedule_via_lms(self, days_ahead):
        when = timezone.now() + timedelta(days=days_ahead)
        return self.api.post(
            "/api/lms/sales/schedule-meeting/",
            {
                "date": when.strftime("%Y-%m-%d"),
                "time": "15:00",
                "client_id": str(self.client_user.id),
                "meeting_type": "Discovery",
                "notes": "Intro call",
            },
            format="json",
        )

    def _client_emails(self):
        return [m for m in mail.outbox if m.to == [self.client_user.email]]

    @patch("lms.views.send_ops_email", return_value=True)
    def test_initial_sales_meeting_sends_discovery_call_confirmation(self, _ops, _join):
        response = self._schedule_via_lms(days_ahead=3)
        self.assertEqual(response.status_code, 201, response.content)

        client_emails = self._client_emails()
        self.assertEqual(len(client_emails), 1)
        email = client_emails[0]
        self.assertEqual(
            email.subject, "Your Discovery Call Has Been Scheduled - The CEO Influencers"
        )
        self.assertIn("Hi Peter,", email.body)
        self.assertIn("Your discovery call with The CEO Influencers has been scheduled.", email.body)
        self.assertIn(
            "You have been assigned to Pete Gates who will be your point of contact. "
            "You can reach them at pete@example.com.",
            email.body,
        )
        self.assertIn("Direct video call link: https://video.example.com/room?t=token", email.body)
        self.assertIn("Login page: https://theceoinfluencers.com/login", email.body)

        # Sales still gets the standard invitation; client does not get a duplicate.
        sales_emails = [m for m in mail.outbox if m.to == [self.sales_user.email]]
        self.assertEqual(len(sales_emails), 1)
        self.assertTrue(sales_emails[0].subject.startswith("Meeting Invitation:"))

    @patch("lms.views.send_ops_email", return_value=True)
    def test_follow_up_sales_meeting_is_not_labelled_discovery(self, _ops, _join):
        self.assertEqual(self._schedule_via_lms(days_ahead=3).status_code, 201)
        mail.outbox.clear()

        self.assertEqual(self._schedule_via_lms(days_ahead=5).status_code, 201)
        client_emails = self._client_emails()
        self.assertEqual(len(client_emails), 1)
        self.assertEqual(
            client_emails[0].subject, "Your Meeting Has Been Scheduled - The CEO Influencers"
        )

    @patch("scheduling.views.send_ops_email", return_value=True)
    def test_scheduling_app_route_sends_discovery_call_confirmation(self, _ops, _join):
        original_throttles = ScheduleMeetingView.throttle_classes
        ScheduleMeetingView.throttle_classes = []
        self.addCleanup(setattr, ScheduleMeetingView, "throttle_classes", original_throttles)
        response = self.api.post(
            "/api/scheduling/schedule/",
            {
                "title": "Discovery Call",
                "meeting_type_id": self.meeting_type.id,
                "client_id": str(self.client_user.id),
                "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
                "duration": 60,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)

        client_emails = self._client_emails()
        self.assertEqual(len(client_emails), 1)
        self.assertEqual(
            client_emails[0].subject, "Your Discovery Call Has Been Scheduled - The CEO Influencers"
        )


class MasterCalendarHoverDetailsTests(TestCase):
    """Master calendar hover: client name, program selected, and call type."""

    def setUp(self):
        from decimal import Decimal

        from lms.models import Service

        self.admin = User.objects.create_user(
            username="cal-admin", email="cal-admin@example.com", password="StrongPass123!",
            role="admin", is_active=True,
        )
        self.sales = User.objects.create_user(
            username="cal-sales", email="cal-sales@example.com", password="StrongPass123!",
            first_name="Pete", last_name="Gates", role="sales", is_active=True,
        )
        self.coach = User.objects.create_user(
            username="cal-coach", email="cal-coach@example.com", password="StrongPass123!",
            first_name="Jane", last_name="Doe", role="trainer", is_active=True, is_approved=True,
        )
        self.client_user = User.objects.create_user(
            username="cal-client", email="cal-client@example.com", password="StrongPass123!",
            first_name="Peter", last_name="Client", role="client", is_active=True,
        )
        profile = Client.objects.get(user=self.client_user)
        profile.program_of_interest = "Executive Leadership"
        profile.save()
        self.program = Service.objects.create(
            title="Live 2:1 Coaching", description="x", price=Decimal("1"), trainer=self.coach
        )
        self.sales_type = MeetingType.objects.create(name="Sales Meeting", requires_trainers=False)
        self.coaching_type = MeetingType.objects.create(name="Coaching Session", requires_trainers=True)
        self.base = (timezone.now() + timedelta(days=1)).replace(hour=15, minute=0, second=0, microsecond=0)
        self.api = APIClient()
        self.api.force_authenticate(user=self.admin)

    def _meeting(self, title, mtype, staff, staff_role, days, service=None):
        meeting = Meeting.objects.create(
            title=title, meeting_type=mtype, scheduled_by=staff,
            scheduled_at=self.base + timedelta(days=days), duration=timedelta(hours=1),
            status="scheduled", service=service,
        )
        MeetingAttendee.objects.create(meeting=meeting, user=staff, role=staff_role)
        MeetingAttendee.objects.create(meeting=meeting, user=self.client_user, role="client")
        return meeting

    def _calendar_meetings(self):
        found = {}
        for days in range(0, 4):
            day = self.base + timedelta(days=days)
            resp = self.api.get(f"/api/scheduling/calendar/?year={day.year}&month={day.month}")
            self.assertEqual(resp.status_code, 200, resp.content)
            for entry in resp.json()["meetings"]:
                for m in entry["meetings"]:
                    found[m["id"]] = m
        return found

    def test_hover_details_for_discovery_sales_and_coaching_calls(self):
        first = self._meeting("Sales Meeting with Peter Client", self.sales_type, self.sales, "sales", 0)
        follow_up = self._meeting("Sales Meeting with Peter Client", self.sales_type, self.sales, "sales", 1)
        coaching = self._meeting(
            "Weekly Coaching", self.coaching_type, self.coach, "trainer", 2, service=self.program
        )

        meetings = self._calendar_meetings()

        self.assertEqual(meetings[first.id]["callType"], "Discovery Call")
        self.assertEqual(meetings[first.id]["clientName"], "Peter Client")
        self.assertEqual(meetings[first.id]["program"], "Executive Leadership (interest)")

        self.assertEqual(meetings[follow_up.id]["callType"], "Sales Call")

        self.assertEqual(meetings[coaching.id]["callType"], "Coaching Call")
        self.assertEqual(meetings[coaching.id]["program"], "Live 2:1 Coaching")

    def test_program_falls_back_to_not_selected(self):
        profile = Client.objects.get(user=self.client_user)
        profile.program_of_interest = ""
        profile.save()
        meeting = self._meeting("Discovery Call", self.sales_type, self.sales, "sales", 0)

        details = self._calendar_meetings()[meeting.id]
        self.assertEqual(details["callType"], "Discovery Call")
        self.assertEqual(details["program"], "Not selected yet")


class MeetingClientInfoTests(TestCase):
    """Client details shown in the video call window for staff."""

    def setUp(self):
        self.sales = User.objects.create_user(
            username="ci-sales", email="ci-sales@example.com", password="StrongPass123!",
            first_name="Pete", last_name="Gates", role="sales", is_active=True,
        )
        self.other_sales = User.objects.create_user(
            username="ci-other", email="ci-other@example.com", password="StrongPass123!",
            role="sales", is_active=True,
        )
        self.client_user = User.objects.create_user(
            username="ci-client", email="ci-client@example.com", password="StrongPass123!",
            first_name="Peter", last_name="Prospect", role="client", is_active=True,
        )
        profile = Client.objects.get(user=self.client_user)
        profile.position = "Acme Corp"
        profile.industry = "Manufacturing"
        profile.job_title = "COO"
        profile.program_of_interest = "Executive Leadership"
        profile.assigned_sales = self.sales
        profile.save()
        mtype = MeetingType.objects.create(name="Discovery", requires_trainers=False)
        self.meeting = Meeting.objects.create(
            title="Discovery Call with Peter Prospect", meeting_type=mtype, scheduled_by=self.sales,
            scheduled_at=timezone.now() + timedelta(days=1), duration=timedelta(hours=1), status="scheduled",
        )
        MeetingAttendee.objects.create(meeting=self.meeting, user=self.sales, role="sales")
        MeetingAttendee.objects.create(meeting=self.meeting, user=self.client_user, role="client")
        self.url = f"/api/scheduling/meetings/{self.meeting.id}/client-info/"

    def _get(self, user):
        api = APIClient()
        api.force_authenticate(user=user)
        return api.get(self.url)

    def test_salesperson_on_call_sees_client_details(self):
        response = self._get(self.sales)
        self.assertEqual(response.status_code, 200, response.content)
        client = response.json()["client"]
        self.assertEqual(client["name"], "Peter Prospect")
        self.assertEqual(client["company"], "Acme Corp")
        self.assertEqual(client["industry"], "Manufacturing")
        self.assertEqual(client["jobTitle"], "COO")
        self.assertEqual(client["programOfInterest"], "Executive Leadership")
        self.assertEqual(response.json()["meeting"]["callType"], "Discovery Call")

    def test_client_and_unrelated_staff_are_denied(self):
        self.assertEqual(self._get(self.client_user).status_code, 403)
        self.assertEqual(self._get(self.other_sales).status_code, 403)


class CalendarDrillDownTests(MasterCalendarHoverDetailsTests):
    """Calendar items carry Program #, coaches, salesperson and meeting topic."""

    def test_drill_down_fields(self):
        first = self._meeting("Sales Meeting with Peter Client", self.sales_type, self.sales, "sales", 0)
        coaching = self._meeting(
            "Weekly Coaching", self.coaching_type, self.coach, "trainer", 2, service=self.program
        )
        meetings = self._calendar_meetings()

        self.assertEqual(meetings[first.id]["meetingTopic"], "New Client Sales Discovery Meeting")
        self.assertEqual(meetings[first.id]["salesperson"], "Pete Gates")

        details = meetings[coaching.id]
        self.assertEqual(details["meetingTopic"], "Initial 2-Hour Coaching Discovery Meeting")
        self.assertEqual(details["coaches"], "Jane Doe")
        self.assertEqual(details["programNumber"], 1)
