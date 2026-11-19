"""The "Client Referrals" tab on the Sales and Coaching dashboards.

Sales and coaches record who referred a new client to TCI. The referrer earns
the same percentage fee as on the admin Referrals page (TCI referral 10%,
business referral partner 15% of the program price), created automatically once
the referred client has paid in full for a program. Admin
pays the referrer and marks the fee paid on the admin Referrals page; the staff
member sees the status here.

  GET    /api/lms/staff/client-referrals/         fee schedule + my referrals (admin: all)
  POST   /api/lms/staff/client-referrals/         add a referral
  DELETE /api/lms/staff/client-referrals/<id>/    remove one (only before any fee exists)
"""

import logging

from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientReferral, ReferralPartner
from .referrals import (
    partner_types_data,
    record_fees_for_existing_payments,
    referral_tables_ready,
)

logger = logging.getLogger(__name__)
User = get_user_model()

SETUP_MESSAGE = (
    "Client referrals are not set up in this database yet. "
    "Run 'python manage.py migrate' (applies lms 0037 and 0038) to enable them."
)


class IsSalesCoachOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", "") in {"sales", "trainer", "admin"} or user.is_superuser)
        )


def _name(user):
    if not user:
        return ""
    return (user.get_full_name() or "").strip() or user.email or user.username


def _money(value):
    return f"{(value or 0):.2f}"


def _status_for(referral, fees):
    if any(f.status == "pending" for f in fees):
        return "fee_due", "Client paid - referral fee due"
    if fees and all(f.status in {"paid", "void"} for f in fees) and any(f.status == "paid" for f in fees):
        return "fee_paid", "Referral fee paid"
    if referral.client_user_id:
        return "awaiting_payment", "Waiting for client to pay in full"
    return "awaiting_signup", "Waiting for client to join TCI"


def _referral_data(referral):
    fees = list(referral.fees.exclude(status="void").select_related("program"))
    code, label = _status_for(referral, fees)
    client = referral.client_user
    return {
        "id": referral.id,
        "referrerName": referral.partner.name,
        "referrerEmail": referral.partner.email,
        "referrerPhone": referral.partner.phone,
        "referrerType": referral.partner.partner_type,
        "referrerTypeLabel": referral.partner.get_partner_type_display(),
        "feePercent": int(referral.partner.fee_rate * 100),
        "clientName": (_name(client) if client else "") or referral.client_name,
        "clientEmail": client.email if client else referral.client_email,
        "hasAccount": bool(client),
        "notes": referral.notes,
        "addedBy": _name(referral.created_by),
        "createdAt": referral.created_at.isoformat(),
        "status": code,
        "statusLabel": label,
        "fees": [
            {
                "id": f.id,
                "program": f.program_title or (f.program.title if f.program else ""),
                "feeLabel": f.fee_label,
                "feeAmount": _money(f.fee_amount),
                "status": f.status,
                "paidAt": f.paid_at.isoformat() if f.paid_at else None,
            }
            for f in fees
        ],
        "feesDue": _money(sum(f.fee_amount for f in fees if f.status == "pending")),
        "feesPaid": _money(sum(f.fee_amount for f in fees if f.status == "paid")),
        "canDelete": not fees,
    }


def _visible_referrals(user):
    qs = ClientReferral.objects.select_related("partner", "client_user", "created_by").order_by("-created_at")
    if getattr(user, "role", "") == "admin" or user.is_superuser:
        return qs
    return qs.filter(created_by=user)


