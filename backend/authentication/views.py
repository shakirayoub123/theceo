import logging
import time

from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    VerifyOTPSerializer,
    ResetPasswordSerializer,
)
from .permissions import IsAdmin
from .models import OTP
from .jwt_cookies import set_jwt_cookies
from .security import (
    get_login_lockout_remaining,
    is_login_captcha_required,
    register_login_failure,
    reset_login_failures,
    verify_login_captcha,
)
from .throttles import ForgotPasswordEmailThrottle, LoginEmailThrottle
from tci_backend.throttling import (
    BurstRateThrottle,
    GlobalAllowAnyRateThrottle,
    SustainedRateThrottle,
)
from tci_backend.otp_security import (
    get_otp_lockout_remaining,
    normalize_otp,
    register_otp_failure,
    reset_otp_failures,
)

User = get_user_model()
logger = logging.getLogger(__name__)
FORGOT_PASSWORD_GENERIC_MESSAGE = (
    "If an account exists with this email, an OTP has been sent."
)


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
    throttle_classes = [
        BurstRateThrottle,
        SustainedRateThrottle,
        GlobalAllowAnyRateThrottle,
        LoginEmailThrottle,
    ]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = request.data.get("password", "")
        captcha_token = request.data.get("captchaToken") or request.data.get(
            "captcha_token"
        )

        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lockout_remaining = get_login_lockout_remaining(email)
        if lockout_remaining > 0:
            response = Response(
                {
                    "error": "Too many failed login attempts. Please try again later.",
                    "retryAfter": lockout_remaining,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            response["Retry-After"] = str(lockout_remaining)
            return response

        if is_login_captcha_required(email):
            client_ip = self._get_client_ip(request)
            if not verify_login_captcha(captcha_token, client_ip):
                failure_state = register_login_failure(email)
                self._apply_backoff(failure_state["backoff_delay_seconds"])

                if failure_state["is_locked"]:
                    lockout_remaining = get_login_lockout_remaining(email)
                    response = Response(
                        {
                            "error": "Too many failed login attempts. Please try again later.",
                            "retryAfter": lockout_remaining,
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                    response["Retry-After"] = str(lockout_remaining)
                    return response

                return Response(
                    {
                        "error": "CAPTCHA verification failed",
                        "captchaRequired": True,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            failure_state = register_login_failure(email)
            self._apply_backoff(failure_state["backoff_delay_seconds"])

            if failure_state["is_locked"]:
                lockout_remaining = get_login_lockout_remaining(email)
                response = Response(
                    {
                        "error": "Too many failed login attempts. Please try again later.",
                        "retryAfter": lockout_remaining,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
                response["Retry-After"] = str(lockout_remaining)
                return response

            return Response(
                {
                    "error": "Invalid credentials",
                    "captchaRequired": failure_state["captcha_required"],
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.is_suspended:
            return Response(
                {"error": "This account is suspended. Please contact support."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == "trainer" and not user.is_approved:
            return Response(
                {"error": "Trainer account is pending approval."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response(
                {"error": "This account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        reset_login_failures(email)
        refresh = RefreshToken.for_user(user)
        response = Response(
            {"status": "Login successful", "user_id": user.id},
            status=status.HTTP_200_OK,
        )
        set_jwt_cookies(response, str(refresh))
        return response

    @staticmethod
    def _apply_backoff(delay_seconds):
        if delay_seconds > 0:
            time.sleep(delay_seconds)

    @staticmethod
    def _get_client_ip(request):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Password Management Views
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [
        BurstRateThrottle,
        SustainedRateThrottle,
        GlobalAllowAnyRateThrottle,
        ForgotPasswordEmailThrottle,
    ]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        user_exists = User.objects.filter(email__iexact=email).exists()
        if user_exists:
            # Prevent OTP bloat by replacing any still-unused OTPs.
            OTP.objects.filter(email=email, is_used=False).delete()
            otp_obj = OTP.objects.create(email=email)

            try:
                send_mail(
                    "Password Reset OTP",
                    f"Your OTP for password reset is: {otp_obj.otp}. This OTP will expire in 10 minutes.",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("Failed to send forgot-password OTP email.")

        return Response({"message": FORGOT_PASSWORD_GENERIC_MESSAGE})


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        otp_code = normalize_otp(serializer.validated_data["otp"])

        if get_otp_lockout_remaining(email) > 0:
            return Response(
                {"error": "Too many invalid OTP attempts. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            otp_obj = OTP.objects.get(
                email=email, otp=otp_code, is_used=False, expires_at__gt=timezone.now()
            )
            otp_obj.is_used = True
            otp_obj.save(update_fields=["is_used"])
            reset_otp_failures(email)
            return Response({"message": "OTP verified successfully"})
        except OTP.DoesNotExist:
            _, is_locked = register_otp_failure(email)
            if is_locked:
                return Response(
                    {"error": "Too many invalid OTP attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
            )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        otp_code = normalize_otp(serializer.validated_data["otp"])
        new_password = serializer.validated_data["newPassword"]

        if get_otp_lockout_remaining(email) > 0:
            return Response(
                {"error": "Too many invalid OTP attempts. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            # Verify OTP was used recently (within the same request flow)
            otp_obj = OTP.objects.get(
                email=email, otp=otp_code, is_used=True, expires_at__gt=timezone.now()
            )

            # Update user password
            user = User.objects.get(email__iexact=email)
            user.set_password(new_password)
            user.save()

            # Clean up used OTP
            otp_obj.delete()
            reset_otp_failures(email)

            return Response({"message": "Password reset successfully"})
        except (OTP.DoesNotExist, User.DoesNotExist):
            _, is_locked = register_otp_failure(email)
            if is_locked:
                return Response(
                    {"error": "Too many invalid OTP attempts. Please try again later."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
            )


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
