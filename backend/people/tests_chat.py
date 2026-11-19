from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from people.models import Client


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=role, is_active=True, **extra,
    )


class CoachClientChatTests(TestCase):
    def setUp(self):
        self.coach = make_user("ch-coach", "trainer", is_approved=True, first_name="Jane", last_name="Doe")
        self.client_user = make_user("ch-client", "client", first_name="Peter", last_name="Client")
        profile = Client.objects.get(user=self.client_user)
        profile.program_status = "paid"
        profile.save()
        self.coach_api = APIClient()
        self.coach_api.force_authenticate(self.coach)
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.client_user)

    def _start(self):
        return self.coach_api.post("/api/people/chats/", {"userId": self.client_user.id}, format="json")

    def test_start_reuses_existing_conversation(self):
        first = self._start()
        self.assertEqual(first.status_code, 201, first.content)
        second = self._start()
        self.assertEqual(second.status_code, 200, second.content)
        self.assertEqual(first.json()["chatId"], second.json()["chatId"])

    def test_messages_are_sent_as_logged_in_user_and_seen_by_both(self):
        chat_id = self._start().json()["chatId"]

        # A forged senderId (the client's id) must be ignored.
        r = self.coach_api.post(
            f"/api/people/chats/{chat_id}/messages/",
            {"text": "Hello Peter", "senderId": self.client_user.id},
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        r = self.client_api.post(
            f"/api/people/chats/{chat_id}/messages/", {"text": "Hi coach"}, format="json"
        )
        self.assertEqual(r.status_code, 201, r.content)

        from messaging.models import ChatMessage

        senders = list(
            ChatMessage.objects.filter(session_id=chat_id).order_by("created_at").values_list("sender__username", "text")
        )
        self.assertEqual(senders, [("ch-coach", "Hello Peter"), ("ch-client", "Hi coach")])

        self.assertEqual(len(self.client_api.get("/api/all-chats/").json()), 1)
        msgs = self.client_api.get(f"/api/messaging/sessions/{chat_id}/messages/")
        self.assertEqual(msgs.status_code, 200)
        self.assertEqual(len(msgs.json()), 2)

    def test_clients_cannot_start_chats(self):
        r = self.client_api.post("/api/people/chats/", {"userId": self.coach.id}, format="json")
        self.assertEqual(r.status_code, 403)


class ChatContactsTests(TestCase):
    def test_coach_sees_only_clients_in_their_programs(self):
        from decimal import Decimal

        from lms.models import Enrollment, Service

        coach = make_user("cc-coach", "trainer", is_approved=True)
        mine = make_user("cc-mine", "client", first_name="Mine", last_name="Client")
        make_user("cc-other", "client")
        program = Service.objects.create(title="P", description="x", price=Decimal("1"), trainer=coach)
        Enrollment.objects.create(user=mine, service=program)

        api = APIClient()
        api.force_authenticate(coach)
        contacts = api.get("/api/people/chats/contacts/").json()["contacts"]
        self.assertEqual([c["name"] for c in contacts], ["Mine Client"])
