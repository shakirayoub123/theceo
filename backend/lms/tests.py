from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlparse
from datetime import timedelta

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from accounts.models import User
from people.models import Client
from scheduling.models import Meeting, MeetingAttendee, MeetingType
from .models import (
    Ebook,
    EbookEmailDownloadLink,
    EbookPurchase,
    Newsletter,
    Service,
    StripePayment,
)

TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-lms-cache",
    }
}


@override_settings(CACHES=TEST_CACHES)
class ClientDashboardOverviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client_user = User.objects.create_user(
            username="dashboard-client",
            email="dashboard-client@example.com",
            password="StrongPass123!",
            first_name="Dashboard",
            last_name="Client",
            role="client",
            is_active=True,
        )
        self.sales_user = User.objects.create_user(
            username="dashboard-sales",
            email="dashboard-sales@example.com",
            password="StrongPass123!",
            first_name="Dashboard",
            last_name="Sales",
            role="sales",
            is_active=True,
        )
        self.trainer = User.objects.create_user(
            username="dashboard-trainer",
            email="dashboard-trainer@example.com",
            password="StrongPass123!",
            first_name="Dashboard",
            last_name="Trainer",
            role="trainer",
            is_active=True,
        )
        self.program = Service.objects.create(
            title="Latest Booked Program",
            description="Leadership coaching",
            price="100.00",
            trainer=self.trainer,
        )
        client_profile = Client.objects.get(user=self.client_user)
        client_profile.assigned_sales = self.sales_user
        client_profile.program_status = "paid"
        client_profile.save(
            update_fields=["assigned_sales", "program_status", "updated_at"]
        )
        self.client.force_authenticate(user=self.client_user)

    def _create_meeting(self, title, scheduled_at, created_at):
        meeting_type, _ = MeetingType.objects.get_or_create(name="Program Session")
        meeting = Meeting.objects.create(
            title=title,
            meeting_type=meeting_type,
            scheduled_by=self.client_user,
            scheduled_at=scheduled_at,
            duration=timedelta(hours=1),
            status="scheduled",
            service=self.program,
        )
        MeetingAttendee.objects.create(
            meeting=meeting, user=self.client_user, role="client"
        )
        MeetingAttendee.objects.create(
            meeting=meeting, user=self.sales_user, role="sales"
        )
        MeetingAttendee.objects.create(
            meeting=meeting, user=self.trainer, role="trainer"
        )
        Meeting.objects.filter(pk=meeting.pk).update(created_at=created_at)
        meeting.refresh_from_db()
        return meeting

    def test_overview_returns_most_recently_booked_meeting_details(self):
        now = timezone.now()
        self._create_meeting(
            "Earlier Booking",
            scheduled_at=now + timedelta(days=2),
            created_at=now - timedelta(hours=2),
        )
        latest = self._create_meeting(
            "Latest Booking",
            scheduled_at=now + timedelta(days=7),
            created_at=now - timedelta(minutes=5),
        )

        response = self.client.get("/api/lms/client/overview/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["latestBookedMeeting"]["id"], latest.id)
        self.assertEqual(
            response.data["latestBookedMeeting"]["title"], "Latest Booking"
        )
        self.assertEqual(
            response.data["latestBookedMeeting"]["serviceId"], str(self.program.id)
        )
        self.assertEqual(
            response.data["latestBookedMeeting"]["salesAdvisor"], "Dashboard Sales"
        )
        self.assertEqual(
            response.data["latestBookedMeeting"]["advisor"], "Dashboard Trainer"
        )


@override_settings(CACHES=TEST_CACHES)
class PublicContentSecurityTests(TestCase):
    def setUp(self):
        self.public_client = APIClient()
        self.auth_client = APIClient()

        self.admin_user = User.objects.create_user(
            username="admin-user",
            email="admin@example.com",
            password="StrongPass123!",
            role="admin",
            is_active=True,
        )
        self.client_user = User.objects.create_user(
            username="paid-client",
            email="paid-client@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )

        self.ebook = Ebook.objects.create(
            title="Leadership Playbook",
            topic="Leadership",
            description="Practical leadership guide",
            status="active",
            price="49.00",
            file=SimpleUploadedFile(
                "leadership-playbook.pdf",
                b"%PDF-1.4 test ebook",
                content_type="application/pdf",
            ),
            author="Editorial Team",
            pages=120,
            uploaded_by=self.admin_user,
        )

        self.newsletter = Newsletter.objects.create(
            title="Weekly Leadership Brief",
            short_description="Top insights this week",
            status="published",
            file=SimpleUploadedFile(
                "weekly-brief.pdf",
                b"%PDF-1.4 test newsletter",
                content_type="application/pdf",
            ),
            pages=12,
            author=self.admin_user,
        )

    def test_public_newsletter_author_is_redacted(self):
        response = self.public_client.get(f"/api/lms/client/newsletter/{self.newsletter.id}/")

        self.assertEqual(response.status_code, 200)
        author = response.data["newsletter"]["author"]
        self.assertIsInstance(author, dict)
        self.assertEqual(set(author.keys()), {"displayName"})
        self.assertIsNone(response.data["newsletter"]["fileUrl"])
        self.assertIsNone(response.data["newsletter"]["downloadUrl"])

    def test_public_ebook_responses_do_not_expose_direct_file_urls(self):
        response = self.public_client.get("/api/lms/people/ebooks/")

        self.assertEqual(response.status_code, 200)
        ebook = response.data["ebooks"][0]
        self.assertIsNone(ebook["file"])
        self.assertIsNone(ebook["downloadUrl"])

    def test_paid_user_receives_signed_download_urls(self):
        EbookPurchase.objects.create(
            ebook=self.ebook,
            user=self.client_user,
            price_paid="49.00",
            status="completed",
        )
        self.auth_client.force_authenticate(user=self.client_user)

        ebooks_response = self.auth_client.get("/api/lms/client/ebooks/")
        self.assertEqual(ebooks_response.status_code, 200)
        ebook = ebooks_response.data["ebooks"][0]
        self.assertIsNotNone(ebook["downloadUrl"])
        self.assertNotIn("/uploads/", ebook["downloadUrl"])

        ebook_download_url = urlparse(ebook["downloadUrl"])
        ebook_download_path = (
            f"{ebook_download_url.path}?{ebook_download_url.query}"
            if ebook_download_url.query
            else ebook_download_url.path
        )
        ebook_download_response = self.auth_client.get(ebook_download_path)
        self.assertEqual(ebook_download_response.status_code, 200)

        newsletter_response = self.auth_client.get("/api/lms/client/newsletters/")
        self.assertEqual(newsletter_response.status_code, 200)
        newsletter = newsletter_response.data["newsletters"][0]
        self.assertIsNotNone(newsletter["fileUrl"])
        self.assertIn("/api/lms/client/newsletters/", newsletter["fileUrl"])
        self.assertIn("/view/", newsletter["fileUrl"])
        self.assertIn("token=", newsletter["fileUrl"])
        self.assertIsNone(newsletter["downloadUrl"])

    def test_admin_ebook_purchase_history_includes_guest_purchases(self):
        EbookPurchase.objects.create(
            ebook=self.ebook,
            customer_name="Guest Buyer",
            customer_email="guest@example.com",
            price_paid="49.00",
            status="completed",
        )
        self.auth_client.force_authenticate(user=self.admin_user)

        response = self.auth_client.get(f"/api/lms/admin/ebook/history/{self.ebook.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_purchases"], 1)
        self.assertEqual(response.data["purchase_history"][0]["clientId"], None)
        self.assertEqual(
            response.data["purchase_history"][0]["clientName"], "Guest Buyer"
        )
        self.assertEqual(
            response.data["purchase_history"][0]["clientEmail"], "guest@example.com"
        )

    @patch("lms.people_views.send_ops_email")
    def test_checkout_email_contains_one_time_download_link(self, mock_send_ops_email):
        response = self.public_client.post(
            "/api/lms/people/checkout/",
            {
                "customerName": "Guest Buyer",
                "customerEmail": "guest@example.com",
                "customerPhone": "+1-555-0100",
                "ebooks": [str(self.ebook.id)],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)

        download_link = EbookEmailDownloadLink.objects.get()
        email_body = mail.outbox[0].body

        self.assertIn("one-time download only", email_body)
        self.assertIn(
            f"http://testserver/api/lms/people/ebook-download/{download_link.token}/",
            email_body,
        )
        self.assertNotIn("leadership-playbook.pdf", email_body)
        mock_send_ops_email.assert_called_once()

    @patch("lms.people_views.send_ops_email")
    def test_one_time_email_download_link_can_only_be_used_once(
        self, mock_send_ops_email
    ):
        response = self.public_client.post(
            "/api/lms/people/checkout/",
            {
                "customerName": "Guest Buyer",
                "customerEmail": "guest@example.com",
                "customerPhone": "+1-555-0100",
                "ebooks": [str(self.ebook.id)],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        download_link = EbookEmailDownloadLink.objects.get()
        download_path = f"/api/lms/people/ebook-download/{download_link.token}/"

        first_response = self.public_client.get(download_path)
        self.assertEqual(first_response.status_code, 200)

        download_link.refresh_from_db()
        self.assertIsNotNone(download_link.used_at)

        second_response = self.public_client.get(download_path)
        self.assertEqual(second_response.status_code, 410)
        mock_send_ops_email.assert_called_once()


@override_settings(CACHES=TEST_CACHES)
class CreatePaymentIntentTests(TestCase):
    def setUp(self):
        self.public_client = APIClient()
        self.auth_client = APIClient()

        self.client_user = User.objects.create_user(
            username="checkout-user",
            email="checkout@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )

    def _payload(self):
        return {
            "amount": "49.00",
            "items": [
                {
                    "id": "ebook-1",
                    "name": "Leadership Playbook",
                    "price": "49.00",
                    "quantity": 1,
                }
            ],
            "metadata": {
                "customer_email": "guest@example.com",
                "customer_name": "Guest Buyer",
            },
        }

    @patch("lms.payment_views.send_ops_email")
    @patch("lms.payment_views.stripe.PaymentIntent.create")
    def test_guest_checkout_can_create_payment_intent(
        self, mock_payment_intent_create, mock_send_ops_email
    ):
        mock_payment_intent_create.return_value = SimpleNamespace(
            id="pi_guest_123",
            client_secret="secret_guest_123",
            status="requires_payment_method",
        )

        response = self.public_client.post(
            "/api/lms/people/create-payment-intent/",
            self._payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["payment_intent_id"], "pi_guest_123")
        self.assertEqual(StripePayment.objects.count(), 0)
        mock_send_ops_email.assert_called_once()
        self.assertEqual(
            mock_payment_intent_create.call_args.kwargs["metadata"]["customer_email"],
            "guest@example.com",
        )

    @patch("lms.payment_views.send_ops_email")
    @patch("lms.payment_views.stripe.PaymentIntent.create")
    def test_authenticated_checkout_still_persists_payment_intent(
        self, mock_payment_intent_create, mock_send_ops_email
    ):
        mock_payment_intent_create.return_value = SimpleNamespace(
            id="pi_user_123",
            client_secret="secret_user_123",
            status="requires_payment_method",
        )
        self.auth_client.force_authenticate(user=self.client_user)

        response = self.auth_client.post(
            "/api/lms/people/create-payment-intent/",
            self._payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(StripePayment.objects.count(), 1)
        payment = StripePayment.objects.get()
        self.assertEqual(payment.user, self.client_user)
        self.assertEqual(payment.stripe_payment_intent_id, "pi_user_123")
        self.assertEqual(
            mock_payment_intent_create.call_args.kwargs["metadata"]["user_id"],
            str(self.client_user.id),
        )
        mock_send_ops_email.assert_called_once()


@override_settings(CACHES=TEST_CACHES)
class ClientOnboardingAccessTests(TestCase):
    def setUp(self):
        self.auth_client = APIClient()

        self.unpaid_user = User.objects.create_user(
            username="assessment-prospect",
            email="assessment-prospect@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        Client.objects.create(
            user=self.unpaid_user,
            first_name="Assessment",
            last_name="Prospect",
            email=self.unpaid_user.email,
            program_status="unpaid",
            contract_status="sent_signed",
        )

    def test_unpaid_client_cannot_access_onboarding_progress(self):
        self.auth_client.force_authenticate(user=self.unpaid_user)

        response = self.auth_client.get(
            "/api/lms/client/onboarding/progress/",
            {"user_email": self.unpaid_user.email},
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("payment confirmation", response.data["error"].lower())

    def test_unpaid_client_cannot_save_onboarding_answers(self):
        self.auth_client.force_authenticate(user=self.unpaid_user)

        response = self.auth_client.post(
            "/api/lms/client/onboarding/",
            {
                "user_email": self.unpaid_user.email,
                "questionnaire_title": "Executive Leadership Readiness",
                "data": [{"question": "Q1", "answer": "A1"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("payment confirmation", response.data["error"].lower())


@override_settings(
    CACHES=TEST_CACHES,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
class ScheduleAppointmentEmailTests(TestCase):
    def setUp(self):
        self.public_client = APIClient()
        self.sales_user = User.objects.create_user(
            username="sales-discovery",
            email="sales-discovery@example.com",
            password="StrongPass123!",
            role="sales",
            is_active=True,
        )
        self.scheduled_date = timezone.now().date() + timedelta(days=1)

    def _payload(self, email="prospect@example.com", full_name="Discovery Prospect"):
        return {
            "fullName": full_name,
            "email": email,
            "phone": "+15550100",
            "date": self.scheduled_date.isoformat(),
            "time": "09:00",
        }

    @patch("lms.views.send_ops_email", return_value=True)
    def test_discovery_call_saves_client_profile_details(self, mock_send_ops_email):
        payload = {
            **self._payload(email="profile-details@example.com"),
            "address": "123 Market Street",
            "jobTitle": "Chief Operating Officer",
            "position": "Acme Leadership",
            "industry": "Technology",
            "country": "United States",
            "referredBy": "LinkedIn",
        }

        response = self.public_client.post(
            "/api/lms/client/scheduleCall/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        client_profile = Client.objects.get(user__email=payload["email"])
        self.assertEqual(client_profile.address, payload["address"])
        self.assertEqual(client_profile.job_title, payload["jobTitle"])
        self.assertEqual(client_profile.position, payload["position"])
        self.assertEqual(client_profile.industry, payload["industry"])
        self.assertEqual(client_profile.country, payload["country"])
        self.assertEqual(client_profile.referred_by, payload["referredBy"])
        mock_send_ops_email.assert_called_once()

    @patch("lms.views.send_ops_email", return_value=True)
    def test_new_discovery_call_email_includes_login_and_meeting_instructions(
        self, mock_send_ops_email
    ):
        response = self.public_client.post(
            "/api/lms/client/scheduleCall/",
            self._payload(),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["user_created"])
        self.assertIn("/client/meeting/", response.data["meeting_url"])
        self.assertEqual(response.data["login_url"], "https://theceoinfluencers.com/login")
        self.assertEqual(
            response.data["forgot_password_url"],
            "https://theceoinfluencers.com/forget-password",
        )

        self.assertEqual(len(mail.outbox), 1)
        email_body = mail.outbox[0].body
        self.assertIn("Temporary password:", email_body)
        self.assertIn("https://theceoinfluencers.com/login", email_body)
        self.assertIn(response.data["meeting_url"], email_body)
        self.assertIn("Please open the meeting page at your scheduled time", email_body)
        mock_send_ops_email.assert_called_once()

    @patch("lms.views.send_ops_email", return_value=True)
    def test_existing_user_discovery_call_email_reissues_credentials(
        self, mock_send_ops_email
    ):
        existing_user = User.objects.create_user(
            username="existing-prospect",
            email="existing-prospect@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        existing_user.last_login = timezone.now()
        existing_user.save(update_fields=["last_login"])

        response = self.public_client.post(
            "/api/lms/client/scheduleCall/",
            self._payload(email=existing_user.email),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["user_created"])
        self.assertTrue(response.data["login_credentials"]["temporary_password_sent"])
        self.assertEqual(len(mail.outbox), 1)

        email_body = mail.outbox[0].body
        self.assertIn("Temporary password:", email_body)
        self.assertIn(response.data["meeting_url"], email_body)
        self.assertIn("https://theceoinfluencers.com/forget-password", email_body)
        mock_send_ops_email.assert_called_once()

    @patch("lms.views.send_ops_email", return_value=True)
    def test_existing_no_login_discovery_call_reissues_credentials_and_updates_name(
        self, mock_send_ops_email
    ):
        existing_user = User.objects.create_user(
            username="stale-prospect",
            email="stale-prospect@example.com",
            password="StrongPass123!",
            first_name="Jane",
            last_name="Smith",
            role="client",
            is_active=True,
        )

        response = self.public_client.post(
            "/api/lms/client/scheduleCall/",
            self._payload(
                email=existing_user.email,
                full_name="James Armstrong",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["user_created"])
        self.assertTrue(response.data["login_credentials"]["temporary_password_sent"])

        existing_user.refresh_from_db()
        client_profile = Client.objects.get(user=existing_user)
        self.assertEqual(existing_user.first_name, "James")
        self.assertEqual(existing_user.last_name, "Armstrong")
        self.assertEqual(client_profile.first_name, "James")
        self.assertEqual(client_profile.last_name, "Armstrong")

        email_body = mail.outbox[0].body
        self.assertIn("Hi James", email_body)
        self.assertIn("Temporary password:", email_body)
        self.assertIn(response.data["meeting_url"], email_body)
        mock_send_ops_email.assert_called_once()
