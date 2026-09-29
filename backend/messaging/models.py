from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class ChatSession(models.Model):
    """Session-scoped group chat for trainers and client"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Related entities
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messaging_sessions_as_client"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_messaging_sessions"
    )

    # Session settings
    is_active = models.BooleanField(default=True)
    announcement_only = models.BooleanField(default=False)  # Only trainers can post
    max_members = models.PositiveIntegerField(default=50)

    # Retention and settings
    retention_days = models.PositiveIntegerField(default=90)
    allow_attachments = models.BooleanField(default=True)
    max_attachment_size_mb = models.PositiveIntegerField(default=10)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat: {self.title} ({self.client.get_full_name()})"

    @property
    def member_count(self):
        return self.members.filter(status="active").count()

    @property
    def trainer_count(self):
        return self.members.filter(user__role="trainer", status="active").count()


class ChatMember(models.Model):
    """Chat session membership with roles and status"""

    STATUS_CHOICES = (
        ("active", "Active"),
        ("muted", "Muted"),
        ("banned", "Banned"),
        ("left", "Left"),
    )

    ROLE_CHOICES = (
        ("trainer", "Trainer"),
        ("client", "Client"),
    )

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messaging_members"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messaging_memberships"
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    # Permissions and settings
    can_post = models.BooleanField(default=True)
    can_attach = models.BooleanField(default=True)
    is_moderator = models.BooleanField(default=False)  # For trainers

    # Activity tracking
    last_seen_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    muted_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["session", "user"]

    def __str__(self):
        return f"{self.user.get_full_name()} in {self.session.title} ({self.role})"

    @property
    def is_online(self):
        """Check if member is currently online (within last 5 minutes)"""
        if not self.last_seen_at:
            return False
        return (timezone.now() - self.last_seen_at).seconds < 300  # 5 minutes


class ChatMessage(models.Model):
    """Chat messages with rich content and attachments"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messaging_messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messaging_messages_sent"
    )

    # Message content
    text = models.TextField(blank=True)
    rich_content = models.JSONField(
        null=True, blank=True
    )  # For formatted text, markdown, etc.

    # Message relationships
    reply_to = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="messaging_replies",
    )
    mentions = models.JSONField(default=list)  # List of user IDs mentioned

    # Attachments
    attachments = models.JSONField(default=list)  # List of attachment objects

    # Message status
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    # Delivery tracking
    delivered_to = models.JSONField(default=list)  # List of user IDs who received it
    read_by = models.JSONField(default=list)  # List of {userId, readAt} objects

    # Moderation
    is_announcement = models.BooleanField(default=False)
    moderated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="messaging_messages_moderated",
    )

    # Metadata
    message_type = models.CharField(
        max_length=50, default="text"
    )  # text, system, announcement
    idempotency_key = models.CharField(
        max_length=100, blank=True, null=True
    )  # Prevent duplicates

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["sender", "created_at"]),
            models.Index(fields=["idempotency_key"]),
        ]

    def __str__(self):
        return f"Message by {self.sender.get_full_name()} in {self.session.title}"

    def mark_as_read(self, user):
        """Mark message as read by a user"""
        read_entry = {"userId": str(user.id), "readAt": timezone.now().isoformat()}

        # Remove existing read entry for this user
        self.read_by = [
            entry for entry in self.read_by if entry.get("userId") != str(user.id)
        ]
        # Add new read entry
        self.read_by.append(read_entry)
        self.save()

    def mark_as_delivered(self, user):
        """Mark message as delivered to a user"""
        user_id_str = str(user.id)
        if user_id_str not in self.delivered_to:
            self.delivered_to.append(user_id_str)
            self.save()


class ChatAttachment(models.Model):
    """File attachments for chat messages"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name="messaging_attachment_objects",
    )

    # File details
    filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()

    # Storage
    file_url = models.URLField(blank=True)  # For cloud storage URLs
    blob_ref = models.CharField(
        max_length=500, blank=True
    )  # For blob storage references

    # Security and moderation
    is_safe = models.BooleanField(default=True)  # DLP check result
    scanned_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment: {self.filename} ({self.size_bytes} bytes)"


class ChatTypingIndicator(models.Model):
    """Track who is currently typing in a session"""

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messaging_typing_indicators",
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messaging_typing_in_sessions"
    )

    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["session", "user"]

    def __str__(self):
        return f"{self.user.get_full_name()} is typing in {self.session.title}"


class ChatAuditLog(models.Model):
    """Audit log for chat moderation actions"""

    ACTION_CHOICES = (
        ("message_deleted", "Message Deleted"),
        ("message_redacted", "Message Redacted"),
        ("member_muted", "Member Muted"),
        ("member_banned", "Member Banned"),
        ("member_unmuted", "Member Unmuted"),
        ("member_unbanned", "Member Unbanned"),
        ("announcement_mode_toggled", "Announcement Mode Toggled"),
        ("session_settings_changed", "Session Settings Changed"),
    )

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messaging_audit_logs"
    )
    actor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messaging_actions"
    )

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="messaging_actions_taken",
    )
    target_message = models.ForeignKey(
        ChatMessage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="messaging_audit_logs",
    )

    details = models.JSONField(default=dict)  # Additional action details
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.actor.get_full_name()} in {self.session.title}"
