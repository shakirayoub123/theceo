from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from lms.models import Enrollment, Service


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=role, is_active=True, **extra,
    )


class ClientNotesTests(TestCase):
    def setUp(self):
        self.coach = make_user("n-coach", "trainer", is_approved=True, first_name="Jane", last_name="Doe")
        self.other_coach = make_user("n-other", "trainer", is_approved=True)
        self.client_user = make_user("n-client", "client", first_name="Peter", last_name="Client")
        program = Service.objects.create(title="P", description="x", price=Decimal("1"), trainer=self.coach)
        Enrollment.objects.create(user=self.client_user, service=program)
        self.url = f"/api/people/clients/{self.client_user.id}/notes/"
        self.api = APIClient()

    def _as(self, user):
        self.api.force_authenticate(user=user)
        return self.api

    def test_coach_and_client_notes_history(self):
        r = self._as(self.coach).post(self.url, {"content": "Discussed goals for Q1"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["category"], "coaching")
        self.assertEqual(r.json()["title"], "Discussed goals for Q1")

        r = self._as(self.client_user).post(self.url, {"content": "My reflections"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["category"], "client")

        # Coach sees both, newest first, with author info.
        notes = self._as(self.coach).get(self.url).json()
        self.assertEqual([n["content"] for n in notes], ["My reflections", "Discussed goals for Q1"])
        self.assertEqual(notes[0]["authorRole"], "client")
        self.assertEqual(notes[1]["advisorName"], "Jane Doe")

        # Client sees only their own note, never the coach's private notes.
        client_notes = self._as(self.client_user).get(self.url).json()
        self.assertEqual([n["content"] for n in client_notes], ["My reflections"])

    def test_unrelated_coach_is_denied(self):
        self.assertEqual(self._as(self.other_coach).get(self.url).status_code, 403)
