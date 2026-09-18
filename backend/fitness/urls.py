from django.urls import path
from . import views

urlpatterns = [
    path('workout-plan/', views.workout_plan_view),
    path('workouts/', views.log_workout_view),
    path('progress/', views.progress_view),
    path('badges/', views.badges_view),
    path('leaderboard/', views.leaderboard_view),
]