from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Consent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consents")
    consent_type = models.CharField(max_length=100)
    consented = models.BooleanField(default=False)
    consented_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Consent: {self.user.username} - {self.consent_type}"


class DataExportJob(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="data_export_jobs"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    export_file = models.FileField(upload_to="exports/", null=True, blank=True)

    def __str__(self):
        return f"Data Export for {self.user.username} - {self.status}"
