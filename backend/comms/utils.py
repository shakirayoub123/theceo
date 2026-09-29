"""Small helpers for outbound email and in-app notifications."""

import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Notification

logger = logging.getLogger(__name__)

INFO_EMAIL = "info@theceoinfluencers.com"
SALES_EMAIL = "sales@theceoinfluencers.com"
NEW_CLIENT_SIGNUP_EMAILS = (
    "james.armstrong@theceoinfluencers.com",
    "claire.keogh@theceoinfluencers.com",
)
PAYMENT_CONFIRMATION_EMAILS = (
    SALES_EMAIL,
    INFO_EMAIL,
)


def _normalize_recipients(recipient_list):
    if recipient_list is None:
        return []

    if isinstance(recipient_list, str):
        raw_recipients = recipient_list.split(",")
    else:
        raw_recipients = list(recipient_list)

    recipients = []
    seen = set()
    for recipient in raw_recipients:
        email = str(recipient or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        recipients.append(email)
    return recipients


def get_configured_recipients(setting_name, default_recipients):
    recipients = _normalize_recipients(getattr(settings, setting_name, default_recipients))
    return recipients or _normalize_recipients(default_recipients)


def send_internal_email(
    subject: str,
    message: str,
    *,
    recipient_list,
    fail_silently: bool = True,
) -> bool:
    recipients = _normalize_recipients(recipient_list)
    if not recipients:
        logger.warning(
            "Skipping email '%s' because no recipients were configured.", subject
        )
        return False

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=recipients,
            fail_silently=fail_silently,
        )
        logger.info("Sent email '%s' to %s", subject, recipients)
        return True
    except Exception as exc:  # pragma: no cover - defensive logging only
        logger.error("Failed to send email '%s': %s", subject, exc, exc_info=True)
        if not fail_silently:
            raise
        return False


def send_ops_email(subject: str, message: str, *, fail_silently: bool = True) -> bool:
    """Send a lightweight notification to the configured ops inbox."""

    return send_internal_email(
        subject=subject,
        message=message,
        recipient_list=get_configured_recipients(
            "OPS_NOTIFICATION_EMAILS", [INFO_EMAIL]
        ),
        fail_silently=fail_silently,
    )


def create_notifications(
    users,
    title: str,
    message: str,
    *,
    notification_type: str = "system",
    related_id=None,
):
    unique_users = []
    seen_user_ids = set()

    for user in users or []:
        user_id = getattr(user, "id", None)
        if not user_id or user_id in seen_user_ids:
            continue
        seen_user_ids.add(user_id)
        unique_users.append(user)

    if not unique_users:
        return 0

    Notification.objects.bulk_create(
        [
            Notification(
                user=user,
                title=title,
                message=message,
                type=notification_type,
                related_id=related_id,
            )
            for user in unique_users
        ]
    )
    return len(unique_users)
