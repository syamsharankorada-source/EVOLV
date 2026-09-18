import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from wellness.models import WellnessLog

User = get_user_model()


class WellnessViewsTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(username="wellness_tester", phone="+19998887772")

    def test_unauthenticated_requests_rejected(self):
        endpoints = [
            "/api/wellness/today/",
            "/api/wellness/sync/",
            "/api/wellness/history/",
            "/api/wellness/assessment/",
            "/api/wellness/generate-pair-token/",
        ]
        for url in endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 401, f"Expected 401 for {url}")

    def test_wellness_today_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/wellness/today/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertIn("steps", data["data"])

    def test_wellness_sync_authenticated_success(self):
        self.client.force_login(self.user)
        payload = {"steps": 5000, "water_ml": 1500, "heart_rate": 75}
        res = self.client.post(
            "/api/wellness/sync/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("message"), "Device synced successfully")

    def test_wellness_history_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/wellness/history/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)
        self.assertIn("days", data["data"])

    def test_wellness_assessment_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/wellness/assessment/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_generate_pair_token_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.post("/api/wellness/generate-pair-token/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("token", data.get("data", {}))
