from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("meeting", "Meeting"),
        ("file", "File"),
        ("system", "System"),
        ("message", "Message"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="system")
    time = models.DateTimeField(default=timezone.now)  # Changed from auto_now_add
    created_at = models.DateTimeField(default=timezone.now)  # Changed from auto_now_add
    updated_at = models.DateTimeField(auto_now=True)
    related_id = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["is_read"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"


class BroadcastEmail(models.Model):
    subject = models.CharField(max_length=255)
    content = models.TextField()
    recipients = models.ManyToManyField(User, related_name="broadcast_emails")
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.subject
