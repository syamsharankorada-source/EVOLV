from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_onboarded = models.BooleanField(default=False)
    is_guest = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username or self.phone or f"User-{self.id}"

class FitnessProfile(models.Model):
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female'), ('other', 'Other')]
    FITNESS_LEVEL_CHOICES = [('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')]
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', 'Sedentary'),
        ('light', 'Lightly Active'),
        ('moderate', 'Moderately Active'),
        ('very_active', 'Very Active')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='fitness_profile')
    age = models.PositiveIntegerField(default=25)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    height_cm = models.FloatField(default=170.0)
    weight_kg = models.FloatField(default=70.0)
    target_weight_kg = models.FloatField(null=True, blank=True)
    fitness_level = models.CharField(max_length=20, choices=FITNESS_LEVEL_CHOICES, default='beginner')
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES, default='moderate')
    available_equipment = models.JSONField(default=list, blank=True)
    preferred_duration_minutes = models.PositiveIntegerField(default=30)
    workout_days_per_week = models.PositiveIntegerField(default=3)
    wearable_device = models.CharField(max_length=50, default='none')
    sleep_hours_avg = models.CharField(max_length=20, default='7_8')
    sitting_time = models.CharField(max_length=20, default='moderate')
    primary_goal = models.CharField(max_length=50, default='general_fitness')
    secondary_goals = models.JSONField(default=list, blank=True)
    age_group = models.CharField(max_length=50, default='', blank=True)
    notifications = models.JSONField(default=dict, blank=True)
    preferred_location = models.CharField(max_length=50, default='home', blank=True)
    limitations = models.JSONField(default=list, blank=True)
    injuries = models.JSONField(default=list, blank=True)
    adaptive_factor = models.FloatField(default=1.0)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def bmi(self):
        if self.height_cm > 0:
            height_m = self.height_cm / 100.0
            return round(self.weight_kg / (height_m ** 2), 1)
        return 0.0

    def __str__(self):
        return f"FitnessProfile: {self.user.username}"

class DietaryProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dietary_profile')
    diet_preference = models.CharField(max_length=50, default='non_veg')
    allergies = models.JSONField(default=list, blank=True)
    disliked_foods = models.JSONField(default=list, blank=True)
    food_preferences = models.JSONField(default=list, blank=True)
    meals_per_day = models.PositiveIntegerField(default=3)
    water_target_ml = models.PositiveIntegerField(default=2500, blank=True)
    target_calories = models.PositiveIntegerField(null=True, blank=True)
    target_protein_g = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"DietaryProfile: {self.user.username}"

class HealthProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='health_profile')
    medical_clearance = models.BooleanField(default=True)
    chronic_conditions = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"HealthProfile: {self.user.username}"

class FamilyMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, default='male')
    fitness_goal = models.CharField(max_length=100, default='stay_active')
    health_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.relationship}) - User: {self.user.username}"