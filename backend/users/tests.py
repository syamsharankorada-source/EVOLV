import json
import base64
import io
from PIL import Image
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from Fit_AI.security import (
    sanitize_text,
    validate_phone,
    validate_int,
    validate_float,
    validate_choice,
    validate_image_data,
)
from Fit_AI.rate_limiter import rate_limit, check_rate_limit
from users.services.otp_service import OTPService
from kang.models import KangChatSession, KangChatHistory
from community.models import CoachProfile

User = get_user_model()


class SecurityUtilitiesTest(TestCase):
    def test_sanitize_text_strips_html_and_xss(self):
        payload = "<script>alert('xss')</script>Hello <b>World</b>"
        cleaned = sanitize_text(payload)
        self.assertEqual(cleaned, "alert('xss')Hello World")
        self.assertNotIn("<script>", cleaned)
        self.assertNotIn("<b>", cleaned)

    def test_sanitize_text_removes_null_bytes(self):
        payload = "admin\x00user"
        cleaned = sanitize_text(payload)
        self.assertEqual(cleaned, "adminuser")

    def test_sanitize_text_enforces_max_length(self):
        long_str = "A" * 500
        cleaned = sanitize_text(long_str, max_length=50)
        self.assertEqual(len(cleaned), 50)

    def test_validate_phone(self):
        is_valid, norm = validate_phone("+12345678901")
        self.assertTrue(is_valid)
        self.assertEqual(norm, "+12345678901")

        is_valid, _ = validate_phone("9876543210")
        self.assertTrue(is_valid)

        is_valid, _ = validate_phone("123")
        self.assertFalse(is_valid)

        is_valid, _ = validate_phone("phone_number")
        self.assertFalse(is_valid)

        is_valid, _ = validate_phone("; DROP TABLE users; --")
        self.assertFalse(is_valid)

    def test_validate_int_and_float(self):
        self.assertEqual(validate_int("25", min_val=0, max_val=100), 25)
        # Clamps out-of-range value to max_val
        self.assertEqual(validate_int(150, min_val=0, max_val=100, default=10), 100)
        # Falls back to default on invalid non-integer string
        self.assertEqual(validate_int("invalid", default=5), 5)

        self.assertEqual(validate_float("3.14", min_val=0.0, max_val=10.0), 3.14)
        self.assertEqual(validate_float(float("nan"), default=1.0), 1.0)
        self.assertEqual(validate_float(float("inf"), default=1.0), 1.0)

    def test_validate_choice(self):
        self.assertEqual(validate_choice("male", ["male", "female", "other"]), "male")
        self.assertEqual(validate_choice("hacker", ["male", "female", "other"], default="other"), "other")

    def test_validate_image_data_valid(self):
        # Create a tiny 10x10 PNG
        img = Image.new("RGB", (10, 10), color="blue")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64_data = base64.b64encode(buf.getvalue()).decode("ascii")
        data_uri = f"data:image/png;base64,{b64_data}"

        is_valid, err = validate_image_data(data_uri)
        self.assertTrue(is_valid)
        self.assertIsNone(err)

    def test_validate_image_data_invalid(self):
        # Corrupted payload
        is_valid, err = validate_image_data("data:image/png;base64,not_real_image_bytes")
        self.assertFalse(is_valid)
        self.assertIn("Corrupted", err)

        # Not data URI
        is_valid, err = validate_image_data("https://example.com/pic.png")
        self.assertFalse(is_valid)
        self.assertIn("data URI", err)


class OTPServiceTest(TestCase):
    def setUp(self):
        cache.clear()

    def test_generate_and_verify_otp(self):
        phone = "+19998887777"
        otp = OTPService.generate_otp(phone)
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

        # Correct OTP verifies
        is_valid, msg = OTPService.verify_otp(phone, otp)
        self.assertTrue(is_valid)

        # Re-verification fails (single use)
        is_valid, msg = OTPService.verify_otp(phone, otp)
        self.assertFalse(is_valid)

    def test_otp_lockout_after_max_attempts(self):
        phone = "+19998887776"
        OTPService.generate_otp(phone)

        # 5 wrong attempts
        for _ in range(5):
            is_valid, msg = OTPService.verify_otp(phone, "000000")
            self.assertFalse(is_valid)

        # 6th attempt is locked out
        is_valid, msg = OTPService.verify_otp(phone, "000000")
        self.assertFalse(is_valid)
        self.assertIn("Too many failed attempts", msg)


class RateLimiterTest(TestCase):
    def setUp(self):
        cache.clear()

    def test_sliding_window_rate_limiting(self):
        key = "test_rate_limiter_key"
        limit = 3
        period = 60

        self.assertTrue(check_rate_limit(key, limit, period)[0])
        self.assertTrue(check_rate_limit(key, limit, period)[0])
        self.assertTrue(check_rate_limit(key, limit, period)[0])
        # 4th request must fail
        allowed, retry_after = check_rate_limit(key, limit, period)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)


class IDORAndAccessControlTest(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user_a = User.objects.create_user(username="user_a", phone="+10000000001")
        self.user_b = User.objects.create_user(username="user_b", phone="+10000000002")

    def test_unauthenticated_requests_rejected(self):
        # Protected API endpoints reject unauthenticated access with 401
        res = self.client.get("/api/fitness/workout-plan/")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/kang/sessions/")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/community/coaches/")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/wellness/today/")
        self.assertEqual(res.status_code, 401)

    def test_kang_chat_session_idor_protection(self):
        # User B creates a private chat session
        session_b = KangChatSession.objects.create(user=self.user_b, title="User B Secret Chat")
        KangChatHistory.objects.create(
            session=session_b,
            user=self.user_b,
            user_message="My confidential medical info",
            kang_reply="Understood",
        )

        # User A logs in
        self.client.force_login(self.user_a)

        # User A tries to view User B's session messages -> Must receive 404 (IDOR prevented)
        res = self.client.get(f"/api/kang/sessions/{session_b.id}/")
        self.assertEqual(res.status_code, 404)

        # User A tries to delete User B's session -> Must receive 404
        res = self.client.delete(f"/api/kang/sessions/{session_b.id}/")
        self.assertEqual(res.status_code, 404)
        self.assertTrue(KangChatSession.objects.filter(id=session_b.id).exists())

    def test_cannot_hire_oneself(self):
        self.client.force_login(self.user_a)
        CoachProfile.objects.create(user=self.user_a, specialty="strength", is_active=True)

        res = self.client.post(
            "/api/community/hire/",
            data=json.dumps({"coach_user_id": self.user_a.id, "message": "Hire me"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertFalse(data["success"])
        self.assertIn("can't hire yourself", data["message"])

    def test_index_template_rendered(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "EVOLV")
