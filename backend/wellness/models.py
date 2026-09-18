import datetime
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class WellnessLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wellness_logs')
    date = models.DateField(default=datetime.date.today)
    water_ml = models.PositiveIntegerField(default=0)
    steps = models.PositiveIntegerField(default=0)
    sleep_hours = models.FloatField(default=0.0)
    heart_rate = models.PositiveIntegerField(default=72)
    device_name = models.CharField(max_length=50, default='', blank=True)

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.username} - {self.date}"


def _default_token():
    return uuid.uuid4().hex[:10].upper()


def _default_expiry():
    return timezone.now() + datetime.timedelta(minutes=15)


class DevicePairingToken(models.Model):
    """A short-lived QR-pairing token: scanning it logs the phone's browser
    into the same account as the desktop that generated it, so a watch paired
    from the phone (which has real Bluetooth range to it) lands in this
    account's WellnessLog just like a desktop-side sync would."""
    token = models.CharField(max_length=20, unique=True, default=_default_token)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pairing_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=_default_expiry)
    used_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        return self.used_at is None and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.token} ({self.user.username})"