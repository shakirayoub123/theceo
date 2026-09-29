from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from people.models import Client


class AccountsLoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_paid_client_can_login_to_accounts_api(self):
        user = User.objects.create_user(
            username="confirmed-client",
            email="confirmed@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        Client.objects.create(
            user=user,
            first_name="Confirmed",
            last_name="Client",
            email=user.email,
            program_status="paid",
            contract_status="signed",
        )

        response = self.client.post(
            "/api/accounts/login/",
            {"email": user.email, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user_id"], user.id)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_unpaid_client_cannot_login_to_accounts_api(self):
        user = User.objects.create_user(
            username="prospect-client",
            email="prospect@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )
        Client.objects.create(
            user=user,
            first_name="Prospect",
            last_name="Client",
            email=user.email,
            program_status="unpaid",
            contract_status="sent_signed",
        )

        response = self.client.post(
            "/api/accounts/login/",
            {"email": user.email, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("confirmed client", str(response.data).lower())
