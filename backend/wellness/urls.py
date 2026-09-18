from django.urls import path
from . import views

urlpatterns = [
    path('today/', views.wellness_today_view),
    path('sync/', views.sync_band_view),
    path('history/', views.wellness_history_view),
    path('assessment/', views.wellness_assessment_view),
    path('generate-pair-token/', views.generate_pair_token_view),
]