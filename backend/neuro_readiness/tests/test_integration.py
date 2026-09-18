import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from neuro_readiness.models import DailyReadiness, ReactionTrial, UserBaseline, WorkoutOutcome

User = get_user_model()

class NeuroIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='athlete_test', password='password123')
        self.client.force_login(self.user)

    def test_end_to_end_check_in_and_today(self):
        # 1. Post Check-in
        payload = {
            'sleep_hours': 8.0,
            'sleep_quality': 4,
            'energy': 8,
            'focus': 8,
            'muscle_fatigue': 3,
            'resting_heart_rate': 62,
            'hrv': 65.0
        }
        response = self.client.post(
            '/api/neuro/check-in/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('score', data['data'])
        self.assertGreater(data['data']['score'], 0)

        # 2. Query today endpoint
        today_res = self.client.get('/api/neuro/today/')
        self.assertEqual(today_res.status_code, 200)
        today_data = today_res.json()
        self.assertTrue(today_data['success'])
        self.assertEqual(today_data['data']['score'], data['data']['score'])

        # 3. Query history endpoint
        hist_res = self.client.get('/api/neuro/history/?days=7')
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()
        self.assertTrue(hist_data['success'])
        self.assertEqual(len(hist_data['data']), 1)

    def test_reaction_test_submission(self):
        trials_payload = {
            'session_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            'trials': [
                {'trial_num': 0, 'reaction_ms': 260, 'is_practice': True},
                {'trial_num': 1, 'reaction_ms': 250, 'is_practice': False},
                {'trial_num': 2, 'reaction_ms': 245, 'is_practice': False},
                {'trial_num': 3, 'reaction_ms': 255, 'is_practice': False},
                {'trial_num': 4, 'reaction_ms': 252, 'is_practice': False},
                {'trial_num': 5, 'reaction_ms': 248, 'is_practice': False},
            ]
        }
        res = self.client.post(
            '/api/neuro/reaction-test/',
            data=json.dumps(trials_payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        res_data = res.json()
        self.assertTrue(res_data['success'])
        self.assertAlmostEqual(res_data['data']['median_ms'], 250.0, places=1)
        self.assertEqual(res_data['data']['valid_count'], 5)

    def test_workout_outcome_logging(self):
        # Create today's readiness first
        check_in_res = self.client.post(
            '/api/neuro/check-in/',
            data=json.dumps({'sleep_hours': 7.5, 'sleep_quality': 4}),
            content_type='application/json'
        )
        self.assertEqual(check_in_res.status_code, 200)

        # Log workout outcome
        outcome_payload = {
            'actual_duration': 45,
            'actual_rpe': 7,
            'performance_rating': 8,
            'notes': 'Felt great, solid session'
        }
        res = self.client.post(
            '/api/neuro/workout-outcome/',
            data=json.dumps(outcome_payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

        # Check analytics
        analytics_res = self.client.get('/api/neuro/analytics/')
        self.assertEqual(analytics_res.status_code, 200)
        self.assertTrue(analytics_res.json()['success'])
        self.assertEqual(len(analytics_res.json()['data']['outcomes']), 1)

