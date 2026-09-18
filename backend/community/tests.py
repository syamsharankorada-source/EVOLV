import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from community.models import CoachProfile, CommunityPost, HireRequest

User = get_user_model()


class CommunityViewsTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(username="community_tester", phone="+19998887774")
        self.coach_user = User.objects.create_user(username="coach_sam", phone="+19998887775")
        self.coach_profile = CoachProfile.objects.create(
            user=self.coach_user,
            specialty="strength",
            bio="Certified strength coach",
            years_experience=5,
            is_active=True
        )

    def test_unauthenticated_requests_rejected(self):
        endpoints = [
            "/api/community/coaches/",
            "/api/community/coaches/me/",
            "/api/community/coaches/become/",
            "/api/community/posts/",
            "/api/community/posts/create/",
            "/api/community/hire/",
            "/api/community/hire/mine/",
        ]
        for url in endpoints:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 401, f"Expected 401 for {url}")

    def test_coaches_list_authenticated_success(self):
        self.client.force_login(self.user)
        res = self.client.get("/api/community/coaches/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(len(data.get("data", {}).get("coaches", [])) >= 1)

    def test_my_coach_profile_authenticated_success(self):
        self.client.force_login(self.coach_user)
        res = self.client.get("/api/community/coaches/me/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("data", {}).get("specialty"), "strength")

    def test_become_coach_authenticated_success(self):
        self.client.force_login(self.user)
        payload = {
            "specialty": "bodybuilding",
            "bio": "Bodybuilding and physique specialist",
            "years_experience": 3,
            "certification_name": "NASM CPT"
        }
        res = self.client.post(
            "/api/community/coaches/become/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json().get("success"))
        self.assertTrue(CoachProfile.objects.filter(user=self.user, specialty="bodybuilding").exists())

    def test_posts_list_and_create_authenticated_success(self):
        self.client.force_login(self.coach_user)
        payload = {
            "title": "Mastering the Squat",
            "content": "Keep knees tracking over toes and brace your core.",
            "category": "tip"
        }
        res_create = self.client.post(
            "/api/community/posts/create/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res_create.status_code, 200)
        self.assertTrue(res_create.json().get("success"))

        res_list = self.client.get("/api/community/posts/")
        self.assertEqual(res_list.status_code, 200)
        data = res_list.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(len(data.get("data", {}).get("posts", [])) >= 1)

    def test_hire_request_and_mine_authenticated_success(self):
        self.client.force_login(self.user)
        payload = {
            "coach_user_id": self.coach_user.id,
            "message": "Looking for strength training programming",
            "contact_preference": "in_app"
        }
        res_hire = self.client.post(
            "/api/community/hire/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res_hire.status_code, 200)
        self.assertTrue(res_hire.json().get("success"))
        self.assertTrue(HireRequest.objects.filter(requester=self.user, coach=self.coach_user).exists())

        # Coach views their received hire requests
        self.client.force_login(self.coach_user)
        res_mine = self.client.get("/api/community/hire/mine/")
        self.assertEqual(res_mine.status_code, 200)
        data = res_mine.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(len(data.get("data", {}).get("requests", [])), 1)
