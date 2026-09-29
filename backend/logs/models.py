from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=255)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"Audit: {self.user.username if self.user else 'System'} - {self.action}"


class EventLog(models.Model):
    event_type = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_logs",
    )

    def __str__(self):
        return f"Event: {self.event_type} - {self.timestamp}"


class ReportJob(models.Model):
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="report_jobs"
    )
    report_type = models.CharField(max_length=100)
    parameters = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    report_file = models.FileField(upload_to="reports/", null=True, blank=True)

    def __str__(self):
        return f"Report: {self.report_type} by {self.created_by.username}"
