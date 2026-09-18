from django.test import TestCase
from neuro_readiness.reaction import process_trials, calculate_reaction_score
from neuro_readiness.subjective import calculate_subjective_score

class ReactionAndSubjectiveTests(TestCase):
    def test_process_trials_valid(self):
        trials = [
            {'reaction_time': 250},
            {'reaction_time': 260},
            {'reaction_time': 240},
            {'reaction_time': 255},
            {'reaction_time': 245},
        ]
        res = process_trials(trials)
        self.assertEqual(res['valid_count'], 5)
        self.assertEqual(res['median_ms'], 250)
        self.assertEqual(res['invalid_count'], 0)

    def test_process_trials_filters_anticipation_and_distraction(self):
        trials = [
            {'reaction_time': 100}, # anticipation (<150)
            {'reaction_time': 250},
            {'reaction_time': 260},
            {'reaction_time': 2000}, # distraction (>1500)
        ]
        res = process_trials(trials)
        self.assertEqual(res['valid_count'], 2)
        self.assertEqual(res['invalid_count'], 2)

    def test_calculate_reaction_score_faster_than_baseline(self):
        score = calculate_reaction_score(240.0, 10.0, 260.0)
        self.assertEqual(score, 100.0)

    def test_calculate_reaction_score_variability_penalty(self):
        score_low_var = calculate_reaction_score(300.0, 20.0, 260.0)
        score_high_var = calculate_reaction_score(300.0, 100.0, 260.0)
        self.assertGreater(score_low_var, score_high_var)

    def test_calculate_subjective_score_all_high(self):
        # energy=10, focus=10, fatigue=1 (fresh, 11-1=10) -> 100%
        score = calculate_subjective_score(10, 10, 1)
        self.assertEqual(score, 100.0)

    def test_calculate_subjective_score_all_exhausted(self):
        # energy=1, focus=1, fatigue=10 (11-10=1) -> (3/30)*100 = 10%
        score = calculate_subjective_score(1, 1, 10)
        self.assertEqual(score, 10.0)

    def test_calculate_subjective_score_partial_missing(self):
        score = calculate_subjective_score(8, None, None)
        self.assertEqual(score, 80.0)

