import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import models
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from scheduling.models import Appointment
from authentication.jwt_cookies import set_jwt_cookies
from tci_backend.otp_security import (
    get_otp_lockout_remaining,
    normalize_otp,
    register_otp_failure,
    reset_otp_failures,
)
from .models import UserPermission
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    VerifyOTPSerializer,
    ResetPasswordSerializer,
    ClientDetailSerializer,
    UserPermissionSerializer,
    ModifyPermissionsSerializer,
)
from .permissions import IsAdmin, IsTrainerOwner, IsClientOwner, IsSales

User = get_user_model()
logger = logging.getLogger(__name__)


def _parse_positive_int(value):
    """Return a positive integer or None when value is invalid."""
    if isinstance(value, bool):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return Response(
            {"error": "Registration temporarily disabled for security maintenance"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        if user:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            response = Response(
                {
                    "status": "Login successful",
                    "user_id": user.id,
                    "access": access_token,
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK,
            )
            set_jwt_cookies(response, str(refresh))
            return response
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Forgot Password Flow
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
            otp = user.generate_otp()
            # Send OTP via email
            send_mail(
                "Password Reset OTP",
                f"Your OTP for password reset is: {otp}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            # Return a generic response to prevent user enumeration.
            pass

        return Response({"message": "If this email exists, an OTP has been sent"})


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        otp = normalize_otp(serializer.validated_data["otp"])

        if get_otp_lockout_remaining(email) > 0:
            return Response(
                {"error": "Too many invalid OTP attempts. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            user = User.objects.get(email__iexact=email)
            if user.verify_otp(otp):
                reset_otp_failures(email)
                return Response({"message": "OTP verified successfully"})
            else:
                _, is_locked = register_otp_failure(email)
                if is_locked:
                    return Response(
                        {"error": "Too many invalid OTP attempts. Please try again later."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                return Response(
                    {"error": "Invalid or expired OTP"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            _, is_locked = register_otp_failure(email)
            if is_locked:
                return Response(
                    {"error": "Too many invalid OTP attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "Invalid or expired OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        otp = normalize_otp(serializer.validated_data["otp"])
        new_password = serializer.validated_data["new_password"]

        if get_otp_lockout_remaining(email) > 0:
            return Response(
                {"error": "Too many invalid OTP attempts. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            user = User.objects.get(email__iexact=email)
            if user.verify_otp(otp):
                user.set_password(new_password)
                user.save()
                reset_otp_failures(email)
                return Response({"message": "Password reset successfully"})
            else:
                _, is_locked = register_otp_failure(email)
                if is_locked:
                    return Response(
                        {"error": "Too many invalid OTP attempts. Please try again later."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                return Response(
                    {"error": "Invalid or expired OTP"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            _, is_locked = register_otp_failure(email)
            if is_locked:
                return Response(
                    {"error": "Too many invalid OTP attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "Invalid or expired OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        # Use request to avoid linter warning
        _ = request
        # Get all clients
        clients = User.objects.filter(role="client")

        # Total clients
        total_clients = clients.count()

        # Active clients (logged in within last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        active_clients = clients.filter(last_login__gte=thirty_days_ago).count()

        # Clients awaiting purchase (enrolled but no completed payment)
        from lms.models import Enrollment
        from payments.models import Payment

        enrolled_clients = (
            Enrollment.objects.filter(user__role="client")
            .values_list("user", flat=True)
            .distinct()
        )

        clients_with_completed_payments = (
            Payment.objects.filter(user__role="client", status="completed")
            .values_list("user", flat=True)
            .distinct()
        )

        awaiting_purchase_clients = set(enrolled_clients) - set(
            clients_with_completed_payments
        )
        clients_awaiting_purchase = len(awaiting_purchase_clients)

        # New metrics
        from lms.models import (
            Referral,
            EbookPurchase,
            Blog,
            Newsletter,
            Service,
        )

        # Referrals
        total_users_via_referrals = Referral.objects.filter(is_converted=True).count()

        # Ebooks
        total_ebooks_sold = EbookPurchase.objects.count()
        products_revenue = (
            EbookPurchase.objects.aggregate(total=models.Sum("price_paid"))["total"]
            or 0
        )

        # Blogs and Newsletters views
        total_blogs_views = (
            Blog.objects.aggregate(total=models.Sum("views_count"))["total"] or 0
        )

        total_newsletters_views = (
            Newsletter.objects.aggregate(total=models.Sum("views_count"))["total"] or 0
        )

        # Services
        total_services = Service.objects.count()
        active_services = Service.objects.filter(status="active").count()
        archived_services = Service.objects.filter(status="archived").count()

        # Services revenue (completed payments)
        services_revenue = (
            Payment.objects.filter(status="completed").aggregate(
                total=models.Sum("amount")
            )["total"]
            or 0
        )

        return Response(
            {
                "totalClients": total_clients,
                "activeClients": active_clients,
                "clientsAwaitingPurchase": clients_awaiting_purchase,
                "totalUsersViaReferrals": total_users_via_referrals,
                "totalEbooksSold": total_ebooks_sold,
                "totalBlogsViews": total_blogs_views,
                "totalNewslettersViews": total_newsletters_views,
                "totalServices": total_services,
                "activeServices": active_services,
                "archivedServices": archived_services,
                "productsRevenue": float(products_revenue),
                "servicesRevenue": float(services_revenue),
            }
        )


class ClientDetailView(APIView):
    def get_permissions(self):
        """
        Dynamically set permissions based on user role
        """
        if self.request.user.role == "admin":
            return [IsAdmin()]
        elif self.request.user.role == "sales":
            return [IsSales()]
        elif self.request.user.role == "trainer":
            return [IsTrainerOwner()]
        elif self.request.user.role == "client":
            return [IsClientOwner()]
        return [permissions.IsAuthenticated()]

    def get(self, request, user_id: Optional[int] = None):
        # If no user_id provided, return current user's details
        if user_id is None:
            user = request.user
        else:
            parsed_user_id = _parse_positive_int(user_id)
            if parsed_user_id is None:
                return Response(
                    {"error": "Invalid user_id. It must be a positive integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check permissions for accessing other users' details
            try:
                user = User.objects.get(id=parsed_user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Role-based access control
            if request.user.role == "admin":
                # Admin can access any user's details
                pass
            elif request.user.role == "sales":
                # Sales can access client details
                if user.role != "client":
                    return Response(
                        {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                    )
            elif request.user.role == "trainer":
                # Trainer can only access their own details or their clients' details
                if (
                    user != request.user
                    and not Appointment.objects.filter(
                        trainer=request.user, client=user
                    ).exists()
                ):
                    return Response(
                        {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                    )
            elif request.user.role == "client":
                # Client can only access their own details
                if user != request.user:
                    return Response(
                        {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
                )

        serializer = ClientDetailSerializer(user)
        return Response(serializer.data)


# RBAC: Admin can suspend users, approve trainers
class SuspendUserView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, user_id: int):
        parsed_user_id = _parse_positive_int(user_id)
        if parsed_user_id is None:
            return Response(
                {"error": "Invalid user_id. It must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(User, id=parsed_user_id)
        if user == request.user:
            return Response(
                {"error": "Cannot suspend yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_suspended = True
        user.save()
        logger.info("User %s suspended by admin %s", user.id, request.user.id)
        return Response({"status": "User suspended"})


class ApproveTrainerView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, user_id: int):
        parsed_user_id = _parse_positive_int(user_id)
        if parsed_user_id is None:
            return Response(
                {"error": "Invalid user_id. It must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(User, id=parsed_user_id, role="trainer")
        user.is_approved = True
        user.save()
        logger.info("Trainer %s approved by admin %s", user.id, request.user.id)
        return Response({"status": "Trainer approved"})


# Email verification (stub)
class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Implement email verification logic here
        return Response({"status": "Email verified (stub)"})


class ModifyPermissionsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, user_id=None):
        """Get permissions for a specific user or all users"""
        if user_id:
            user = get_object_or_404(User, id=user_id)
            permissions = get_object_or_404(UserPermission, user=user)
            serializer = UserPermissionSerializer(permissions)
            return Response(serializer.data)
        else:
            # Get all user permissions
            permissions = UserPermission.objects.select_related("user").all()
            serializer = UserPermissionSerializer(permissions, many=True)
            return Response(serializer.data)

    def put(self, request):
        """Modify permissions for a user"""
        serializer = ModifyPermissionsSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data["user_id"]
            permissions_data = serializer.validated_data["permissions"]

            user = get_object_or_404(User, id=user_id)
            user_permissions, created = UserPermission.objects.get_or_create(user=user)

            # Update permissions
            for permission, value in permissions_data.items():
                if hasattr(user_permissions, permission):
                    setattr(user_permissions, permission, value)

            user_permissions.save()

            # Return updated permissions
            response_serializer = UserPermissionSerializer(user_permissions)
            return Response(
                {
                    "message": "Permissions updated successfully",
                    "permissions": response_serializer.data,
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetUserPermissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's permissions"""
        try:
            permissions = request.user.permissions
            serializer = UserPermissionSerializer(permissions)
            return Response(serializer.data)
        except UserPermission.DoesNotExist:
            return Response(
                {"error": "Permissions not found"}, status=status.HTTP_404_NOT_FOUND
            )
