from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from people.models import Client
from lms.models import Enrollment, Service, StripePayment
from scheduling.models import Meeting

TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-people-cache",
    }
}


@override_settings(
    CACHES=TEST_CACHES,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
class SalesCreateClientViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sales_user = User.objects.create_user(
            username="sales-user",
            email="sales@example.com",
            password="StrongPass123!",
            role="sales",
            is_active=True,
        )
        self.client.force_authenticate(user=self.sales_user)

    @patch("people.views.send_ops_email", return_value=True)
    def test_creating_brand_new_client_sends_welcome_credentials_email(
        self, mock_send_ops_email
    ):
        response = self.client.post(
            "/api/people/sales/clients/create/",
            {
                "first_name": "Ayesha",
                "last_name": "Khan",
                "email": "Ayesha.Khan@example.com",
                "phone": "1234567890",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["user_created"])
        self.assertTrue(response.data["client_created"])
        self.assertTrue(response.data["credentials_sent"])

        user = User.objects.get(email="ayesha.khan@example.com")
        client_profile = Client.objects.get(user=user)

        self.assertEqual(Client.objects.filter(user=user).count(), 1)
        self.assertEqual(client_profile.assigned_sales, self.sales_user)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["ayesha.khan@example.com"])
        self.assertIn("https://theceoinfluencers.com/login", mail.outbox[0].body)
        self.assertIn("Temporary password:", mail.outbox[0].body)
        self.assertIn("Email: ayesha.khan@example.com", mail.outbox[0].body)
        mock_send_ops_email.assert_called_once()

    @patch("people.views.send_ops_email", return_value=True)
    def test_creating_client_for_existing_user_resets_password_and_sends_credentials(
        self, mock_send_ops_email
    ):
        existing_user = User.objects.create_user(
            username="existing-user",
            email="existing@example.com",
            password="OldPassword123!",
            role="sales",
            is_active=True,
        )

        response = self.client.post(
            "/api/people/sales/clients/create/",
            {
                "first_name": "Existing",
                "last_name": "Client",
                "email": "Existing@Example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["user_created"])
        self.assertTrue(response.data["client_created"])
        self.assertTrue(response.data["credentials_sent"])

        existing_user.refresh_from_db()
        self.assertEqual(existing_user.role, "client")
        self.assertTrue(Client.objects.filter(user=existing_user).exists())
        self.assertEqual(Client.objects.filter(user=existing_user).count(), 1)
        self.assertFalse(existing_user.check_password("OldPassword123!"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["existing@example.com"])
        self.assertIn("Temporary password:", mail.outbox[0].body)
        self.assertIn(
            "Forgot Password option on the login page", mail.outbox[0].body
        )
        mock_send_ops_email.assert_called_once()

    @patch("people.views.send_ops_email", return_value=True)
    def test_existing_client_without_last_login_gets_credentials_reissued(
        self, mock_send_ops_email
    ):
        existing_user = User.objects.create_user(
            username="existing-client",
            email="existing-client@example.com",
            password="OldPassword123!",
            first_name="Existing",
            last_name="Client",
            role="client",
            is_active=True,
        )
        existing_client = Client.objects.get(user=existing_user)
        existing_client.assigned_sales = self.sales_user
        existing_client.save(update_fields=["assigned_sales", "updated_at"])

        response = self.client.post(
            "/api/people/sales/clients/create/",
            {
                "first_name": "Existing",
                "last_name": "Client",
                "email": "existing-client@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["user_created"])
        self.assertFalse(response.data["client_created"])
        self.assertTrue(response.data["credentials_sent"])

        existing_user.refresh_from_db()
        self.assertFalse(existing_user.check_password("OldPassword123!"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["existing-client@example.com"])
        self.assertIn("Temporary password:", mail.outbox[0].body)
        mock_send_ops_email.assert_not_called()

    @patch("people.views.send_ops_email", return_value=True)
    def test_existing_unpaid_client_with_login_gets_credentials_reissued(
        self, mock_send_ops_email
    ):
        existing_user = User.objects.create_user(
            username="logged-in-client",
            email="logged-in-client@example.com",
            password="OldPassword123!",
            first_name="Logged",
            last_name="Client",
            role="client",
            is_active=True,
        )
        existing_user.last_login = timezone.now()
        existing_user.save(update_fields=["last_login"])
        existing_client = Client.objects.get(user=existing_user)
        existing_client.assigned_sales = self.sales_user
        existing_client.program_status = "unpaid"
        existing_client.save(
            update_fields=["assigned_sales", "program_status", "updated_at"]
        )

        response = self.client.post(
            "/api/people/sales/clients/create/",
            {
                "first_name": "Logged",
                "last_name": "Client",
                "email": "logged-in-client@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.data["user_created"])
        self.assertFalse(response.data["client_created"])
        self.assertTrue(response.data["credentials_sent"])

        existing_user.refresh_from_db()
        self.assertFalse(existing_user.check_password("OldPassword123!"))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["logged-in-client@example.com"])
        self.assertIn("Temporary password:", mail.outbox[0].body)
        self.assertIn(
            "https://theceoinfluencers.com/forget-password", mail.outbox[0].body
        )
        mock_send_ops_email.assert_not_called()

    @patch("people.views.send_ops_email", return_value=True)
    def test_cannot_take_over_client_assigned_to_another_sales_user(
        self, mock_send_ops_email
    ):
        other_sales_user = User.objects.create_user(
            username="other-sales",
            email="other-sales@example.com",
            password="StrongPass123!",
            role="sales",
            is_active=True,
        )
        existing_user = User.objects.create_user(
            username="assigned-client",
            email="assigned@example.com",
            password="OldPassword123!",
            first_name="Assigned",
            last_name="Client",
            role="client",
            is_active=True,
        )
        existing_client = Client.objects.get(user=existing_user)
        existing_client.first_name = "Assigned"
        existing_client.last_name = "Client"
        existing_client.email = "assigned@example.com"
        existing_client.assigned_sales = other_sales_user
        existing_client.save()

        response = self.client.post(
            "/api/people/sales/clients/create/",
            {
                "first_name": "Changed",
                "last_name": "Name",
                "email": "assigned@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

        existing_user.refresh_from_db()
        existing_client.refresh_from_db()
        self.assertEqual(existing_user.first_name, "Assigned")
        self.assertEqual(existing_user.last_name, "Client")
        self.assertEqual(existing_client.assigned_sales, other_sales_user)
        self.assertEqual(len(mail.outbox), 0)
        mock_send_ops_email.assert_not_called()


@override_settings(
    CACHES=TEST_CACHES,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
    STRIPE_SECRET_KEY="sk_test_123",
    STRIPE_WEBHOOK_SECRET="whsec_test_123",
)
class SalesPaymentJourneyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sales_user = User.objects.create_user(
            username="payment-sales",
            email="payment-sales@example.com",
            password="StrongPass123!",
            role="sales",
            is_active=True,
        )
        self.trainer = User.objects.create_user(
            username="coach-primary",
            email="coach-primary@example.com",
            password="StrongPass123!",
            role="trainer",
            is_active=True,
            is_approved=True,
        )
        self.advisor = User.objects.create_user(
            username="coach-advisor",
            email="coach-advisor@example.com",
            password="StrongPass123!",
            role="trainer",
            is_active=True,
            is_approved=True,
        )
        self.program = Service.objects.create(
            title="Executive Influence Program",
            description="Leadership coaching",
            price=Decimal("2500.00"),
            trainer=self.trainer,
        )
        self.program.advisors.add(self.advisor)
        self.user = User.objects.create_user(
            username="client-prospect",
            email="client-prospect@example.com",
            password="StrongPass123!",
            first_name="Client",
            last_name="Prospect",
            role="client",
            is_active=True,
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.client_profile.assigned_sales = self.sales_user
        self.client_profile.save(update_fields=["assigned_sales", "updated_at"])
        self.client.force_authenticate(user=self.sales_user)

    @patch("people.views.send_ops_email", return_value=True)
    @patch("people.views.stripe.PaymentLink.create")
    @patch("people.views.stripe.Price.create")
    def test_sales_payment_link_requires_selected_program_and_tracks_metadata(
        self, mock_price_create, mock_payment_link_create, mock_send_ops_email
    ):
        mock_price_create.return_value = SimpleNamespace(id="price_program_123")
        mock_payment_link_create.return_value = {
            "id": "plink_program_123",
            "url": "https://buy.stripe.com/test_program",
        }

        response = self.client.post(
            "/api/people/sales/create-payment-link/",
            {
                "lead_id": str(self.user.id),
                "program_id": str(self.program.id),
                "amount": "2500.00",
                "currency": "usd",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["program_id"], str(self.program.id))
        self.assertEqual(response.data["payment_link"], "https://buy.stripe.com/test_program")

        mock_price_create.assert_called_once()
        self.assertEqual(
            mock_price_create.call_args.kwargs["product_data"]["name"],
            "The CEO Influencers - Executive Influence Program",
        )
        self.assertEqual(
            mock_payment_link_create.call_args.kwargs["payment_intent_data"]["metadata"]["program_id"],
            str(self.program.id),
        )

        payment = StripePayment.objects.get(user=self.user)
        self.assertEqual(payment.metadata["program_id"], str(self.program.id))
        self.assertEqual(payment.metadata["program_title"], self.program.title)

        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.contract_status, "sent_signed")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.program.title, mail.outbox[0].body)
        mock_send_ops_email.assert_called_once()

    @patch("people.views.send_ops_email", return_value=True)
    @patch("people.views.stripe.Webhook.construct_event")
    def test_stripe_webhook_enrolls_client_and_sends_copied_confirmation_emails(
        self, mock_construct_event, mock_send_ops_email
    ):
        StripePayment.objects.create(
            user=self.user,
            stripe_payment_intent_id=None,
            amount=Decimal("2500.00"),
            currency="usd",
            status="pending",
            metadata={
                "payment_link_id": "plink_program_123",
                "program_id": str(self.program.id),
                "program_title": self.program.title,
            },
        )
        mock_construct_event.return_value = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_program_123",
                    "amount_received": 250000,
                    "currency": "usd",
                    "metadata": {
                        "user_id": str(self.user.id),
                        "program_id": str(self.program.id),
                        "program_title": self.program.title,
                    },
                }
            },
        }

        response = self.client.post(
            "/api/people/webhooks/stripe/",
            b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="test-signature",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Enrollment.objects.filter(user=self.user, service=self.program).exists()
        )
        first_meeting = Meeting.objects.get(
            attendees__user=self.user,
            service=self.program,
            title__icontains="First Coaching Advisor Meeting",
        )
        self.assertIn(first_meeting.scheduled_at.weekday(), {1, 2, 3})

        self.user.refresh_from_db()
        self.client_profile.refresh_from_db()
        self.assertEqual(self.user.status, "paid")
        self.assertEqual(self.client_profile.program_status, "paid")
        self.assertEqual(self.client_profile.contract_status, "signed")

        subjects = {email.subject for email in mail.outbox}
        self.assertIn("Payment Confirmed - The CEO Influencers", subjects)
        self.assertIn("Welcome to Your CEO Influencers Program", subjects)

        payment_email = next(
            email
            for email in mail.outbox
            if email.subject == "Payment Confirmed - The CEO Influencers"
        )
        self.assertEqual(payment_email.to, [self.user.email])
        self.assertIn("info@theceoinfluencers.com", payment_email.cc)
        self.assertIn(self.trainer.email, payment_email.cc)
        self.assertIn(self.advisor.email, payment_email.cc)

        welcome_email = next(
            email
            for email in mail.outbox
            if email.subject == "Welcome to Your CEO Influencers Program"
        )
        self.assertIn("Tuesday, Wednesday, and Thursday", welcome_email.body)
        self.assertIn("Monday and Friday", welcome_email.body)
        self.assertIn("Please flag and keep this email", welcome_email.body)
        mock_send_ops_email.assert_called_once()
