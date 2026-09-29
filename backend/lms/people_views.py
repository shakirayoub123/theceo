import mimetypes
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from comms.utils import send_ops_email

from .models import Ebook, EbookEmailDownloadLink, EbookPurchase, EbookSeries, Service
from .serializers import ClientEbookSerializer, ClientProgramSerializer

logger = logging.getLogger(__name__)


def build_email_download_url(request, download_token):
    absolute_url = request.build_absolute_uri(
        reverse(
            "people-ebook-email-download",
            kwargs={"download_token": str(download_token)},
        )
    )
    if (
        getattr(settings, "FORCE_SIGNED_URL_HTTPS", False)
        and absolute_url.startswith("http://")
    ):
        absolute_url = "https://" + absolute_url[len("http://") :]
    return absolute_url


class PeopleEbooksView(APIView):
    """
    GET /api/lms/people/ebooks/ - Get all ebooks for public consumption
    No authentication required
    """

    permission_classes = [AllowAny]
    throttle_scope = "public"

    def get(self, request):
        # Get all active ebooks
        ebooks = Ebook.objects.filter(status="active").order_by("-created_at")
        serializer = ClientEbookSerializer(
            ebooks, many=True, context={"request": request}
        )

        response = Response({"ebooks": serializer.data}, status=status.HTTP_200_OK)
        # Response contains short-lived signed media links.
        response["Cache-Control"] = "no-store, max-age=0"
        return response


class PeopleEbooksBySeriesView(APIView):
    """
    GET /api/lms/people/series/ebooks/<series_id>/ - Get ebooks in a specific series for public consumption
    No authentication required
    """

    permission_classes = [AllowAny]
    throttle_scope = "public"

    def get(self, request, series_id):
        try:
            # First verify the series exists
            series = EbookSeries.objects.get(id=series_id)

            # Get all active ebooks in this series
            ebooks = Ebook.objects.filter(series=series, status="active").order_by(
                "created_at"
            )

            # Serialize the ebooks
            serializer = ClientEbookSerializer(
                ebooks, many=True, context={"request": request}
            )

            # Prepare response with series info and ebooks
            series_data = {
                "series": {
                    "id": str(series.id),
                    "title": series.title,
                    "description": series.description,
                    "coverImage": (
                        series.cover_image.url if series.cover_image else None
                    ),
                    "ebooksCount": series.ebooks_count,
                    "createdAt": series.created_at.isoformat(),
                },
                "ebooks": serializer.data,
            }

            response = Response(series_data, status=status.HTTP_200_OK)
            # Response contains short-lived signed media links.
            response["Cache-Control"] = "no-store, max-age=0"
            return response

        except EbookSeries.DoesNotExist:
            return Response(
                {"error": "Series not found"}, status=status.HTTP_404_NOT_FOUND
            )


class PeopleEbookDetailView(APIView):
    """
    GET /api/lms/people/ebook/<ebook_id>/ - Get details of a specific ebook for public consumption
    No authentication required
    """

    permission_classes = [AllowAny]
    throttle_scope = "public"

    def get(self, request, ebook_id):
        try:
            # Get the ebook if it's active
            ebook = Ebook.objects.get(id=ebook_id, status="active")

            # Serialize the ebook data
            serializer = ClientEbookSerializer(ebook, context={"request": request})

            response = Response(serializer.data, status=status.HTTP_200_OK)
            # Response contains short-lived signed media links.
            response["Cache-Control"] = "no-store, max-age=0"
            return response

        except Ebook.DoesNotExist:
            return Response(
                {"error": "Ebook not found"}, status=status.HTTP_404_NOT_FOUND
            )


