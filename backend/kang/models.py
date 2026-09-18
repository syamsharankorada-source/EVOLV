from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class KangChatSession(models.Model):
    """A single chat thread with KANG. One row per entry shown in the right-side
    chat history sidebar; each 'New Chat' click creates a new session."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kang_sessions')
    title = models.CharField(max_length=150, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} (user={self.user_id})"


class KangChatHistory(models.Model):
    session = models.ForeignKey(
        KangChatSession, on_delete=models.CASCADE, related_name='messages',
        null=True, blank=True
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kang_chats')
    user_message = models.TextField()
    kang_reply = models.TextField()
    emotion = models.CharField(max_length=50, default='idle')
    intent = models.CharField(max_length=50, default='general_chat')
    safety_level = models.CharField(max_length=50, default='SAFE')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class KangMemory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kang_memories')
    memory_key = models.CharField(max_length=100)
    memory_value = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)
