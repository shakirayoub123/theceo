from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from tci_backend.otp_security import OTP_CODE_LENGTH, normalize_otp

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "confirm_password", "role"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        validated_data.pop("role", None)
        user = User.objects.create_user(role="client", **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        attrs["email"] = email

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("Invalid credentials")

        attrs["username"] = user.username
        return attrs


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    hasFullDashboardAccess = serializers.SerializerMethodField()
    dashboardAccessLevel = serializers.SerializerMethodField()
    clientProgramStatus = serializers.SerializerMethodField()
    clientContractStatus = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "name",
            "email",
            "role",
            "is_approved",
            "is_suspended",
            "email_verified",
            "hasFullDashboardAccess",
            "dashboardAccessLevel",
            "clientProgramStatus",
            "clientContractStatus",
        ]

    def _get_client_profile(self, obj):
        return getattr(obj, "client_profile", None)

    def get_name(self, obj):
        return obj.get_full_name().strip() or obj.username

    def get_hasFullDashboardAccess(self, obj):
        client_profile = self._get_client_profile(obj)
        return client_profile.has_full_dashboard_access if client_profile else True

    def get_dashboardAccessLevel(self, obj):
        client_profile = self._get_client_profile(obj)
        if not client_profile:
            return "full"
        return client_profile.dashboard_access_level

    def get_clientProgramStatus(self, obj):
        client_profile = self._get_client_profile(obj)
        return client_profile.program_status if client_profile else None

    def get_clientContractStatus(self, obj):
        client_profile = self._get_client_profile(obj)
        return client_profile.contract_status if client_profile else None


class TokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


# Password Management Serializers
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=OTP_CODE_LENGTH, min_length=OTP_CODE_LENGTH)

    def validate_otp(self, value):
        return normalize_otp(value)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=OTP_CODE_LENGTH, min_length=OTP_CODE_LENGTH)
    newPassword = serializers.CharField(validators=[validate_password])

    def validate_otp(self, value):
        return normalize_otp(value)
