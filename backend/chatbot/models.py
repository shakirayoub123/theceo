from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatSession(models.Model):
    participants = models.ManyToManyField(User, related_name="chat_sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        participant_names = [user.username for user in self.participants.all()]
        return f"Chat Session: {', '.join(participant_names)}"

    @property
    def chat_uuid(self):
        return str(self.id)


class ChatMessage(models.Model):
    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.message[:50]}"


class AIChatSession(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ai_chat_sessions",
        null=True,
        blank=True,
    )
    session_name = models.CharField(max_length=255, blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)  # For public customer chats

    def __str__(self):
        if self.user:
            return f"AI Chat Session: {self.user.username}"
        return f"Public AI Chat Session: {self.session_name or self.id}"

    @property
    def chat_uuid(self):
        return str(self.id)


class AIChatMessage(models.Model):
    SENDER_CHOICES = (
        ("user", "User"),
        ("ai", "AI"),
    )

    session = models.ForeignKey(
        AIChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ai_sent_messages",
        null=True,
        blank=True,
    )
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.sender_type == "ai":
            return f"AI: {self.message[:50]}"
        elif self.sender:
            return f"{self.sender.username}: {self.message[:50]}"
        return f"Anonymous: {self.message[:50]}"
