from django.urls import path
from . import views

urlpatterns = [
    path('request-otp/', views.request_otp),
    path('verify-otp/', views.verify_otp),
    path('guest/', views.guest_login),
    path('logout/', views.logout_view),
    path('me/', views.get_me),
    path('family/', views.family_view),
]