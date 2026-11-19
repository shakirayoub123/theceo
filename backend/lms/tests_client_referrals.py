from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from lms.models import ClientReferral, ReferralFee, ReferralPartner, Service, StripePayment
from lms.referrals import record_referral_fee


def make_user(username, role, **extra):
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        is_active=True,
        **extra,
    )


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
class StaffClientReferralTests(TestCase):
    URL = "/api/lms/staff/client-referrals/"

    def setUp(self):
        self.admin = make_user("cr-admin", "admin")
        self.sales = make_user("cr-sales", "sales")
        self.coach = make_user("cr-coach", "trainer", is_approved=True)
        self.p1 = Service.objects.create(
            title="Program One", description="x", price=Decimal("9000"), trainer=self.coach, order=1
        )
        self.p3 = Service.objects.create(
            title="Program Three", description="x", price=Decimal("20000"), trainer=self.coach, order=3
        )
        self.p9 = Service.objects.create(
            title="Program Nine", description="x", price=Decimal("3000"), trainer=self.coach, order=9
        )
        self.api = APIClient()

    def _add(self, user, **overrides):
        self.api.force_authenticate(user=user)
        payload = {
            "referrerName": "Rita Referrer",
            "referrerEmail": "rita@example.org",
            "referrerPhone": "+1 555 0100",
            "clientName": "Nina New",
            "clientEmail": "nina@example.org",
        }
        payload.update(overrides)
        return self.api.post(self.URL, payload, format="json")

    def _pay(self, user, service, amount="9000.00"):
        payment = StripePayment.objects.create(
            user=user, amount=Decimal(amount), currency="usd", status="succeeded",
            metadata={"program_id": str(service.id)},
        )
        return record_referral_fee(payment, user, service=service)

    def test_sales_and_coach_can_add_clients_cannot(self):
        self.assertEqual(self._add(self.sales).status_code, 201)
        self.assertEqual(
            self._add(self.coach, clientEmail="other@example.org").status_code, 201
        )
        client = make_user("cr-client", "client")
        self.assertEqual(self._add(client, clientEmail="x@example.org").status_code, 403)

        partner = ReferralPartner.objects.get(email="rita@example.org")
        self.assertEqual(partner.partner_type, "tci")
        self.assertEqual(partner.phone, "+1 555 0100")
        self.assertEqual(ReferralPartner.objects.filter(email="rita@example.org").count(), 1)

    def test_percentage_fee_only_after_client_signs_up_and_pays(self):
        response = self._add(self.sales)
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["status"], "awaiting_signup")

        # Client creates an account later with the same email and pays for Program 3.
        client = User.objects.create_user(
            username="nina", email="Nina@Example.org", password="StrongPass123!", role="client", is_active=True
        )
        fee = self._pay(client, self.p3, amount="20000.00")
        self.assertIsNotNone(fee)
        self.assertEqual(fee.fee_amount, Decimal("2000.00"))  # 10% of 20,000
        self.assertEqual(fee.fee_label, "10% of program price")
        self.assertEqual(ClientReferral.objects.get().client_user, client)

        self.api.force_authenticate(user=self.sales)
        data = self.api.get(self.URL).json()
        self.assertEqual(data["referrals"][0]["status"], "fee_due")
        self.assertEqual(data["summary"]["feesDue"], "2000.00")
        self.assertEqual([t["percent"] for t in data["partnerTypes"]], [10, 15])

        # Admin pays the referrer -> staff sees it as paid.
        self.api.force_authenticate(user=self.admin)
        paid = self.api.post(f"/api/lms/admin/referral-fees/{fee.id}/status/", {"status": "paid"}, format="json")
        self.assertEqual(paid.status_code, 200)
        self.api.force_authenticate(user=self.sales)
        self.assertEqual(self.api.get(self.URL).json()["referrals"][0]["status"], "fee_paid")

    def test_unpaid_payment_creates_no_fee(self):
        self._add(self.sales)
        client = User.objects.create_user(
            username="nina", email="nina@example.org", password="StrongPass123!", role="client", is_active=True
        )
        payment = StripePayment.objects.create(
            user=client, amount=Decimal("9000"), currency="usd", status="pending",
            metadata={"program_id": str(self.p1.id)},
        )
        self.assertIsNone(record_referral_fee(payment, client, service=self.p1))
        self.assertFalse(ReferralFee.objects.exists())

    def test_business_partner_type_earns_15_percent(self):
        client = make_user("cr-existing", "client")
        response = self._add(self.coach, clientEmail=client.email, referrerType="business")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["status"], "awaiting_payment")
        self.assertEqual(response.json()["feePercent"], 15)
        fee = self._pay(client, self.p9, amount="3000.00")
        self.assertEqual(fee.fee_amount, Decimal("450.00"))
        self.assertEqual(fee.fee_label, "15% of program price")

        bad = self._add(self.coach, clientEmail="z@example.org", referrerType="fixed")
        self.assertEqual(bad.status_code, 400)

    def test_admin_can_adjust_pending_fee_amount(self):
        client = make_user("cr-existing2", "client")
        self._add(self.sales, clientEmail=client.email)
        fee = self._pay(client, self.p1, amount="9000.00")
        self.assertEqual(fee.fee_amount, Decimal("900.00"))
        self.api.force_authenticate(user=self.admin)
        response = self.api.post(
            f"/api/lms/admin/referral-fees/{fee.id}/status/",
            {"status": "pending", "feeAmount": "750"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        fee.refresh_from_db()
        self.assertEqual(fee.fee_amount, Decimal("750.00"))

    def test_duplicates_staff_emails_and_visibility(self):
        self.assertEqual(self._add(self.sales).status_code, 201)
        dup = self._add(self.coach, referrerName="Someone Else", referrerEmail="")
        self.assertEqual(dup.status_code, 400)
        self.assertIn("already referred", dup.json()["error"])

        staff = self._add(self.sales, clientEmail=self.coach.email)
        self.assertEqual(staff.status_code, 400)

        bad = self._add(self.sales, clientEmail="not-an-email")
        self.assertEqual(bad.status_code, 400)

        # Coach doesn't see the sales person's referral; admin sees all.
        self.api.force_authenticate(user=self.coach)
        self.assertEqual(self.api.get(self.URL).json()["referrals"], [])
        self.api.force_authenticate(user=self.admin)
        self.assertEqual(len(self.api.get(self.URL).json()["referrals"]), 1)
        admin_view = self.api.get("/api/lms/admin/referrals/").json()
        self.assertEqual(admin_view["referrals"][0]["clientEmail"], "nina@example.org")
        self.assertFalse(admin_view["referrals"][0]["hasAccount"])

    def test_delete_only_before_fee(self):
        client = make_user("cr-existing3", "client")
        referral_id = self._add(self.sales, clientEmail=client.email).json()["id"]
        self._pay(client, self.p1)
        self.api.force_authenticate(user=self.sales)
        self.assertEqual(self.api.delete(f"{self.URL}{referral_id}/").status_code, 400)

        other_id = self._add(self.sales, clientEmail="later@example.org").json()["id"]
        self.api.force_authenticate(user=self.coach)
        self.assertEqual(self.api.delete(f"{self.URL}{other_id}/").status_code, 404)
        self.api.force_authenticate(user=self.sales)
        self.assertEqual(self.api.delete(f"{self.URL}{other_id}/").status_code, 200)
