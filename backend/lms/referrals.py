"""Referral partners and referral fees.

When a referred client's program payment is confirmed (paid in full), the person
who referred them earns a fee on the total price paid for that program:
  - TCI referral: 10%
  - Business referral partner: 15%
Referrals are added by admin (Referrals page) or by Sales/Coaching (Client
Referrals tab); the same percentages apply to both.

The system calculates and tracks fees; an admin marks each one paid after paying
the partner.
"""

import logging
from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from .models import ClientReferral, ReferralFee, ReferralPartner, StripePayment

logger = logging.getLogger(__name__)

CENT = Decimal("0.01")

REFERRAL_TABLES = {
    ReferralPartner._meta.db_table,
    ClientReferral._meta.db_table,
    ReferralFee._meta.db_table,
}

_ready_cache = {"ready": False}


def referral_tables_ready():
    """False until the referral migrations (lms 0037 + 0038) are applied to this database."""
    if _ready_cache["ready"]:
        return True
    from django.db import connection

    try:
        if not REFERRAL_TABLES.issubset(set(connection.introspection.table_names())):
            return False
        with connection.cursor() as cursor:
            columns = {
                c.name
                for c in connection.introspection.get_table_description(
                    cursor, ClientReferral._meta.db_table
                )
            }
        ready = {"client_email", "client_name"}.issubset(columns)
    except Exception:
        logger.exception("Could not check referral tables")
        return False
    _ready_cache["ready"] = ready
    return ready


def partner_types_data():
    return [
        {"value": value, "label": label, "percent": int(ReferralPartner.FEE_RATES[value] * 100)}
        for value, label in ReferralPartner.PARTNER_TYPE_CHOICES
    ]


def find_partner_for_text(text):
    """Match free-text 'Referred By' to an active partner by code, email or exact name."""
    value = (text or "").strip()
    if not value:
        return None
    return (
        ReferralPartner.objects.filter(is_active=True)
        .filter(
            Q(referral_code__iexact=value)
            | Q(email__iexact=value)
            | Q(name__iexact=value)
        )
        .order_by("id")
        .first()
    )


def get_or_match_client_referral(user):
    """Return the client's referral, auto-linking from their 'Referred By' text if possible."""
    existing = ClientReferral.objects.filter(client_user=user).select_related("partner").first()
    if existing:
        return existing

    # Referral added by Sales/Coaching before the client had an account.
    email = (user.email or "").strip()
    if email:
        with transaction.atomic():
            waiting = (
                ClientReferral.objects.select_for_update()
                .filter(client_user__isnull=True, client_email__iexact=email)
                .order_by("created_at")
                .first()
            )
            if waiting is not None:
                waiting.client_user = user
                waiting.save(update_fields=["client_user"])
                return waiting

    # Read the profile fresh: the instance cached on `user` can be stale.
    from people.models import Client

    referred_by = (
        Client.objects.filter(user=user).values_list("referred_by", flat=True).first() or ""
    ).strip()
    partner = find_partner_for_text(referred_by)
    if not partner:
        return None

    referral, _ = ClientReferral.objects.get_or_create(
        client_user=user,
        defaults={"partner": partner, "source": "auto", "referred_by_text": referred_by},
    )
    return referral


def is_program_payment(stripe_payment):
    """Program payments carry program/payment-link metadata; shop orders carry 'items'."""
    metadata = stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    if "items" in metadata:
        return False
    return True


def calculate_fee(amount_paid, partner):
    rate = partner.fee_rate
    return rate, (Decimal(str(amount_paid)) * rate).quantize(CENT, rounding=ROUND_HALF_UP)


def record_referral_fee(stripe_payment, user, service=None):
    """Create the referral fee for one confirmed program payment (idempotent).

    Returns the ReferralFee, or None if the client was not referred.
    """
    if stripe_payment is None or stripe_payment.status != "succeeded":
        return None
    if not is_program_payment(stripe_payment):
        return None
    if not referral_tables_ready():
        logger.warning("Referral tables missing (migration lms 0037 not applied); no fee recorded.")
        return None

    existing = ReferralFee.objects.filter(stripe_payment=stripe_payment).first()
    if existing:
        return existing

    referral = get_or_match_client_referral(user)
    if referral is None:
        return None

    partner = referral.partner
    metadata = stripe_payment.metadata if isinstance(stripe_payment.metadata, dict) else {}
    program_title = (service.title if service else metadata.get("program_title")) or ""
    rate, fee_amount = calculate_fee(stripe_payment.amount, partner)
    label = f"{int(rate * 100)}% of program price"

    with transaction.atomic():
        fee, created = ReferralFee.objects.get_or_create(
            stripe_payment=stripe_payment,
            defaults={
                "referral": referral,
                "partner": partner,
                "client_user": user,
                "program": service,
                "program_title": program_title,
                "amount_paid": stripe_payment.amount,
                "currency": stripe_payment.currency or "usd",
                "fee_rate": rate,
                "fee_amount": fee_amount,
                "fee_label": label,
            },
        )
    if created:
        _notify_admins_of_fee(fee)
    return fee


def record_fees_for_existing_payments(user):
    """Create fees for a client's already-confirmed program payments (e.g. after linking)."""
    from .models import Service

    fees = []
    for payment in StripePayment.objects.filter(user=user, status="succeeded"):
        metadata = payment.metadata if isinstance(payment.metadata, dict) else {}
        service = None
        program_id = metadata.get("program_id")
        if program_id:
            try:
                service = Service.objects.filter(id=program_id).first()
            except (ValueError, ValidationError):
                service = None
        fee = record_referral_fee(payment, user, service=service)
        if fee:
            fees.append(fee)
    return fees


def _notify_admins_of_fee(fee):
    try:
        from accounts.models import User
        from comms.models import Notification

        client_name = fee.client_user.get_full_name().strip() or fee.client_user.email
        message = (
            f"{fee.partner.name} earned a referral fee of ${fee.fee_amount} "
            f"({fee.fee_label or 'referral fee'}) for {client_name}'s program payment."
        )[:500]
        recipients = list(User.objects.filter(role="admin", is_active=True))
        creator = fee.referral.created_by
        if creator is not None and creator.is_active and creator not in recipients:
            recipients.append(creator)
        Notification.objects.bulk_create(
            [
                Notification(
                    user=admin,
                    title="Referral fee due",
                    message=message,
                    type="system",
                    related_id=fee.id,
                )
                for admin in recipients
            ]
        )
    except Exception:
        logger.exception("Failed to notify admins about referral fee %s", fee.id)