class StaffClientReferralsView(APIView):
    permission_classes = [IsAuthenticated, IsSalesCoachOrAdmin]

    def get(self, request):
        if not referral_tables_ready():
            return Response(
                {"setupRequired": True, "message": SETUP_MESSAGE, "partnerTypes": partner_types_data(), "referrals": []}
            )
        referrals = [_referral_data(r) for r in _visible_referrals(request.user)]
        return Response(
            {
                "partnerTypes": partner_types_data(),
                "referrals": referrals,
                "summary": {
                    "referrals": len(referrals),
                    "paidClients": sum(1 for r in referrals if r["fees"]),
                    "feesDue": _money(sum(float(r["feesDue"]) for r in referrals)),
                    "feesPaid": _money(sum(float(r["feesPaid"]) for r in referrals)),
                },
            }
        )

    def post(self, request):
        if not referral_tables_ready():
            return Response({"error": SETUP_MESSAGE, "setupRequired": True}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        data = request.data
        referrer_name = (data.get("referrerName") or "").strip()[:255]
        referrer_email = (data.get("referrerEmail") or "").strip().lower()
        referrer_phone = (data.get("referrerPhone") or "").strip()[:40]
        client_name = (data.get("clientName") or "").strip()[:255]
        client_email = (data.get("clientEmail") or "").strip().lower()
        referrer_type = (data.get("referrerType") or ReferralPartner.TYPE_TCI).strip()
        notes = (data.get("notes") or "").strip()[:2000]

        errors = {}
        if not referrer_name:
            errors["referrerName"] = "Enter the name of the person who referred the client."
        if not client_name:
            errors["clientName"] = "Enter the new client's name."
        for field, value, required in (
            ("referrerEmail", referrer_email, False),
            ("clientEmail", client_email, True),
        ):
            if not value:
                if required:
                    errors[field] = "Email is required."
                continue
            try:
                validate_email(value)
            except ValidationError:
                errors[field] = "Enter a valid email address."
        if referrer_type not in dict(ReferralPartner.PARTNER_TYPE_CHOICES):
            errors["referrerType"] = "Choose TCI referral or business referral partner."
        if referrer_email and client_email and referrer_email == client_email:
            errors["clientEmail"] = "The client can't refer themselves."
        if errors:
            return Response({"errors": errors, "error": next(iter(errors.values()))}, status=status.HTTP_400_BAD_REQUEST)

        client_user = User.objects.filter(email__iexact=client_email).first()
        if client_user is not None and getattr(client_user, "role", "") != "client":
            return Response(
                {"error": "That email belongs to a TCI staff account, not a client."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            existing = (
                ClientReferral.objects.select_for_update()
                .select_related("partner")
                .filter(Q(client_email__iexact=client_email) | Q(client_user__email__iexact=client_email))
                .first()
            )
            if existing is not None:
                return Response(
                    {"error": f"This client was already referred by {existing.partner.name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            partner = None
            if referrer_email:
                partner = (
                    ReferralPartner.objects.filter(email__iexact=referrer_email, partner_type=referrer_type)
                    .order_by("id")
                    .first()
                )
            if partner is None:
                partner = ReferralPartner.objects.create(
                    name=referrer_name,
                    email=referrer_email,
                    phone=referrer_phone,
                    partner_type=referrer_type,
                    notes=f"Added by {_name(request.user)}",
                )
            elif referrer_phone and not partner.phone:
                partner.phone = referrer_phone
                partner.save(update_fields=["phone", "updated_at"])

            referral = ClientReferral.objects.create(
                client_user=client_user,
                client_name=client_name,
                client_email=client_email,
                partner=partner,
                source="staff",
                referred_by_text=referrer_name,
                notes=notes,
                created_by=request.user,
            )

        # If the client already paid in full for a program, the fee is due now.
        if client_user is not None:
            record_fees_for_existing_payments(client_user)

        self._notify(referral, request.user)
        return Response(_referral_data(referral), status=status.HTTP_201_CREATED)

    @staticmethod
    def _notify(referral, staff_user):
        try:
            from comms.models import Notification
            from comms.utils import send_ops_email

            message = (
                f"{_name(staff_user)} added a client referral: {referral.client_name} "
                f"({referral.client_email}) was referred by {referral.partner.name}"
                f"{' <' + referral.partner.email + '>' if referral.partner.email else ''} "
                f"({referral.partner.get_partner_type_display()}). The referral fee becomes due "
                "once the client pays in full for a program."
            )
            Notification.objects.bulk_create(
                [
                    Notification(user=admin, title="New client referral", message=message[:500], type="system", related_id=referral.id)
                    for admin in User.objects.filter(role="admin", is_active=True).exclude(id=staff_user.id)
                ]
            )
            send_ops_email("New client referral added", message)
        except Exception:
            logger.exception("Failed to notify about client referral %s", referral.id)


class StaffClientReferralDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSalesCoachOrAdmin]

    def delete(self, request, referral_id):
        if not referral_tables_ready():
            return Response({"error": SETUP_MESSAGE, "setupRequired": True}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        referral = get_object_or_404(_visible_referrals(request.user), id=referral_id)
        if referral.fees.exists():
            return Response(
                {"error": "This referral already has a referral fee, so it can't be removed. Ask an admin to void the fee."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        referral.delete()
        return Response({"message": "Referral removed."})
