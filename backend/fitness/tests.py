import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from fitness.models import WorkoutLog

User = get_user_model()


class FitnessViewsTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(username="fitness_tester", phone="+19998887771")

    def test_unauthenticated_requests_rejected(self):
        endpoints = [
            "/api/fitness/workout-plan/",
            "/api/fitness/workouts/",
            "/api/fitness/progress/",
            "/api/fitness/badges/",
            "/api/fitness/leaderboard/",
        ]
        for url in endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 401, f"Expected 401 for {url}")

    def test_workout_plan_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/fitness/workout-plan/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_log_workout_authenticated_success(self):
        self.client.force_login(self.user)
        payload = {
            "title": "Evening Push Day",
            "duration_minutes": 45,
            "feedback": "challenging"
        }
        res = self.client.post(
            "/api/fitness/workouts/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("message"), "Workout logged successfully")
        self.assertTrue(WorkoutLog.objects.filter(user=self.user, title="Evening Push Day").exists())

    def test_progress_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/fitness/progress/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_badges_and_leaderboard_authenticated_success(self):
        self.client.force_login(self.user)
        res_badges = self.client.get("/api/fitness/badges/")
        self.assertEqual(res_badges.status_code, 200)
        self.assertTrue(res_badges.json().get("success"))

        res_lead = self.client.get("/api/fitness/leaderboard/")
        self.assertEqual(res_lead.status_code, 200)
        self.assertTrue(res_lead.json().get("success"))
