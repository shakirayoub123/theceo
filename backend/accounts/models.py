from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from tci_backend.otp_security import OTP_CODE_LENGTH, generate_secure_otp, normalize_otp


class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("trainer", "Trainer"),
        ("client", "Client"),
        ("sales", "Sales"),
    )
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="client")
    is_approved = models.BooleanField(default=False)  # For trainers
    is_suspended = models.BooleanField(default=False)  # For admin suspension
    email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=OTP_CODE_LENGTH, blank=True, null=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)
    sales_influencer_assigned = models.CharField(max_length=100, blank=True, null=True)

    payment_link_sent = models.BooleanField(default=False)
    payment_link_sent_at = models.DateTimeField(blank=True, null=True)
    stripe_payment_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["email"], name="unique_email"),
        ]

    def __str__(self):
        return f"{self.username} ({self.role})"

    def generate_otp(self):
        self.otp_code = generate_secure_otp()
        self.otp_expires_at = timezone.now() + timedelta(minutes=10)
        self.save()
        return self.otp_code

    def verify_otp(self, otp):
        if not self.otp_code or not self.otp_expires_at:
            return False

        if normalize_otp(self.otp_code) == normalize_otp(otp) and timezone.now() < self.otp_expires_at:
            self.otp_code = None
            self.otp_expires_at = None
            self.save()
            return True
        return False

    def generate_strong_password(self):
        """Generate a new strong password, set it, and return it once."""
        import random
        import string

        # Generate a 12-character password with mixed case, numbers, and symbols
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        password = "".join(random.choice(chars) for _ in range(12))

        # Ensure it contains at least one uppercase, one lowercase, one digit, and one symbol
        while (
            not any(c.isupper() for c in password)
            or not any(c.islower() for c in password)
            or not any(c.isdigit() for c in password)
            or not any(c in "!@#$%^&*" for c in password)
        ):
            password = "".join(random.choice(chars) for _ in range(12))

        self.set_password(password)
        self.save(update_fields=["password"])
        return password


class UserPermission(models.Model):
    PERMISSION_CHOICES = (
        # Client Management
        ("view_clients", "View Clients"),
        ("edit_client_details", "Edit Client Details"),
        ("delete_clients", "Delete Clients"),
        ("meet_clients", "Meet Clients"),
        # Program/Course Management
        ("view_programs", "View Programs"),
        ("create_programs", "Create Programs"),
        ("edit_programs", "Edit Programs"),
        ("delete_programs", "Delete Programs"),
        ("publish_programs", "Publish Programs"),
        # User Management
        ("view_users", "View Users"),
        ("create_users", "Create Users"),
        ("edit_users", "Edit Users"),
        ("delete_users", "Delete Users"),
        ("manage_roles", "Manage User Roles"),
        # Payment Management
        ("view_payments", "View Payments"),
        ("process_payments", "Process Payments"),
        ("refund_payments", "Refund Payments"),
        # Scheduling
        ("view_schedules", "View Schedules"),
        ("create_appointments", "Create Appointments"),
        ("edit_appointments", "Edit Appointments"),
        ("cancel_appointments", "Cancel Appointments"),
        # Communications
        ("view_communications", "View Communications"),
        ("send_notifications", "Send Notifications"),
        ("send_broadcasts", "Send Broadcast Emails"),
        # Analytics & Stats
        ("view_basic_stats", "View Basic Statistics"),
        ("view_critical_stats", "View Critical Statistics"),
        ("export_data", "Export Data"),
        # Compliance
        ("view_consents", "View Consents"),
        ("manage_consents", "Manage Consents"),
        ("view_audit_logs", "View Audit Logs"),
        # Chat System
        ("access_chat", "Access Chat System"),
        ("moderate_chat", "Moderate Chat"),
        # System Administration
        ("manage_settings", "Manage System Settings"),
        ("view_system_logs", "View System Logs"),
        ("backup_data", "Backup Data"),
    )

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="permissions"
    )
    # Client permissions
    view_clients = models.BooleanField(default=False)
    edit_client_details = models.BooleanField(default=False)
    delete_clients = models.BooleanField(default=False)
    meet_clients = models.BooleanField(default=False)

    # Program permissions
    view_programs = models.BooleanField(default=False)
    create_programs = models.BooleanField(default=False)
    edit_programs = models.BooleanField(default=False)
    delete_programs = models.BooleanField(default=False)
    publish_programs = models.BooleanField(default=False)

    # User permissions
    view_users = models.BooleanField(default=False)
    create_users = models.BooleanField(default=False)
    edit_users = models.BooleanField(default=False)
    delete_users = models.BooleanField(default=False)
    manage_roles = models.BooleanField(default=False)

    # Payment permissions
    view_payments = models.BooleanField(default=False)
    process_payments = models.BooleanField(default=False)
    refund_payments = models.BooleanField(default=False)

    # Scheduling permissions
    view_schedules = models.BooleanField(default=False)
    create_appointments = models.BooleanField(default=False)
    edit_appointments = models.BooleanField(default=False)
    cancel_appointments = models.BooleanField(default=False)

    # Communication permissions
    view_communications = models.BooleanField(default=False)
    send_notifications = models.BooleanField(default=False)
    send_broadcasts = models.BooleanField(default=False)

    # Analytics permissions
    view_basic_stats = models.BooleanField(default=False)
    view_critical_stats = models.BooleanField(default=False)
    export_data = models.BooleanField(default=False)

    # Compliance permissions
    view_consents = models.BooleanField(default=False)
    manage_consents = models.BooleanField(default=False)
    view_audit_logs = models.BooleanField(default=False)

    # Chat permissions
    access_chat = models.BooleanField(default=False)
    moderate_chat = models.BooleanField(default=False)

    # System permissions
    manage_settings = models.BooleanField(default=False)
    view_system_logs = models.BooleanField(default=False)
    backup_data = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Permissions for {self.user.username}"

    def set_default_permissions(self):
        """Set default permissions based on user role"""
        if self.user.role == "admin":
            # Admins get all permissions
            for field in self._meta.fields:
                if field.name.endswith("_permissions") or isinstance(
                    field, models.BooleanField
                ):
                    if field.name not in ["id", "user", "created_at", "updated_at"]:
                        setattr(self, field.name, True)
        elif self.user.role == "trainer":
            # Trainers get program and client related permissions
            self.view_clients = True
            self.edit_client_details = True
            self.meet_clients = True
            self.view_programs = True
            self.create_programs = True
            self.edit_programs = True
            self.view_schedules = True
            self.create_appointments = True
            self.edit_appointments = True
            self.access_chat = True
        elif self.user.role == "sales":
            # Sales get client and payment related permissions
            self.view_clients = True
            self.edit_client_details = True
            self.meet_clients = True
            self.view_payments = True
            self.view_basic_stats = True
            self.view_schedules = True
            self.create_appointments = True
            self.access_chat = True
        elif self.user.role == "client":
            # Clients get limited permissions
            self.view_programs = True
            self.view_schedules = True
            self.access_chat = True
            self.view_basic_stats = True

        self.save()
