from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from lms.models import Ebook, EbookSeries


class AdminEbooksSeriesGroupingTests(TestCase):
    """Admin eBooks page groups eBooks by series using seriesId."""

    def test_admin_ebooks_include_series_id_and_name(self):
        admin = User.objects.create_user(
            username="eb-admin", email="eb-admin@example.com", password="StrongPass123!",
            role="admin", is_active=True,
        )
        series = EbookSeries.objects.create(title="Series I", created_by=admin)
        in_series = Ebook.objects.create(title="eBook 1", series=series, uploaded_by=admin, status="active")
        loose = Ebook.objects.create(title="Standalone", uploaded_by=admin)

        api = APIClient()
        api.force_authenticate(user=admin)
        response = api.get("/api/lms/admin/ebooks/")
        self.assertEqual(response.status_code, 200, response.content)

        by_id = {str(e["id"]): e for e in response.json()["ebooks"]}
        self.assertEqual(by_id[str(in_series.id)]["seriesId"], str(series.id))
        self.assertEqual(by_id[str(in_series.id)]["seriesName"], "Series I")
        self.assertIsNone(by_id[str(loose.id)]["seriesId"])

        series_list = api.get("/api/lms/admin/ebook-series-get-all/").json()["series"]
        self.assertEqual(series_list[0]["totalEbooksAssigned"], 1)
