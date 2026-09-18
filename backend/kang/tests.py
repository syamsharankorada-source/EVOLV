import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from kang.models import KangChatSession, KangChatHistory

User = get_user_model()


class KangViewsTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(username="kang_tester", phone="+19998887773")

    def test_unauthenticated_requests_rejected(self):
        endpoints = [
            "/api/kang/chat/",
            "/api/kang/history/",
            "/api/kang/analyze-form/",
            "/api/kang/sessions/",
            "/api/kang/sessions/new/",
        ]
        for url in endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 401, f"Expected 401 for {url}")

    def test_kang_chat_authenticated_success(self):
        self.client.force_login(self.user)
        payload = {"message": "How do I do a pushup?"}
        res = self.client.post(
            "/api/kang/chat/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("reply", data)
        self.assertIn("session_id", data)

    def test_kang_chat_self_harm_emergency_override(self):
        self.client.force_login(self.user)
        payload = {"message": "I want to kill myself"}
        res = self.client.post(
            "/api/kang/chat/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("safety_level"), "EMERGENCY")
        self.assertIn("988", data.get("reply", ""))
        self.assertIn("Tele-MANAS", data.get("reply", ""))

    def test_kang_sessions_authenticated_success(self):
        self.client.force_login(self.user)
        # Create a session
        session = KangChatSession.objects.create(user=self.user, title="My Squat Analysis")
        res = self.client.get("/api/kang/sessions/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(len(data.get("sessions", [])) >= 1)

    def test_kang_new_session_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.post("/api/kang/sessions/new/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("session_id", data)

    def test_kang_session_messages_authenticated_success(self):
        self.client.force_login(self.user)
        session = KangChatSession.objects.create(user=self.user, title="Chat Details Test")
        KangChatHistory.objects.create(
            session=session,
            user=self.user,
            user_message="Hello KANG",
            kang_reply="Ready to train!",
            emotion="encouraging",
        )
        res = self.client.get(f"/api/kang/sessions/{session.id}/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(len(data.get("messages", [])), 1)
