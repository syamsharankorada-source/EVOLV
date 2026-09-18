from django.test import TestCase
from neuro_readiness.sleep import calculate_sleep_score
from neuro_readiness import config

class SleepScoreTests(TestCase):
    def test_perfect_sleep(self):
        # 8+ hours and quality 5
        score = calculate_sleep_score(8.5, 5)
        self.assertEqual(score, 100.0)

    def test_poor_sleep(self):
        # 4 hours and quality 1
        score = calculate_sleep_score(4.0, 1)
        self.assertLess(score, 50.0)

    def test_missing_hours(self):
        score = calculate_sleep_score(None, 4)
        self.assertIsNone(score)

    def test_missing_quality_uses_100_percent_duration(self):
        score = calculate_sleep_score(8.0, None)
        self.assertEqual(score, 100.0)

    def test_clamping(self):
        score_high = calculate_sleep_score(15.0, 5)
        self.assertLessEqual(score_high, 100.0)
        score_low = calculate_sleep_score(0.0, 1)
        self.assertGreaterEqual(score_low, 0.0)

