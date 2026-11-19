import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from lms.models import Chapter, ChapterFile, Enrollment, Service, ServiceFile
from people.models import Client


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=role, is_active=True, **extra,
    )


def upload(name):
    return SimpleUploadedFile(name, b"data", content_type="application/octet-stream")


class ProgramLearningMaterialsTests(TestCase):
    def setUp(self):
        media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=media)
        override.enable()
        self.addCleanup(override.disable)

        self.coach = make_user("lm-coach", "trainer", is_approved=True)
        self.program = Service.objects.create(
            title="Executive Program", description="x", price=Decimal("1"), trainer=self.coach
        )
        self.other_program = Service.objects.create(
            title="Other Program", description="x", price=Decimal("1"), trainer=self.coach
        )
        s2 = Chapter.objects.create(service=self.program, title="Session Two", content="x", order=2)
        s1 = Chapter.objects.create(service=self.program, title="Session One", content="x", order=1)
        ChapterFile.objects.create(chapter=s1, title="Session One PDF", file=upload("s1.pdf"))
        ChapterFile.objects.create(chapter=s1, title="Goal Worksheet", file=upload("worksheet.docx"))
        ChapterFile.objects.create(chapter=s2, title="Template", file=upload("template.xlsx"))
        ServiceFile.objects.create(service=self.program, title="Program Toolkit", file=upload("kit.pdf"))

        self.client_user = make_user("lm-client", "client")
        self.api = APIClient()

    def _get(self, user, program):
        self.api.force_authenticate(user=user)
        response = self.api.get(f"/api/lms/programs/{program.id}/learning-materials/")
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    def test_coach_sees_sessions_in_order_with_pdf_and_toolkits(self):
        data = self._get(self.coach, self.program)

        self.assertFalse(data["locked"])
        self.assertEqual([(s["number"], s["title"]) for s in data["sessions"]], [(1, "Session One"), (2, "Session Two")])
        first, second = data["sessions"]
        self.assertEqual(first["pdf"]["title"], "Session One PDF")
        self.assertEqual([t["title"] for t in first["toolkits"]], ["Goal Worksheet"])
        self.assertIsNone(second["pdf"])
        self.assertEqual([t["title"] for t in second["toolkits"]], ["Template"])
        self.assertEqual([t["title"] for t in data["programToolkits"]], ["Program Toolkit"])

    def test_client_only_sees_purchased_program(self):
        locked = self._get(self.client_user, self.program)
        self.assertTrue(locked["locked"])
        self.assertEqual(locked["sessions"], [])
        self.assertEqual(locked["programToolkits"], [])

        profile = Client.objects.get(user=self.client_user)
        profile.program_status = "paid"
        profile.save()
        Enrollment.objects.create(user=self.client_user, service=self.program)

        unlocked = self._get(self.client_user, self.program)
        self.assertFalse(unlocked["locked"])
        self.assertEqual(len(unlocked["sessions"]), 2)

        # Still locked for a program they did not buy.
        self.assertTrue(self._get(self.client_user, self.other_program)["locked"])

    def test_unpaid_enrolled_client_is_locked(self):
        Enrollment.objects.create(user=self.client_user, service=self.program)
        self.assertTrue(self._get(self.client_user, self.program)["locked"])
