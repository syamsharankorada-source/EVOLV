from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.kang_chat_view, name='kang_chat'),
    path('history/', views.kang_history_view, name='kang_history'),
    path('analyze-form/', views.kang_analyze_form_view, name='kang_analyze_form'),

    # Chat sessions — right-side history sidebar + "New Chat"
    path('sessions/', views.kang_sessions_view, name='kang_sessions'),
    path('sessions/new/', views.kang_new_session_view, name='kang_new_session'),
    path('sessions/<int:session_id>/', views.kang_session_messages_view, name='kang_session_messages'),
]
