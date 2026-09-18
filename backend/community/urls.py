from django.urls import path
from . import views

urlpatterns = [
    path('coaches/', views.coaches_list_view),
    path('coaches/me/', views.my_coach_profile_view),
    path('coaches/become/', views.become_coach_view),
    path('posts/', views.posts_list_view),
    path('posts/create/', views.create_post_view),
    path('hire/', views.hire_request_view),
    path('hire/mine/', views.my_hire_requests_view),
]
