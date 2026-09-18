from django.urls import path
from . import views

urlpatterns = [
    path('plan/', views.nutrition_plan_view),
    path('scan-meal/', views.meal_scan_view),
    path('today/', views.nutrition_today_view),
    path('recipe/', views.recipe_view),
]