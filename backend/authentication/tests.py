from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, APIClient

from accounts.models import User
from authentication.models import OTP
from authentication.views import FORGOT_PASSWORD_GENERIC_MESSAGE
from authentication.views import LoginView

TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-auth-cache",
    }
}


@override_settings(CACHES=TEST_CACHES)
class LoginViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self._original_throttle_classes = LoginView.throttle_classes
        LoginView.throttle_classes = []
        self.addCleanup(
            setattr,
            LoginView,
            "throttle_classes",
            self._original_throttle_classes,
        )
        self.view = LoginView.as_view()

    def _login(self, email, password):
        request = self.factory.post(
            "/api/auth/login",
            {"email": email, "password": password},
            format="json",
        )
        return self.view(request)

    def test_suspended_user_cannot_login(self):
        user = User.objects.create_user(
            username="suspended-user",
            email="suspended@example.com",
            password="StrongPass123!",
            role="client",
            is_suspended=True,
            is_active=True,
        )

        response = self._login(user.email, "StrongPass123!")

        self.assertEqual(response.status_code, 403)
        self.assertIn("suspended", response.data["error"].lower())

    def test_unapproved_trainer_cannot_login(self):
        user = User.objects.create_user(
            username="trainer-user",
            email="trainer@example.com",
            password="StrongPass123!",
            role="trainer",
            is_approved=False,
            is_active=True,
        )

        response = self._login(user.email, "StrongPass123!")

        self.assertEqual(response.status_code, 403)
        self.assertIn("pending approval", response.data["error"].lower())

    def test_email_lookup_is_case_insensitive_for_login(self):
        user = User.objects.create_user(
            username="case-user",
            email="caseuser@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )

        response = self._login("CASEUSER@EXAMPLE.COM", "StrongPass123!")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user_id"], user.id)


@override_settings(CACHES=TEST_CACHES)
class ForgotPasswordViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="otp-user",
            email="otp-user@example.com",
            password="StrongPass123!",
            role="client",
            is_active=True,
        )

    def _post(self, email):
        return self.client.post(
            "/api/auth/forgot-password",
            {"email": email},
            format="json",
        )

    def test_returns_generic_message_for_unknown_email(self):
        response = self._post("missing-user@example.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], FORGOT_PASSWORD_GENERIC_MESSAGE)
        self.assertFalse(OTP.objects.filter(email="missing-user@example.com").exists())

    def test_replaces_existing_unused_otps(self):
        OTP.objects.create(email=self.user.email)
        OTP.objects.create(email=self.user.email)

        response = self._post(self.user.email)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], FORGOT_PASSWORD_GENERIC_MESSAGE)
        self.assertEqual(
            OTP.objects.filter(email=self.user.email, is_used=False).count(),
            1,
        )
