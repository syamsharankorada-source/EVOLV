from django.urls import path
from . import views

urlpatterns = [
    path('check-in/', views.check_in_view, name='neuro-check-in'),
    path('reaction-test/', views.reaction_test_view, name='neuro-reaction-test'),
    path('today/', views.today_view, name='neuro-today'),
    path('history/', views.history_view, name='neuro-history'),
    path('baseline/', views.baseline_view, name='neuro-baseline'),
    path('recommendation/', views.recommendation_view, name='neuro-recommendation'),
    path('workout-outcome/', views.workout_outcome_view, name='neuro-workout-outcome'),
    path('analytics/', views.analytics_view, name='neuro-analytics'),
]
