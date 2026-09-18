import uuid
import datetime
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class DailyReadiness(models.Model):
    """Stores one readiness assessment per user per day.
    Contains raw inputs, computed component scores, and final results."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='readiness_logs')
    date = models.DateField(default=datetime.date.today)

    # --- Raw inputs ---
    sleep_hours = models.FloatField(null=True, blank=True)
    sleep_quality = models.IntegerField(null=True, blank=True)  # 1-5
    hrv = models.FloatField(null=True, blank=True)  # ms
    resting_heart_rate = models.IntegerField(null=True, blank=True)  # BPM
    reaction_time_ms = models.FloatField(null=True, blank=True)  # median
    reaction_variability = models.FloatField(null=True, blank=True)  # std dev
    energy = models.IntegerField(null=True, blank=True)  # 1-10
    focus = models.IntegerField(null=True, blank=True)  # 1-10
    muscle_fatigue = models.IntegerField(null=True, blank=True)  # 1-10
    workout_duration = models.IntegerField(null=True, blank=True)  # minutes
    workout_rpe = models.IntegerField(null=True, blank=True)  # 1-10

    # --- Component scores (0-100) ---
    sleep_score = models.FloatField(null=True, blank=True)
    hrv_score = models.FloatField(null=True, blank=True)
    rhr_score = models.FloatField(null=True, blank=True)
    reaction_score = models.FloatField(null=True, blank=True)
    subjective_score = models.FloatField(null=True, blank=True)
    training_load_score = models.FloatField(null=True, blank=True)

    # --- Final results ---
    calculated_score = models.FloatField(null=True, blank=True)  # before safety
    final_score = models.FloatField(null=True, blank=True)  # after safety
    readiness_category = models.CharField(max_length=20, default='', blank=True)
    safety_override = models.BooleanField(default=False)
    safety_flags = models.JSONField(default=list, blank=True)
    baseline_confidence = models.CharField(max_length=10, default='LOW', blank=True)
    missing_data = models.JSONField(default=list, blank=True)
    explanation = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
        verbose_name_plural = 'Daily readiness records'

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.final_score or '?'}/100"


class ReactionTrial(models.Model):
    """Individual reaction-time trial from a browser-based test session."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reaction_trials')
    session_id = models.UUIDField(default=uuid.uuid4)
    trial_num = models.IntegerField()
    reaction_ms = models.FloatField()
    is_valid = models.BooleanField(default=True)
    is_practice = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['session_id', 'trial_num']

    def __str__(self):
        tag = 'practice' if self.is_practice else ('valid' if self.is_valid else 'invalid')
        return f"{self.user.username} T{self.trial_num}: {self.reaction_ms}ms ({tag})"


class UserBaseline(models.Model):
    """Rolling personal baselines for each measured signal.
    Updated after each check-in using median of historical data."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='neuro_baseline')
    hrv_baseline = models.FloatField(null=True, blank=True)
    rhr_baseline = models.FloatField(null=True, blank=True)
    reaction_baseline = models.FloatField(null=True, blank=True)
    sleep_baseline = models.FloatField(null=True, blank=True)
    training_load_baseline = models.FloatField(null=True, blank=True)
    subjective_baseline = models.FloatField(null=True, blank=True)
    valid_days_count = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Baseline: {self.user.username} ({self.valid_days_count} days)"


class WorkoutOutcome(models.Model):
    """Links a readiness assessment to the actual workout performance.
    Used for validation analytics (does readiness predict performance?)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_outcomes')
    date = models.DateField(default=datetime.date.today)
    readiness_before = models.FloatField()
    recommended_intensity = models.CharField(max_length=30, default='')
    actual_duration = models.IntegerField(null=True, blank=True)
    actual_rpe = models.IntegerField(null=True, blank=True)  # 1-10
    performance_rating = models.IntegerField(null=True, blank=True)  # 1-10 subjective
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date} - Readiness:{self.readiness_before}"
