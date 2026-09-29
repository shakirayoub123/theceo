from urllib.parse import urlencode

from django.conf import settings
from django.core import signing
from django.db.models import Q
from django.urls import reverse

from .models import EbookPurchase, Enrollment

DOWNLOAD_TOKEN_MAX_AGE_SECONDS = 60 * 5
EBOOK_DOWNLOAD_SALT = "lms.ebook.download"
NEWSLETTER_DOWNLOAD_SALT = "lms.newsletter.download"
PUBLIC_NEWSLETTER_VIEW_SALT = "lms.newsletter.public.view"
PUBLIC_EBOOK_COVER_VIEW_SALT = "lms.ebook.cover.public.view"
PUBLIC_NEWSLETTER_THUMBNAIL_VIEW_SALT = "lms.newsletter.thumbnail.public.view"


def build_signed_download_url(request, route_name, route_kwargs, token):
    query = urlencode({"token": token})
    path = f"{reverse(route_name, kwargs=route_kwargs)}?{query}"
    absolute_url = request.build_absolute_uri(path)

    # Behind reverse proxies, Django can sometimes build http:// URLs even when
    # the public site is https://. Force https for signed links in production.
    force_https = bool(getattr(settings, "FORCE_SIGNED_URL_HTTPS", False))
    if force_https and absolute_url.startswith("http://"):
        absolute_url = "https://" + absolute_url[len("http://") :]

    return absolute_url


def create_signed_download_token(user_id, resource_type, resource_id):
    salt = _salt_for_resource(resource_type)
    payload = {
        "resourceType": resource_type,
        "resourceId": str(resource_id),
        "userId": str(user_id),
    }
    return signing.dumps(payload, salt=salt)


def validate_signed_download_token(token, user_id, resource_type, resource_id):
    salt = _salt_for_resource(resource_type)
    max_age = int(
        getattr(settings, "SIGNED_DOWNLOAD_URL_TTL_SECONDS", DOWNLOAD_TOKEN_MAX_AGE_SECONDS)
    )
    try:
        payload = signing.loads(token, salt=salt, max_age=max_age)
    except signing.BadSignature:
        return False
    except signing.SignatureExpired:
        return False

    return (
        payload.get("resourceType") == resource_type
        and str(payload.get("resourceId")) == str(resource_id)
        and str(payload.get("userId")) == str(user_id)
    )


def create_public_newsletter_view_token(resource_id):
    payload = {
        "resourceType": "newsletter_view",
        "resourceId": str(resource_id),
    }
    return signing.dumps(payload, salt=PUBLIC_NEWSLETTER_VIEW_SALT)


def validate_public_newsletter_view_token(token, resource_id):
    max_age = int(
        getattr(settings, "SIGNED_DOWNLOAD_URL_TTL_SECONDS", DOWNLOAD_TOKEN_MAX_AGE_SECONDS)
    )
    try:
        payload = signing.loads(token, salt=PUBLIC_NEWSLETTER_VIEW_SALT, max_age=max_age)
    except signing.BadSignature:
        return False
    except signing.SignatureExpired:
        return False

    return (
        payload.get("resourceType") == "newsletter_view"
        and str(payload.get("resourceId")) == str(resource_id)
    )


def create_public_ebook_cover_view_token(resource_id):
    payload = {
        "resourceType": "ebook_cover_view",
        "resourceId": str(resource_id),
    }
    return signing.dumps(payload, salt=PUBLIC_EBOOK_COVER_VIEW_SALT)


def validate_public_ebook_cover_view_token(token, resource_id):
    max_age = int(
        getattr(settings, "SIGNED_DOWNLOAD_URL_TTL_SECONDS", DOWNLOAD_TOKEN_MAX_AGE_SECONDS)
    )
    try:
        payload = signing.loads(token, salt=PUBLIC_EBOOK_COVER_VIEW_SALT, max_age=max_age)
    except signing.BadSignature:
        return False
    except signing.SignatureExpired:
        return False

    return (
        payload.get("resourceType") == "ebook_cover_view"
        and str(payload.get("resourceId")) == str(resource_id)
    )


def create_public_newsletter_thumbnail_view_token(resource_id):
    payload = {
        "resourceType": "newsletter_thumbnail_view",
        "resourceId": str(resource_id),
    }
    return signing.dumps(payload, salt=PUBLIC_NEWSLETTER_THUMBNAIL_VIEW_SALT)


def validate_public_newsletter_thumbnail_view_token(token, resource_id):
    max_age = int(
        getattr(settings, "SIGNED_DOWNLOAD_URL_TTL_SECONDS", DOWNLOAD_TOKEN_MAX_AGE_SECONDS)
    )
    try:
        payload = signing.loads(
            token, salt=PUBLIC_NEWSLETTER_THUMBNAIL_VIEW_SALT, max_age=max_age
        )
    except signing.BadSignature:
        return False
    except signing.SignatureExpired:
        return False

    return (
        payload.get("resourceType") == "newsletter_thumbnail_view"
        and str(payload.get("resourceId")) == str(resource_id)
    )


def user_has_ebook_access(user, ebook):
    if not user or not user.is_authenticated:
        return False

    if _is_privileged_user(user):
        return True

    return EbookPurchase.objects.filter(
        ebook=ebook,
        status="completed",
    ).filter(
        Q(user=user) | Q(customer_email__iexact=user.email)
    ).exists()


def user_has_newsletter_access(user):
    if not user or not user.is_authenticated:
        return False

    if _is_privileged_user(user):
        return True

    has_paid_ebook = EbookPurchase.objects.filter(
        status="completed",
    ).filter(
        Q(user=user) | Q(customer_email__iexact=user.email)
    ).exists()
    has_enrollment = Enrollment.objects.filter(user=user).exists()
    return has_paid_ebook or has_enrollment


def _is_privileged_user(user):
    return bool(
        getattr(user, "is_superuser", False)
        or getattr(user, "is_staff", False)
        or getattr(user, "role", None) in {"admin", "trainer", "sales"}
    )


def _salt_for_resource(resource_type):
    if resource_type == "ebook":
        return EBOOK_DOWNLOAD_SALT
    if resource_type == "newsletter":
        return NEWSLETTER_DOWNLOAD_SALT
    raise ValueError(f"Unsupported resource type: {resource_type}")
