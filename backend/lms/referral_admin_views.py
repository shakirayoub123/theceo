"""Admin API for referral partners, client referrals and referral fees."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin

from .models import ClientReferral, Referral, ReferralFee, ReferralPartner
from .referrals import record_fees_for_existing_payments, referral_tables_ready

User = get_user_model()

PARTNER_TYPES = dict(ReferralPartner.PARTNER_TYPE_CHOICES)

SETUP_MESSAGE = (
    "Referral fees are not set up in this database yet. "
    "Run 'python manage.py migrate' (applies lms 0037) to enable them."
)


def _setup_required_response():
    return Response(
        {"error": SETUP_MESSAGE, "setupRequired": True},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _name(user):
    if not user:
        return ""
    return (user.get_full_name() or "").strip() or user.email or user.username


def _money(value):
    return str((value or Decimal("0")).quantize(Decimal("0.01")))


def _partner_data(partner):
    fees = partner.fees.exclude(status="void")
    return {
        "id": partner.id,
        "name": partner.name,
        "email": partner.email,
        "partnerType": partner.partner_type,
        "partnerTypeLabel": partner.get_partner_type_display(),
        "feePercent": int(partner.fee_rate * 100),
        "referralCode": partner.referral_code,
        "isActive": partner.is_active,
        "notes": partner.notes,
        "referredClients": partner.client_referrals.count(),
        "feesPending": _money(fees.filter(status="pending").aggregate(t=Sum("fee_amount"))["t"]),
        "feesPaid": _money(fees.filter(status="paid").aggregate(t=Sum("fee_amount"))["t"]),
    }


def _fee_data(fee):
    return {
        "id": fee.id,
        "partnerId": fee.partner_id,
        "partnerName": fee.partner.name,
        "partnerType": fee.partner.partner_type,
        "clientName": _name(fee.client_user),
        "clientEmail": fee.client_user.email,
        "program": fee.program_title or (fee.program.title if fee.program else ""),
        "amountPaid": _money(fee.amount_paid),
        "currency": fee.currency,
        "feePercent": float(fee.fee_rate * 100),
        "feeAmount": _money(fee.fee_amount),
        "status": fee.status,
        "paidAt": fee.paid_at.isoformat() if fee.paid_at else None,
        "payoutNote": fee.payout_note,
        "createdAt": fee.created_at.isoformat(),
    }


def _client_referral_data(referral):
    return {
        "id": referral.id,
        "clientUserId": referral.client_user_id,
        "clientName": _name(referral.client_user),
        "clientEmail": referral.client_user.email,
        "partnerId": referral.partner_id,
        "partnerName": referral.partner.name,
        "source": referral.source,
        "referredByText": referral.referred_by_text,
        "createdAt": referral.created_at.isoformat(),
        "feesCount": referral.fees.exclude(status="void").count(),
    }


class AdminReferralsView(APIView):
    """GET /api/lms/admin/referrals/ - partners, referred clients, fees and totals."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        if not referral_tables_ready():
            return Response(
                {
                    "setupRequired": True,
                    "message": SETUP_MESSAGE,
                    "totalUsersViaReferrals": Referral.objects.filter(is_converted=True).count(),
                    "referrals": [],
                    "partners": [],
                    "fees": [],
                    "clients": [],
                    "partnerTypes": [
                        {"value": value, "label": label} for value, label in PARTNER_TYPES.items()
                    ],
                    "summary": {
                        "partners": 0,
                        "referredClients": 0,
                        "paidReferredClients": 0,
                        "feesPending": "0.00",
                        "feesPaid": "0.00",
                    },
                },
                status=status.HTTP_200_OK,
            )

        partners = ReferralPartner.objects.all()
        referrals = ClientReferral.objects.select_related("client_user", "partner")
        fees = ReferralFee.objects.select_related("partner", "client_user", "program")
        active_fees = fees.exclude(status="void")

        linked_ids = set(referrals.values_list("client_user_id", flat=True))
        clients = (
            User.objects.filter(role="client")
            .select_related("client_profile")
            .order_by("first_name", "last_name")[:1000]
        )
        client_options = [
            {
                "id": c.id,
                "name": _name(c),
                "email": c.email,
                "referredBy": getattr(getattr(c, "client_profile", None), "referred_by", "") or "",
                "isLinked": c.id in linked_ids,
            }
            for c in clients
        ]

        return Response(
            {
                # Kept for backwards compatibility with existing dashboard stats.
                "totalUsersViaReferrals": Referral.objects.filter(is_converted=True).count()
                + referrals.count(),
                "referrals": [_client_referral_data(r) for r in referrals],
                "partners": [_partner_data(p) for p in partners],
                "fees": [_fee_data(f) for f in fees],
                "clients": client_options,
                "partnerTypes": [
                    {"value": value, "label": label} for value, label in PARTNER_TYPES.items()
                ],
                "summary": {
                    "partners": partners.filter(is_active=True).count(),
                    "referredClients": referrals.count(),
                    "paidReferredClients": active_fees.values("client_user").distinct().count(),
                    "feesPending": _money(
                        active_fees.filter(status="pending").aggregate(t=Sum("fee_amount"))["t"]
                    ),
                    "feesPaid": _money(
                        active_fees.filter(status="paid").aggregate(t=Sum("fee_amount"))["t"]
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )


def _validate_partner_payload(data, partial=False):
    errors = {}
    cleaned = {}
    if "name" in data or not partial:
        name = (data.get("name") or "").strip()
        if not name:
            errors["name"] = "Name is required."
        cleaned["name"] = name
    if "email" in data:
        cleaned["email"] = (data.get("email") or "").strip().lower()
    if "partnerType" in data or not partial:
        partner_type = data.get("partnerType") or ReferralPartner.TYPE_TCI
        if partner_type not in PARTNER_TYPES:
            errors["partnerType"] = "Must be 'tci' or 'business'."
        cleaned["partner_type"] = partner_type
    if "referralCode" in data and (data.get("referralCode") or "").strip():
        cleaned["referral_code"] = data["referralCode"].strip().upper()
    if "isActive" in data:
        cleaned["is_active"] = bool(data.get("isActive"))
    if "notes" in data:
        cleaned["notes"] = data.get("notes") or ""
    return cleaned, errors


class AdminReferralPartnersView(APIView):
    """POST /api/lms/admin/referral-partners/ - create a partner."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        if not referral_tables_ready():
            return _setup_required_response()
        cleaned, errors = _validate_partner_payload(request.data)
        code = cleaned.get("referral_code")
        if code and ReferralPartner.objects.filter(referral_code__iexact=code).exists():
            errors["referralCode"] = "This referral code is already in use."
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
        partner = ReferralPartner.objects.create(**cleaned)
        return Response(_partner_data(partner), status=status.HTTP_201_CREATED)


class AdminReferralPartnerDetailView(APIView):
    """PATCH /api/lms/admin/referral-partners/<id>/ - update a partner.

    Changing the partner type only affects fees recorded afterwards.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, partner_id):
        if not referral_tables_ready():
            return _setup_required_response()
        partner = get_object_or_404(ReferralPartner, id=partner_id)
        cleaned, errors = _validate_partner_payload(request.data, partial=True)
        code = cleaned.get("referral_code")
        if code and ReferralPartner.objects.filter(referral_code__iexact=code).exclude(id=partner.id).exists():
            errors["referralCode"] = "This referral code is already in use."
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
        for field, value in cleaned.items():
            setattr(partner, field, value)
        partner.save()
        return Response(_partner_data(partner), status=status.HTTP_200_OK)


class AdminClientReferralsView(APIView):
    """POST /api/lms/admin/client-referrals/ - link a client to the partner who referred them.

    Body: {"clientUserId": <int>, "partnerId": <int>}. Fees are created right away
    for any program payments the client has already made.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        if not referral_tables_ready():
            return _setup_required_response()
        client_user = get_object_or_404(User, id=request.data.get("clientUserId"), role="client")
        partner = get_object_or_404(ReferralPartner, id=request.data.get("partnerId"))

        referral = ClientReferral.objects.filter(client_user=client_user).first()
        if referral and referral.partner_id != partner.id:
            if referral.fees.exclude(status="void").exists():
                return Response(
                    {
                        "error": "This client already has referral fees for another partner. "
                        "Void those fees before changing the referrer."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            referral.partner = partner
            referral.source = "manual"
            referral.created_by = request.user
            referral.save(update_fields=["partner", "source", "created_by"])
        elif referral is None:
            profile = getattr(client_user, "client_profile", None)
            referral = ClientReferral.objects.create(
                client_user=client_user,
                partner=partner,
                source="manual",
                referred_by_text=(getattr(profile, "referred_by", "") or "")[:255],
                created_by=request.user,
            )

        new_fees = record_fees_for_existing_payments(client_user)
        data = _client_referral_data(referral)
        data["feesCreated"] = len(new_fees)
        return Response(data, status=status.HTTP_200_OK)


class AdminReferralFeeStatusView(APIView):
    """POST /api/lms/admin/referral-fees/<id>/status/ - mark a fee paid, pending or void."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, fee_id):
        if not referral_tables_ready():
            return _setup_required_response()
        fee = get_object_or_404(ReferralFee, id=fee_id)
        new_status = request.data.get("status")
        if new_status not in {"pending", "paid", "void"}:
            return Response(
                {"error": "status must be 'pending', 'paid' or 'void'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        fee.status = new_status
        if new_status == "paid":
            fee.paid_at = timezone.now()
            fee.paid_by = request.user
        else:
            fee.paid_at = None
            fee.paid_by = None
        if "note" in request.data:
            fee.payout_note = (request.data.get("note") or "")[:255]
        fee.save()
        return Response(_fee_data(fee), status=status.HTTP_200_OK)
