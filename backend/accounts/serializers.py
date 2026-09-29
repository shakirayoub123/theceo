from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from tci_backend.otp_security import OTP_CODE_LENGTH, normalize_otp
from .models import UserPermission

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "is_approved",
            "is_suspended",
            "email_verified",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False)  # Make username optional

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")

    def create(self, validated_data):
        validated_data.pop("role", None)
        username = validated_data.get("username", validated_data["email"])
        password = validated_data["password"]
        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=password,
            role="client",
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")
        if email and password:
            user = User.objects.filter(email__iexact=email).first()
            if not user or not user.check_password(password):
                raise serializers.ValidationError("Invalid credentials")
            if user.is_suspended:
                raise serializers.ValidationError(
                    "This account is suspended. Please contact support."
                )
            if user.role == "trainer" and not user.is_approved:
                raise serializers.ValidationError("Trainer account is pending approval.")
            client_profile = getattr(user, "client_profile", None)
            if (
                user.role == "client"
                and client_profile is not None
                and not client_profile.has_full_dashboard_access
            ):
                raise serializers.ValidationError(
                    "You are not a confirmed client yet."
                )
            if not user.is_active:
                raise serializers.ValidationError("This account is inactive.")
            attrs["email"] = email
            attrs["user"] = user
            return attrs
        raise serializers.ValidationError("Email and password are required")


class TokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=OTP_CODE_LENGTH, min_length=OTP_CODE_LENGTH)

    def validate_otp(self, value):
        return normalize_otp(value)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=OTP_CODE_LENGTH, min_length=OTP_CODE_LENGTH)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def validate_otp(self, value):
        return normalize_otp(value)


class ClientSerializer(serializers.ModelSerializer):
    programs_enrolled = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "programs_enrolled",
            "status",
            "last_login",
        )

    def get_programs_enrolled(self, obj):
        from lms.models import Enrollment

        enrollments = Enrollment.objects.filter(user=obj).select_related("service")
        return [enrollment.service.title for enrollment in enrollments]

    def get_status(self, obj):
        if obj.is_suspended:
            return "suspended"
        elif obj.last_login and (timezone.now() - obj.last_login).days <= 30:
            return "active"
        else:
            return "inactive"


class UserPermissionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = UserPermission
        fields = "__all__"

    def get_user_details(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email,
            "role": obj.user.role,
        }


class ModifyPermissionsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    permissions = serializers.DictField()

    def validate_permissions(self, value):
        # Validate that all permission keys are valid
        valid_permissions = [
            "view_clients",
            "edit_client_details",
            "delete_clients",
            "meet_clients",
            "view_programs",
            "create_programs",
            "edit_programs",
            "delete_programs",
            "publish_programs",
            "view_users",
            "create_users",
            "edit_users",
            "delete_users",
            "manage_roles",
            "view_payments",
            "process_payments",
            "refund_payments",
            "view_schedules",
            "create_appointments",
            "edit_appointments",
            "cancel_appointments",
            "view_communications",
            "send_notifications",
            "send_broadcasts",
            "view_basic_stats",
            "view_critical_stats",
            "export_data",
            "view_consents",
            "manage_consents",
            "view_audit_logs",
            "access_chat",
            "moderate_chat",
            "manage_settings",
            "view_system_logs",
            "backup_data",
        ]

        for key in value.keys():
            if key not in valid_permissions:
                raise serializers.ValidationError(f"Invalid permission: {key}")

        return value


class ClientSerializer(serializers.ModelSerializer):
    services_enrolled = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "services_enrolled",
            "status",
            "last_login",
        )

    def get_services_enrolled(self, obj):
        from lms.models import Enrollment

        enrollments = Enrollment.objects.filter(user=obj).select_related("service")
        return [enrollment.service.title for enrollment in enrollments]

    def get_status(self, obj):
        if obj.is_suspended:
            return "suspended"
        elif obj.last_login and (timezone.now() - obj.last_login).days <= 30:
            return "active"
        else:
            return "inactive"


class ClientDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="username")
    joinedOn = serializers.DateTimeField(source="date_joined")
    meetings = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    enrolledPrograms = serializers.SerializerMethodField()
    formAnswers = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    jobTitle = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    industry = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "name",
            "joinedOn",
            "email",
            "sales_influencer_assigned",
            "phone",
            "address",
            "jobTitle",
            "position",
            "industry",
            "meetings",
            "permissions",
            "enrolledPrograms",
            "formAnswers",
        )

    def get_meetings(self, obj):
        from scheduling.models import Appointment

        appointments = Appointment.objects.filter(client=obj).select_related("trainer")
        return [
            {
                "name": f"Meeting with {appointment.trainer.username}",
                "date": appointment.scheduled_at,
                "status": appointment.status,
                "uuid": str(appointment.id),
            }
            for appointment in appointments
        ]

    def get_permissions(self, obj):
        # Return permissions based on role
        base_permissions = ["view_profile", "edit_profile"]

        role_permissions = {
            "admin": [
                "manage_users",
                "view_reports",
                "manage_system",
                "approve_trainers",
                "suspend_users",
            ],
            "trainer": [
                "create_courses",
                "manage_students",
                "view_own_courses",
                "schedule_meetings",
            ],
            "client": [
                "view_enrolled_courses",
                "access_personal_data",
                "book_appointments",
            ],
            "sales": [
                "view_clients",
                "manage_leads",
                "view_sales_reports",
                "assign_influencers",
            ],
        }

        return base_permissions + role_permissions.get(obj.role, [])

    def get_enrolledPrograms(self, obj):
        from lms.models import Enrollment

        enrollments = Enrollment.objects.filter(user=obj).select_related("service")
        return [
            {
                "programId": str(enrollment.service.id),
                "programName": enrollment.service.title,
                "enrolledAt": enrollment.enrolled_at,
                "completed": enrollment.completed,
                "status": enrollment.service.status,
            }
            for enrollment in enrollments
        ]

    def get_formAnswers(self, obj):
        from lms.models import ClientFormAnswers

        form_answers = ClientFormAnswers.objects.filter(user_email=obj.email).order_by(
            "-created_at"
        )

        return [
            {
                "questionnaireTitle": answer.questionnaire_title,
                "data": answer.data,
                "createdAt": answer.created_at,
                "updatedAt": answer.updated_at,
            }
            for answer in form_answers
        ]

    def _get_client_profile(self, obj):
        return getattr(obj, "client_profile", None)

    def get_phone(self, obj):
        client = self._get_client_profile(obj)
        return client.phone if client else None

    def get_address(self, obj):
        client = self._get_client_profile(obj)
        return client.address if client else None

    def get_jobTitle(self, obj):
        client = self._get_client_profile(obj)
        return client.job_title if client else None

    def get_position(self, obj):
        client = self._get_client_profile(obj)
        return client.position if client else None

    def get_industry(self, obj):
        client = self._get_client_profile(obj)
        return client.industry if client else None
