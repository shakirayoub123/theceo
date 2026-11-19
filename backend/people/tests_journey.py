from datetime import timedelta
from decimal import Decimal
from io import StringIO

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from accounts.models import User
from comms.models import Notification
from lms.models import ClientFormAnswers, Enrollment, Service
from people.journey import get_journey_state, send_journey_reminders_for_client
from people.models import Client


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
class ClientJourneyReminderTests(TestCase):
    def setUp(self):
        self.sales = User.objects.create_user(
            username="j-sales", email="pete@example.com", password="StrongPass123!",
            first_name="Pete", last_name="Gates", role="sales", is_active=True,
        )
        self.trainer = User.objects.create_user(
            username="j-coach", email="jane@example.com", password="StrongPass123!",
            first_name="Jane", last_name="Doe", role="trainer", is_active=True, is_approved=True,
        )
        self.advisor = User.objects.create_user(
            username="j-advisor", email="john@example.com", password="StrongPass123!",
            first_name="John", last_name="Smith", role="trainer", is_active=True, is_approved=True,
        )
        self.program = Service.objects.create(
            title="Executive Program", description="x", price=Decimal("100"), trainer=self.trainer
        )
        self.program.advisors.add(self.advisor)
        self.user = User.objects.create_user(
            username="j-client", email="peter@example.com", password="StrongPass123!",
            first_name="Peter", last_name="Client", role="client", is_active=True,
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.assigned_sales = self.sales
        self.client_profile.save()

    def _emails_to(self, user):
        return [m for m in mail.outbox if m.to == [user.email]]

    def test_new_client_and_sales_get_email_and_dashboard_notification(self):
        sent = send_journey_reminders_for_client(self.client_profile)

        self.assertEqual({m.role for m in sent}, {"client", "sales"})
        client_email = self._emails_to(self.user)[0]
        self.assertIn("Current step: Account created - discovery call to be scheduled", client_email.body)
        self.assertIn("Assessments: 0 of 6 completed (6 remaining).", client_email.body)
        self.assertIn("Pete Gates: pete@example.com", client_email.body)
        sales_email = self._emails_to(self.sales)[0]
        self.assertIn("Schedule the client's discovery call", sales_email.body)

        for user in (self.user, self.sales):
            self.assertTrue(
                Notification.objects.filter(user=user, related_id=self.client_profile.id).exists()
            )
        # Coaches are not involved before payment.
        self.assertEqual(self._emails_to(self.trainer), [])

    def test_same_stage_is_not_resent_until_interval_passes(self):
        send_journey_reminders_for_client(self.client_profile)
        self.assertEqual(send_journey_reminders_for_client(self.client_profile), [])

        later = timezone.now() + timedelta(days=4)
        resent = send_journey_reminders_for_client(self.client_profile, now=later)
        self.assertEqual({m.role for m in resent}, {"client", "sales"})

    def test_stage_change_sends_new_reminder_immediately(self):
        send_journey_reminders_for_client(self.client_profile)
        self.client_profile.meeting_status = "scheduled"
        self.client_profile.meeting_scheduled_at = timezone.now() + timedelta(days=2)
        self.client_profile.save()

        sent = send_journey_reminders_for_client(self.client_profile)
        self.assertEqual({m.role for m in sent}, {"client", "sales"})
        self.assertIn("Attend your discovery call", sent[0].body)

    def test_past_discovery_call_moves_to_awaiting_payment(self):
        self.client_profile.meeting_status = "scheduled"
        self.client_profile.meeting_scheduled_at = timezone.now() - timedelta(days=1)
        self.client_profile.save()
        self.assertEqual(get_journey_state(self.client_profile).stage, "awaiting_payment")

    def test_paid_client_onboarding_includes_coaches_with_contacts(self):
        self.client_profile.program_status = "paid"
        self.client_profile.save()
        Enrollment.objects.create(user=self.user, service=self.program)
        for title in ("Assessment 1", "Assessment 2"):
            ClientFormAnswers.objects.create(user_email=self.user.email, questionnaire_title=title, data=[])

        sent = send_journey_reminders_for_client(self.client_profile)

        self.assertEqual(
            sorted(m.role for m in sent), ["client", "coach", "coach", "sales"]
        )
        client_email = self._emails_to(self.user)[0]
        self.assertIn("Program paid - onboarding assessments", client_email.body)
        self.assertIn("Assessments: 2 of 6 completed (4 remaining).", client_email.body)
        self.assertIn("- Jane Doe: jane@example.com", client_email.body)
        self.assertIn("- John Smith: john@example.com", client_email.body)
        coach_body = self._emails_to(self.trainer)[0].body
        self.assertIn("Review the client's assessment results in your coaching dashboard", coach_body)
        self.assertIn(
            "Review the client's 6 TCI assessment results with them in the initial 2-hour "
            "new Client Discovery meeting",
            coach_body,
        )
        self.assertIn("before your initial 2-hour new Client Discovery meeting", client_email.body)

    def test_discovery_review_step_stops_after_first_coaching_meeting(self):
        from datetime import timedelta as td

        from scheduling.models import Meeting, MeetingAttendee, MeetingType

        self.client_profile.program_status = "paid"
        self.client_profile.save()
        Enrollment.objects.create(user=self.user, service=self.program)
        for i in range(6):
            ClientFormAnswers.objects.create(user_email=self.user.email, questionnaire_title=f"A{i}", data=[])

        state = get_journey_state(self.client_profile)
        from people.journey import build_messages

        coach_msg = next(m for m in build_messages(state) if m.user == self.trainer)
        self.assertIn("All 6 assessments are complete", coach_msg.body)
        self.assertIn("initial 2-hour new Client Discovery meeting", coach_msg.body)

        past = Meeting.objects.create(
            title="First Coaching Advisor Meeting",
            meeting_type=MeetingType.objects.create(name="Coaching", requires_trainers=True),
            scheduled_by=self.trainer,
            scheduled_at=timezone.now() - td(days=1),
            duration=td(hours=2),
            status="completed",
            service=self.program,
        )
        MeetingAttendee.objects.create(meeting=past, user=self.user, role="client")

        state = get_journey_state(self.client_profile)
        coach_msg = next(m for m in build_messages(state) if m.user == self.trainer)
        self.assertNotIn("2-hour new Client Discovery meeting", coach_msg.body)


    def test_all_assessments_done_is_active_coaching_without_sales(self):
        self.client_profile.program_status = "paid"
        self.client_profile.save()
        Enrollment.objects.create(user=self.user, service=self.program)
        for i in range(6):
            ClientFormAnswers.objects.create(user_email=self.user.email, questionnaire_title=f"A{i}", data=[])

        sent = send_journey_reminders_for_client(self.client_profile)
        self.assertEqual(sorted(m.role for m in sent), ["client", "coach", "coach"])

    def test_dry_run_command_sends_and_stores_nothing(self):
        out = StringIO()
        call_command("send_journey_reminders", "--dry-run", stdout=out)
        self.assertIn("Would send 2 journey reminder(s).", out.getvalue())
        self.assertEqual(mail.outbox, [])
        self.assertFalse(Notification.objects.exists())

    def test_command_sends(self):
        out = StringIO()
        call_command("send_journey_reminders", stdout=out)
        self.assertIn("Sent 2 journey reminder(s).", out.getvalue())
        self.assertEqual(len(mail.outbox), 2)


class SalesCannotSeeAssessmentResultsTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient

        self.sales = User.objects.create_user(
            username="r-sales", email="r-sales@example.com", password="StrongPass123!",
            role="sales", is_active=True,
        )
        self.admin = User.objects.create_user(
            username="r-admin", email="r-admin@example.com", password="StrongPass123!",
            role="admin", is_active=True,
        )
        self.user = User.objects.create_user(
            username="r-client", email="r-client@example.com", password="StrongPass123!",
            role="client", is_active=True,
        )
        ClientFormAnswers.objects.create(
            user_email=self.user.email,
            questionnaire_title="MBTI Assessment",
            data=[
                {"question": "Q1", "answer": "SECRET-ANSWER"},
                {"question": "Q2", "answer": ""},
            ],
        )
        self.api = APIClient()

    def _form_answers(self, viewer):
        self.api.force_authenticate(user=viewer)
        response = self.api.get(f"/api/accounts/client/{self.user.id}/")
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["formAnswers"]

    def test_sales_gets_progress_counts_only(self):
        forms = self._form_answers(self.sales)
        self.assertEqual(
            {k: forms[0][k] for k in ("questionnaireTitle", "totalQuestions", "answeredQuestions")},
            {"questionnaireTitle": "MBTI Assessment", "totalQuestions": 2, "answeredQuestions": 1},
        )
        self.assertNotIn("data", forms[0])
        self.assertNotIn("SECRET-ANSWER", str(forms))

    def test_admin_still_sees_full_results(self):
        forms = self._form_answers(self.admin)
        self.assertIn("SECRET-ANSWER", str(forms[0]["data"]))
