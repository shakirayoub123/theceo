from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import secrets
import string

User = get_user_model()


class Lead(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("contacted", "Contacted"),
        ("qualified", "Qualified"),
        ("meeting_scheduled", "Meeting Scheduled"),
        ("meeting_completed", "Meeting Completed"),
        ("converted", "Converted to Client"),
        ("lost", "Lost"),
    )

    MEETING_STATUS_CHOICES = (
        ("pending_approval", "Pending Approval"),
        ("approved", "Approved"),
        ("rescheduled", "Rescheduled"),
        ("cancelled", "Cancelled"),
    )

    # Basic lead information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)

    # Meeting scheduling
    requested_meeting_date = models.DateField()
    requested_meeting_time = models.TimeField()
    meeting_status = models.CharField(
        max_length=20, choices=MEETING_STATUS_CHOICES, default="pending_approval"
    )
    approved_meeting_date = models.DateField(null=True, blank=True)
    approved_meeting_time = models.TimeField(null=True, blank=True)

    # Access code for assessment
    access_code = models.CharField(max_length=10, unique=True, blank=True)
    access_code_used = models.BooleanField(default=False)

    # Lead status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    assigned_sales = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    # Payment tracking
    payment_link_sent = models.BooleanField(default=False)
    payment_link_sent_at = models.DateTimeField(null=True, blank=True)
    payment_completed = models.BooleanField(default=False)
    payment_completed_at = models.DateTimeField(null=True, blank=True)
    stripe_payment_id = models.CharField(max_length=100, blank=True, null=True)

    # Notes and follow-up
    notes = models.TextField(blank=True)
    last_contacted = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.status}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def generate_access_code(self):
        """Generate a unique 8-character access code"""
        while True:
            code = "".join(
                secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)
            )
            if not Lead.objects.filter(access_code=code).exists():
                self.access_code = code
                self.save()
                return code

    def send_access_code_email(self):
        """Send access code email to lead"""
        from django.core.mail import send_mail
        from django.conf import settings

        subject = "Your Assessment Access Code"
        message = f"""
        Hi {self.first_name},

        Thank you for your interest in The CEO Influencers.

        Your access code to complete the assessment is: {self.access_code}

        Please use this code to sign in to our assessment portal and complete your assessment.

        Best regards,
        The CEO Influencers Team
        """

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [self.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send email to {self.email}: {e}")
            return False

    def convert_to_client(self):
        """Convert lead to client after payment"""
        if not self.payment_completed:
            return False

        # Create user account
        username = self.email.split("@")[0] + str(uuid.uuid4().hex[:4])
        user = User.objects.create_user(
            username=username,
            email=self.email,
            password=User.objects.make_random_password(),
            first_name=self.first_name,
            last_name=self.last_name,
            role="client",
        )

        # Create client profile
        client = Client.objects.create(
            user=user,
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email,
            phone=self.phone,
            meeting_status="completed",
            program_status="paid",
            contract_status="not_sent",
            assigned_sales=self.assigned_sales,
        )

        # Update lead status
        self.status = "converted"
        self.save()

        return client


class LeadAssessmentEntry(models.Model):
    ASSESSMENT_CHOICES = [
        (1, "Fitness Assessment"),
        (2, "Nutrition Assessment"),
        (3, "Lifestyle Assessment"),
        (4, "Goal Setting"),
        (5, "Medical History"),
        (6, "Preferences & Availability"),
    ]

    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, related_name="assessment_entries"
    )
    assessment_id = models.IntegerField(choices=ASSESSMENT_CHOICES)
    assessment_data = models.JSONField()  # Store progress data as JSON
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["lead", "assessment_id"]
        ordering = ["assessment_id"]

    def __str__(self):
        return f"{self.lead.full_name} - Assessment {self.assessment_id}"

    def mark_completed(self):
        """Mark assessment as completed"""

        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

    @property
    def assessment_name(self):
        """Get assessment name from choices"""
        return dict(self.ASSESSMENT_CHOICES).get(
            self.assessment_id, f"Assessment {self.assessment_id}"
        )


class LeadAssessment(models.Model):
    lead = models.OneToOneField(
        Lead, on_delete=models.CASCADE, related_name="assessment"
    )
    assessment_data = models.JSONField()  # Store all form data as JSON
    completed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assessment for {self.lead.full_name}"


class Client(models.Model):
    MEETING_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    PROGRAM_STATUS_CHOICES = (
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
        ("trial", "Trial"),
    )

    CONTRACT_STATUS_CHOICES = (
        ("not_sent", "Not Sent"),
        ("sent_unsigned", "Sent but Unsigned"),
        ("sent_signed", "Sent and Signed"),
        ("signed", "Signed"),
    )

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="client_profile"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()

    # Additional profile fields
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    referred_by = models.CharField(
        max_length=100, blank=True, null=True
    )  # Referral source
    address = models.CharField(max_length=255, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)

    meeting_status = models.CharField(
        max_length=20, choices=MEETING_STATUS_CHOICES, default="pending"
    )
    program_status = models.CharField(
        max_length=20, choices=PROGRAM_STATUS_CHOICES, default="unpaid"
    )
    contract_status = models.CharField(
        max_length=20, choices=CONTRACT_STATUS_CHOICES, default="not_sent"
    )
    assigned_sales = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_clients",
    )
    meeting_scheduled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def joined_on(self):
        """Alias for created_at to match API requirements"""
        return self.user.date_joined

    @property
    def is_awaiting_purchase(self):
        return self.program_status == "unpaid" and self.contract_status == "sent_signed"

    @property
    def has_full_dashboard_access(self):
        return self.program_status == "paid"

    @property
    def dashboard_access_level(self):
        return "full" if self.has_full_dashboard_access else "overview_only"


class ClientNote(models.Model):
    """Advisor-only notes for clients with versioning"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="advisor_notes"
    )
    advisor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="client_notes_written"
    )

    title = models.CharField(max_length=200)
    content = models.TextField()

    # Versioning
    version = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_versions",
    )

    # Metadata
    is_pinned = models.BooleanField(default=False)
    category = models.CharField(
        max_length=50, blank=True
    )  # e.g., 'medical', 'progress', 'concerns'

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["client", "is_pinned", "-updated_at"]),
            models.Index(fields=["client", "category"]),
        ]

    def __str__(self):
        return f"Note: {self.title} for {self.client.full_name}"

    def create_new_version(self, new_content, new_title=None):
        """Create a new version of this note"""

        # Create new version
        new_note = ClientNote.objects.create(
            client=self.client,
            advisor=self.advisor,
            title=new_title or self.title,
            content=new_content,
            version=self.version + 1,
            previous_version=self,
            is_pinned=self.is_pinned,
            category=self.category,
        )

        return new_note
