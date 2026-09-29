from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import LimitOffsetPagination
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationCountSerializer,
    EmailSerializer,
    ContactFormSerializer,
)


class NotificationCountView(APIView):
    """
    GET /api/auth/notifications/count/
    Returns the count of unread notifications for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()

        serializer = NotificationCountSerializer({"count": unread_count})
        return Response(serializer.data)


class NotificationListView(APIView, LimitOffsetPagination):
    """
    GET /api/auth/notifications/
    Returns paginated list of notifications for the authenticated user.
    """

    permission_classes = [IsAuthenticated]
    default_limit = 20
    max_limit = 50

    def get(self, request):
        # Get optional status filter
        status_filter = request.query_params.get("status", "all")

        # Base queryset
        queryset = Notification.objects.filter(user=request.user).order_by(
            "-created_at"
        )

        # Apply status filter if not 'all'
        if status_filter == "unread":
            queryset = queryset.filter(is_read=False)
        elif status_filter == "read":
            queryset = queryset.filter(is_read=True)

        # Apply pagination
        results = self.paginate_queryset(queryset, request, view=self)
        serializer = NotificationSerializer(results, many=True)

        return self.get_paginated_response(serializer.data)


class MarkAllNotificationsReadView(APIView):
    """
    POST /api/auth/notifications/mark-all-read/
    Marks all unread notifications as read for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Get unread notifications for the user
        notifications = Notification.objects.filter(user=request.user, is_read=False)

        # Get count before update
        updated_count = notifications.count()

        # Update all to read
        notifications.update(is_read=True)

        return Response(
            {
                "message": "All notifications marked as read",
                "updated_count": updated_count,
            }
        )


class MarkNotificationReadView(APIView):
    """
    POST /api/auth/notifications/{id}/mark-read/
    Marks a specific notification as read.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        # Get notification or return 404
        notification = get_object_or_404(Notification, id=notification_id)

        # Check if notification belongs to user
        if notification.user != request.user:
            return Response(
                {"error": "Permission denied", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Mark as read if not already
        if not notification.is_read:
            notification.is_read = True
            notification.save()

        return Response(
            {
                "message": "Notification marked as read",
                "notification_id": notification.id,
            }
        )


class SendEmailView(APIView):
    """
    POST /api/comms/email/
    Sends an email to info@theceoinfluencers.com with the provided subject and body.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.validated_data["subject"]
            body = serializer.validated_data["body"]
            subscriber_email = serializer.validated_data.get("subscriber_email")
            recipient = "info@theceoinfluencers.com"

            try:
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=None,  # Uses DEFAULT_FROM_EMAIL
                    recipient_list=[recipient],
                    fail_silently=False,
                )

                if subscriber_email:
                    send_mail(
                        subject="Thanks for subscribing to The CEO Influencers",
                        message=(
                            "Thank you for subscribing to our newsletter.\n\n"
                            "You'll receive the latest leadership insights, updates, and resources straight to your inbox.\n\n"
                            "If you have any questions, reply to this email and our team will assist you."
                        ),
                        from_email=None,
                        recipient_list=[subscriber_email],
                        fail_silently=False,
                    )
                return Response(
                    {"message": "Email sent successfully"}, status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactFormView(APIView):
    """
    POST /api/comms/contact/
    Public contact form endpoint:
    1) sends the submission to info@theceoinfluencers.com
    2) sends an acknowledgement to the sender
    """

    permission_classes = [AllowAny]
    throttle_scope = "public"

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data["name"].strip()
        email = serializer.validated_data["email"].strip()
        message = serializer.validated_data["message"].strip()

        try:
            send_mail(
                subject=f"New Contact Form Submission from {name}",
                message=(
                    f"Name: {name}\n"
                    f"Email: {email}\n\n"
                    f"Message:\n{message}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=["info@theceoinfluencers.com"],
                fail_silently=False,
            )

            send_mail(
                subject="We received your message - The CEO Influencers",
                message=(
                    f"Hi {name},\n\n"
                    "Thank you for contacting The CEO Influencers.\n"
                    "We received your message and will get back to you shortly.\n\n"
                    "Best regards,\n"
                    "The CEO Influencers Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "Contact request sent successfully"},
            status=status.HTTP_200_OK,
        )
