from django.test import TestCase
from neuro_readiness.hrv import calculate_hrv_score
from neuro_readiness.resting_hr import calculate_rhr_score

class PhysiologyScoreTests(TestCase):
    def test_hrv_at_or_above_baseline(self):
        score = calculate_hrv_score(65.0, 60.0)
        self.assertEqual(score, 100.0)
        score_equal = calculate_hrv_score(60.0, 60.0)
        self.assertEqual(score_equal, 100.0)

    def test_hrv_below_baseline_interpolation(self):
        # -10% should give 80
        baseline = 60.0
        today = 54.0 # exactly -10%
        score = calculate_hrv_score(today, baseline)
        self.assertAlmostEqual(score, 80.0, places=1)

    def test_hrv_missing_or_invalid(self):
        self.assertIsNone(calculate_hrv_score(None, 60.0))
        self.assertIsNone(calculate_hrv_score(60.0, None))
        self.assertIsNone(calculate_hrv_score(60.0, 0.0))

    def test_rhr_at_or_below_baseline(self):
        score = calculate_rhr_score(55, 60.0)
        self.assertEqual(score, 100.0)
        score_equal = calculate_rhr_score(60, 60.0)
        self.assertEqual(score_equal, 100.0)

    def test_rhr_elevated(self):
        # 4 bpm above -> 90
        score = calculate_rhr_score(64, 60.0)
        self.assertAlmostEqual(score, 90.0, places=1)
        # 10+ bpm above -> 45
        score_high = calculate_rhr_score(75, 60.0)
        self.assertLessEqual(score_high, 50.0)

    def test_rhr_missing(self):
        self.assertIsNone(calculate_rhr_score(None, 60.0))
        self.assertIsNone(calculate_rhr_score(60, None))

