from django.db import models
from datetime import timedelta
from django.utils import timezone
from tci_backend.otp_security import (
    OTP_CODE_LENGTH,
    generate_secure_otp,
    normalize_otp,
)


class OTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=OTP_CODE_LENGTH)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @staticmethod
    def generate_otp():
        return generate_secure_otp()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        if not self.otp:
            self.otp = self.generate_otp()
        else:
            self.otp = normalize_otp(self.otp)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "OTP"
        verbose_name_plural = "OTPs"
