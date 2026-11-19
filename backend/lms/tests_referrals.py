from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from comms.models import Notification
from lms.models import ClientReferral, ReferralFee, ReferralPartner, Service, StripePayment
from lms.referrals import record_referral_fee
from people.models import Client


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
class ReferralFeeTests(TestCase):
    def setUp(self):
        self.admin = make_user("ref-admin", "admin")
        self.coach = make_user("ref-coach", "trainer", is_approved=True)
        self.program = Service.objects.create(
            title="Live 2:1 Coaching", description="x", price=Decimal("2500"), trainer=self.coach
        )
        self.tci_partner = ReferralPartner.objects.create(
            name="Jane Referrer", email="jane@ref.com", partner_type="tci"
        )
        self.business_partner = ReferralPartner.objects.create(
            name="Acme Partners", email="hello@acme.com", partner_type="business"
        )
        self.client_user = make_user("ref-client", "client", first_name="Peter", last_name="Client")

    def _set_referred_by(self, text):
        profile = Client.objects.get(user=self.client_user)
        profile.referred_by = text
        profile.save()

    def _payment(self, amount="2500.00", metadata=None, status="succeeded"):
        return StripePayment.objects.create(
            user=self.client_user,
            amount=Decimal(amount),
            currency="usd",
            status=status,
            metadata=metadata if metadata is not None else {"program_id": str(self.program.id)},
        )

    def test_business_partner_earns_15_percent(self):
        self._set_referred_by("acme partners")  # matched by name, case-insensitive
        fee = record_referral_fee(self._payment(), self.client_user, service=self.program)

        self.assertEqual(fee.partner, self.business_partner)
        self.assertEqual(fee.fee_rate, Decimal("0.15"))
        self.assertEqual(fee.fee_amount, Decimal("375.00"))
        self.assertEqual(fee.program_title, "Live 2:1 Coaching")
        self.assertEqual(fee.status, "pending")
        self.assertEqual(ClientReferral.objects.get(client_user=self.client_user).source, "auto")
        self.assertTrue(
            Notification.objects.filter(user=self.admin, title="Referral fee due").exists()
        )

    def test_tci_referral_earns_10_percent_matched_by_code(self):
        self._set_referred_by(self.tci_partner.referral_code.lower())
        fee = record_referral_fee(self._payment("1999.99"), self.client_user, service=self.program)

        self.assertEqual(fee.partner, self.tci_partner)
        self.assertEqual(fee.fee_rate, Decimal("0.10"))
        self.assertEqual(fee.fee_amount, Decimal("200.00"))

    def test_unreferred_client_gets_no_fee(self):
        self._set_referred_by("LinkedIn")
        self.assertIsNone(record_referral_fee(self._payment(), self.client_user, service=self.program))
        self.assertFalse(ReferralFee.objects.exists())

    def test_fee_is_recorded_once_per_payment(self):
        self._set_referred_by("Acme Partners")
        payment = self._payment()
        record_referral_fee(payment, self.client_user, service=self.program)
        record_referral_fee(payment, self.client_user, service=self.program)
        self.assertEqual(ReferralFee.objects.count(), 1)

    def test_each_paid_program_earns_its_own_fee(self):
        self._set_referred_by("Acme Partners")
        record_referral_fee(self._payment("2500.00"), self.client_user, service=self.program)
        record_referral_fee(self._payment("1000.00"), self.client_user, service=self.program)
        self.assertEqual(
            sorted(ReferralFee.objects.values_list("fee_amount", flat=True)),
            [Decimal("150.00"), Decimal("375.00")],
        )

    def test_shop_orders_and_unconfirmed_payments_earn_no_fee(self):
        self._set_referred_by("Acme Partners")
        self.assertIsNone(
            record_referral_fee(self._payment(metadata={"items": [{"ebook": 1}]}), self.client_user)
        )
        self.assertIsNone(
            record_referral_fee(self._payment(status="processing"), self.client_user)
        )

    @patch("people.views.send_ops_email", return_value=True)
    def test_confirmed_program_payment_records_fee(self, _ops):
        from people.views import finalize_successful_client_payment

        self._set_referred_by("Acme Partners")
        payment = self._payment(status="processing")
        finalize_successful_client_payment(payment, self.client_user, "2500.00", "usd", "pi_ref_1")

        fee = ReferralFee.objects.get(stripe_payment=payment)
        self.assertEqual(fee.fee_amount, Decimal("375.00"))


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@example.com",
)
class AdminReferralApiTests(TestCase):
    def setUp(self):
        self.admin = make_user("api-admin", "admin")
        self.sales = make_user("api-sales", "sales")
        self.coach = make_user("api-coach", "trainer", is_approved=True)
        self.program = Service.objects.create(
            title="Executive Program", description="x", price=Decimal("3000"), trainer=self.coach
        )
        self.client_user = make_user("api-client", "client")
        self.payment = StripePayment.objects.create(
            user=self.client_user, amount=Decimal("3000.00"), currency="usd",
            status="succeeded", metadata={"program_id": str(self.program.id)},
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.admin)

    def test_admin_creates_partner_links_paid_client_and_marks_fee_paid(self):
        response = self.api.post(
            "/api/lms/admin/referral-partners/",
            {"name": "Biz Partner", "email": "biz@example.com", "partnerType": "business"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        partner = response.json()
        self.assertEqual(partner["feePercent"], 15)

        # Linking a client who already paid creates the fee straight away.
        response = self.api.post(
            "/api/lms/admin/client-referrals/",
            {"clientUserId": self.client_user.id, "partnerId": partner["id"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["feesCreated"], 1)

        overview = self.api.get("/api/lms/admin/referrals/").json()
        self.assertEqual(overview["summary"]["feesPending"], "450.00")
        fee = overview["fees"][0]
        self.assertEqual((fee["feeAmount"], fee["program"]), ("450.00", "Executive Program"))

        response = self.api.post(
            f"/api/lms/admin/referral-fees/{fee['id']}/status/",
            {"status": "paid", "note": "Bank transfer #123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        overview = self.api.get("/api/lms/admin/referrals/").json()
        self.assertEqual(overview["summary"]["feesPaid"], "450.00")
        self.assertEqual(overview["summary"]["feesPending"], "0.00")

    def test_cannot_switch_referrer_once_fees_exist(self):
        first = ReferralPartner.objects.create(name="First", partner_type="tci")
        second = ReferralPartner.objects.create(name="Second", partner_type="business")
        self.api.post(
            "/api/lms/admin/client-referrals/",
            {"clientUserId": self.client_user.id, "partnerId": first.id},
            format="json",
        )
        response = self.api.post(
            "/api/lms/admin/client-referrals/",
            {"clientUserId": self.client_user.id, "partnerId": second.id},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_non_admin_is_forbidden(self):
        self.api.force_authenticate(user=self.sales)
        self.assertEqual(self.api.get("/api/lms/admin/referrals/").status_code, 403)


class ReferralsNotMigratedTests(TestCase):
    """Databases without the referral tables get a clear 'setup required' response."""

    def test_overview_reports_setup_required_and_actions_are_refused(self):
        admin = make_user("nm-admin", "admin")
        api = APIClient()
        api.force_authenticate(user=admin)
        with patch("lms.referral_admin_views.referral_tables_ready", return_value=False):
            overview = api.get("/api/lms/admin/referrals/")
            create = api.post(
                "/api/lms/admin/referral-partners/", {"name": "X"}, format="json"
            )
        self.assertEqual(overview.status_code, 200)
        self.assertTrue(overview.json()["setupRequired"])
        self.assertEqual(overview.json()["fees"], [])
        self.assertEqual(create.status_code, 503)

    def test_fee_recording_is_skipped_without_tables(self):
        user = make_user("nm-client", "client")
        payment = StripePayment.objects.create(
            user=user, amount=Decimal("100"), currency="usd", status="succeeded", metadata={}
        )
        with patch("lms.referrals.referral_tables_ready", return_value=False):
            self.assertIsNone(record_referral_fee(payment, user))
