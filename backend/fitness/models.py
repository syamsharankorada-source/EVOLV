from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')
    title = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField()
    difficulty_feedback = models.CharField(max_length=50, blank=True, null=True)
    xp_earned = models.PositiveIntegerField(default=100)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class MealLog(models.Model):
    """One row per snapped/logged meal. Today's totals are summed from these."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_logs')
    meal_name = models.CharField(max_length=255, default='Meal')
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fats_g = models.FloatField(default=0)
    fiber_g = models.FloatField(default=0)
    logged_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.meal_name}"