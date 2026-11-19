import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from lms.models import Chapter, ChapterFile, Enrollment, Service, ServiceFile

PDF_BYTES = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=role, is_active=True, **extra,
    )


def pdf(name="session.pdf"):
    return SimpleUploadedFile(name, PDF_BYTES, content_type="application/pdf")


@override_settings(VALIDATE_FILE_CONTENT=False)
class CoachContentManagementTests(TestCase):
    def setUp(self):
        media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=media)
        override.enable()
        self.addCleanup(override.disable)

        self.coach = make_user("cc-coach", "trainer", is_approved=True)
        self.sales = make_user("cc-sales", "sales")
        self.client_user = make_user("cc-client", "client")
        self.program = Service.objects.create(
            title="Program One", description="x", price=Decimal("100"), trainer=self.coach, order=1
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.coach)

    def test_only_coaches_and_admins_can_manage(self):
        for user in (self.sales, self.client_user):
            self.api.force_authenticate(user=user)
            self.assertEqual(self.api.post("/api/lms/coach/programs/", {"title": "X"}).status_code, 403)
            self.assertEqual(self.api.delete(f"/api/lms/coach/programs/{self.program.id}/").status_code, 403)
        self.program.refresh_from_db()
        self.assertEqual(self.program.status, "active")

    def test_add_program_and_archive_restore_keeps_enrollments(self):
        response = self.api.post(
            "/api/lms/coach/programs/", {"title": "New Program", "price": "2500"}, format="json"
        )
        self.assertEqual(response.status_code, 201, response.content)
        new = Service.objects.get(title="New Program")
        self.assertEqual(new.status, "active")
        self.assertEqual(new.order, 2)
        self.assertIn(self.coach, new.advisors.all())

        duplicate = self.api.post("/api/lms/coach/programs/", {"title": "new program"}, format="json")
        self.assertEqual(duplicate.status_code, 400)

        Enrollment.objects.create(user=self.client_user, service=self.program)
        self.assertEqual(self.api.delete(f"/api/lms/coach/programs/{self.program.id}/").status_code, 200)
        self.program.refresh_from_db()
        self.assertEqual(self.program.status, "archived")
        self.assertTrue(Enrollment.objects.filter(service=self.program).exists())

        public = self.api.get("/api/lms/people/programs/").json()["programs"]
        self.assertNotIn(self.program.id, [p["id"] for p in public])
        archived = self.api.get("/api/lms/coach/programs/?status=archived").json()["programs"]
        self.assertEqual([p["id"] for p in archived], [self.program.id])

        self.assertEqual(self.api.post(f"/api/lms/coach/programs/{self.program.id}/restore/").status_code, 200)
        self.program.refresh_from_db()
        self.assertEqual(self.program.status, "active")

    def test_add_and_delete_learning_session_with_pdf_and_toolkit(self):
        response = self.api.post(
            f"/api/lms/coach/programs/{self.program.id}/sessions/",
            {"title": "Session 1", "summary": "Key points", "pdf": pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.content)
        chapter = Chapter.objects.get(id=response.json()["id"])
        self.assertEqual(chapter.chapter_files.count(), 1)

        second = self.api.post(
            f"/api/lms/coach/programs/{self.program.id}/sessions/", {"title": "Session 2"}, format="multipart"
        )
        self.assertEqual(second.status_code, 201)

        materials = self.api.get(f"/api/lms/programs/{self.program.id}/learning-materials/").json()
        self.assertEqual([s["title"] for s in materials["sessions"]], ["Session 1", "Session 2"])
        self.assertIsNotNone(materials["sessions"][0]["pdf"])
        self.assertEqual(materials["sessions"][0]["summary"], "Key points")

        toolkit = self.api.post(
            f"/api/lms/coach/sessions/{chapter.id}/files/",
            {"file": pdf("worksheet.pdf"), "title": "Worksheet"},
            format="multipart",
        )
        self.assertEqual(toolkit.status_code, 201, toolkit.content)
        file_id = toolkit.json()["id"]
        self.assertEqual(self.api.delete(f"/api/lms/coach/session-files/{file_id}/").status_code, 200)
        self.assertFalse(ChapterFile.objects.filter(id=file_id).exists())

        self.assertEqual(self.api.delete(f"/api/lms/coach/sessions/{chapter.id}/").status_code, 200)
        self.assertFalse(Chapter.objects.filter(id=chapter.id).exists())

    def test_program_toolkit_add_delete_and_bad_file_rejected(self):
        response = self.api.post(
            f"/api/lms/coach/programs/{self.program.id}/files/", {"file": pdf("kit.pdf")}, format="multipart"
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(ServiceFile.objects.get(id=response.json()["id"]).title, "kit")
        self.assertEqual(
            self.api.delete(f"/api/lms/coach/program-files/{response.json()['id']}/").status_code, 200
        )

        bad = self.api.post(
            f"/api/lms/coach/programs/{self.program.id}/files/",
            {"file": SimpleUploadedFile("evil.exe", b"MZ", content_type="application/octet-stream")},
            format="multipart",
        )
        self.assertEqual(bad.status_code, 400)
        self.assertFalse(ServiceFile.objects.filter(service=self.program).exists())
