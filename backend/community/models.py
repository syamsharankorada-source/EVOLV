from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

SPECIALTY_CHOICES = [
    ('nutrition', 'Nutrition'),
    ('strength', 'Strength Training'),
    ('yoga', 'Yoga & Mobility'),
    ('weight_loss', 'Weight Loss'),
    ('bodybuilding', 'Bodybuilding'),
    ('sports_performance', 'Sports Performance'),
    ('rehab', 'Rehab & Physio'),
    ('general_fitness', 'General Fitness'),
]

POST_CATEGORY_CHOICES = SPECIALTY_CHOICES + [
    ('recipe', 'Recipe'),
    ('tip', 'Quick Tip'),
    ('workout_plan', 'Workout Plan'),
    ('success_story', 'Success Story'),
]


class CoachProfile(models.Model):
    """A user who has opted in to offer coaching/content in the Community Hub.
    Certifications are self-reported by the coach — not independently verified —
    and the UI must say so rather than imply administrative verification."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coach_profile')
    specialty = models.CharField(max_length=30, choices=SPECIALTY_CHOICES, default='general_fitness')
    bio = models.TextField(blank=True, default='')
    years_experience = models.PositiveIntegerField(default=0)
    certification_name = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coach: {self.user.username} ({self.specialty})"


class CommunityPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_posts')
    category = models.CharField(max_length=30, choices=POST_CATEGORY_CHOICES, default='tip')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class HireRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')]

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hire_requests_sent')
    coach = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hire_requests_received')
    message = models.TextField(blank=True, default='')
    contact_preference = models.CharField(max_length=20, default='in_app')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