class PeopleCheckoutView(APIView):
    """
    POST /api/lms/people/checkout/ - Process checkout for ebooks
    No authentication required
    """

    permission_classes = [AllowAny]
    throttle_scope = "public_checkout"

    def post(self, request):
        from django.contrib.auth import get_user_model
        from .serializers import PeopleCheckoutEbookSerializer
        import uuid

        User = get_user_model()

        serializer = PeopleCheckoutEbookSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Extract validated data
        customer_name = serializer.validated_data.get("customerName")
        customer_email = serializer.validated_data.get("customerEmail")
        customer_phone = serializer.validated_data.get("customerPhone", "")
        ebook_ids = serializer.validated_data.get("ebooks", [])

        # Check if user exists with this email
        user = None
        try:
            user = User.objects.get(email=customer_email)
        except User.DoesNotExist:
            # Continue with guest checkout
            pass

        # Validate all ebooks exist and are active
        ebooks = []
        total_price = 0
        invalid_ebooks = []

        for ebook_id in ebook_ids:
            try:
                ebook = Ebook.objects.get(id=ebook_id, status="active")
                ebooks.append(ebook)
                total_price += ebook.price
            except Ebook.DoesNotExist:
                invalid_ebooks.append(str(ebook_id))

        if invalid_ebooks:
            return Response(
                {
                    "error": f"The following ebooks were not found or are not available: {', '.join(invalid_ebooks)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate a unique order ID for grouping purchases
        order_id = uuid.uuid4()

        # Create purchases for each ebook
        purchases = []
        for ebook in ebooks:
            purchase = EbookPurchase.objects.create(
                ebook=ebook,
                user=user,  # Will be None for guest checkouts
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                price_paid=ebook.price,
                order_id=order_id,
                status="completed",
            )
            purchases.append(purchase)

        email_download_links = []
        for purchase in purchases:
            download_link = EbookEmailDownloadLink.objects.create(purchase=purchase)
            email_download_links.append(
                (
                    purchase.ebook.title,
                    build_email_download_url(request, download_link.token),
                )
            )

        # Ops email for guest/ebook checkout
        send_ops_email(
            subject="Ebook Order Created",
            message=(
                f"Customer: {customer_name} <{customer_email}>\n"
                f"Order ID: {order_id}\n"
                f"Total: ${total_price}\n"
                f"Items: {[p.ebook.title for p in purchases]}"
            ),
        )

        # Send a customer-facing thank-you email after successful purchase.
        if customer_email:
            try:
                purchased_titles = ", ".join([p.ebook.title for p in purchases])
                download_links_text = "\n".join(
                    [
                        f"- {ebook_title}: {download_url}"
                        for ebook_title, download_url in email_download_links
                    ]
                )
                send_mail(
                    subject="Thank you for your purchase - The CEO Influencers",
                    message=(
                        f"Hi {customer_name},\n\n"
                        "Thank you for your purchase.\n"
                        f"Order ID: {order_id}\n"
                        f"Total: ${total_price}\n"
                        f"Items: {purchased_titles}\n\n"
                        "Your ebook download link"
                        f"{'s' if len(email_download_links) > 1 else ''}:\n"
                        f"{download_links_text}\n\n"
                        "Each link is a one-time download only. After it is used once, it will no longer work.\n\n"
                        "We appreciate your support.\n\n"
                        "Best regards,\n"
                        "The CEO Influencers Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[customer_email],
                    fail_silently=True,
                )
            except Exception:
                logger.exception(
                    "Failed to send checkout thank-you email for order %s",
                    order_id,
                )

        # Create response
        response_data = {
            "message": "Order created successfully",
            "orderId": str(order_id),
            "totalAmount": float(total_price),
            "orderTotal": float(total_price),
            "customerName": customer_name,
            "customerEmail": customer_email,
            "items": [
                {
                    "ebookId": str(purchase.ebook.id),
                    "title": purchase.ebook.title,
                    "price": float(purchase.price_paid),
                }
                for purchase in purchases
            ],
        }

        return Response(response_data, status=status.HTTP_201_CREATED)


class PeopleEbookEmailDownloadView(APIView):
    """GET /api/lms/people/ebook-download/<download_token>/ - One-time ebook download link"""

    permission_classes = [AllowAny]
    throttle_scope = "download"

    def get(self, request, download_token):
        with transaction.atomic():
            download_link = get_object_or_404(
                EbookEmailDownloadLink.objects.select_for_update().select_related(
                    "purchase__ebook"
                ),
                token=download_token,
            )

            if download_link.used_at is not None:
                return Response(
                    {"error": "This download link has already been used"},
                    status=status.HTTP_410_GONE,
                )

            purchase = download_link.purchase
            ebook = purchase.ebook

            if purchase.status != "completed":
                return Response(
                    {"error": "This download link is not available"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if ebook.status != "active":
                return Response(
                    {"error": "Ebook not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not ebook.file:
                return Response(
                    {"error": "Ebook file is not available"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            download_link.used_at = timezone.now()
            download_link.save(update_fields=["used_at"])

        filename = ebook.file.name.rsplit("/", 1)[-1] or f"{ebook.title}.pdf"
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            ebook.file.open("rb"),
            as_attachment=True,
            filename=filename,
            content_type=content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store, max-age=0"
        return response


class PeopleProgramsView(APIView):
    """
    GET /api/lms/people/programs/ - Get all programs for public consumption
    No authentication required
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # Get all active programs
        programs = Service.objects.filter(status="active").order_by(
            "order"
        )
        serializer = ClientProgramSerializer(
            programs, many=True, context={"request": request}
        )

        return Response({"programs": serializer.data}, status=status.HTTP_200_OK)


class PeopleServiceDetailView(APIView):
    """
    GET /api/lms/people/service/<service_id>/ - Get public details of a specific service/program
    No authentication required
    """

    permission_classes = [AllowAny]

    def get(self, request, service_id):
        try:
            # Only expose active, published services publicly
            service = Service.objects.get(
                id=service_id, status="active"
            )
        except Service.DoesNotExist:
            return Response(
                {"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ClientProgramSerializer(service, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
