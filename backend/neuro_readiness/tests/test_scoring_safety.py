from django.test import TestCase
from neuro_readiness.scoring import calculate_readiness, get_category
from neuro_readiness.safety import check_safety
from neuro_readiness.confidence import assess_confidence
from neuro_readiness import config

class ScoringAndSafetyTests(TestCase):
    def test_calculate_readiness_all_components(self):
        components = {
            'sleep': 90.0,
            'hrv': 85.0,
            'reaction': 80.0,
            'training_load': 75.0,
            'subjective': 90.0,
            'rhr': 80.0
        }
        score, weights = calculate_readiness(components)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)
        # Sum of weights must equal 1.0
        self.assertAlmostEqual(sum(weights.values()), 1.0, places=3)

    def test_calculate_readiness_missing_redistribution(self):
        # Only sleep provided (weight 0.20), should scale to 100% of the score
        components = {
            'sleep': 80.0,
            'hrv': None,
            'reaction': None,
            'training_load': None,
            'subjective': None,
            'rhr': None
        }
        score, weights = calculate_readiness(components)
        self.assertEqual(score, 80.0)
        self.assertEqual(weights['sleep'], 1.0)

    def test_categories(self):
        self.assertEqual(get_category(95.0), 'PERFORMANCE')
        self.assertEqual(get_category(85.0), 'HIGH')
        self.assertEqual(get_category(75.0), 'MODERATE')
        self.assertEqual(get_category(65.0), 'REDUCED')
        self.assertEqual(get_category(40.0), 'RECOVERY')

    def test_safety_critical_sleep_override(self):
        raw_inputs = {'sleep_hours': 3.5, 'rhr': 60, 'reaction_median_ms': 250, 'has_injuries': False}
        comp = {'sleep': 30.0}
        baseline = {'rhr_baseline': 60, 'reaction_baseline': 250}
        res = check_safety(raw_inputs, comp, 85.0, baseline)
        self.assertTrue(res['override'])
        self.assertTrue(res['capped'])
        self.assertLessEqual(res['adjusted_score'], config.SAFETY_MAX_SCORE_ON_OVERRIDE)

    def test_confidence_assessment(self):
        # Few days -> LOW
        self.assertEqual(assess_confidence(3, []), 'LOW')
        # 10 days -> MEDIUM
        self.assertEqual(assess_confidence(10, []), 'MEDIUM')
        # 20 days -> HIGH
        self.assertEqual(assess_confidence(20, []), 'HIGH')
        # High missing data drops confidence
        self.assertEqual(assess_confidence(20, ['hrv', 'reaction', 'sleep']), 'MEDIUM')

