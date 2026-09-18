from django.utils import timezone
from wellness.models import WellnessLog


class AssessmentService:
    """
    Produces a simple, rule-based "how's your activity looking" verdict from
    recent wearable/wellness history plus the user's fitness profile.

    This is intentionally general lifestyle guidance (step counts, sleep
    consistency, hydration, BMI band) — not a medical diagnosis. Anything
    that looks like a real health concern should point the person to a
    doctor rather than make a clinical claim.
    """

    STEPS_GOAL = 8000
    SLEEP_GOAL_MIN = 7.0
    WATER_GOAL_ML = 2000

    @classmethod
    def assess(cls, user) -> dict:
        today = timezone.now().date()
        start = today - timezone.timedelta(days=13)
        logs = list(WellnessLog.objects.filter(user=user, date__gte=start, date__lte=today))

        days_with_data = len(logs)
        avg_steps = round(sum(l.steps for l in logs) / days_with_data) if days_with_data else 0
        avg_sleep = round(sum(l.sleep_hours for l in logs) / days_with_data, 1) if days_with_data else 0.0
        avg_water = round(sum(l.water_ml for l in logs) / days_with_data) if days_with_data else 0

        active_days = sum(1 for l in logs if l.steps >= cls.STEPS_GOAL)
        good_sleep_days = sum(1 for l in logs if l.sleep_hours >= cls.SLEEP_GOAL_MIN)
        hydrated_days = sum(1 for l in logs if l.water_ml >= cls.WATER_GOAL_ML)

        fp = getattr(user, 'fitness_profile', None)
        bmi = fp.bmi if fp else None

        # --- Score components (0-100 each), then blend into one verdict ---
        step_score = min(100, round((avg_steps / cls.STEPS_GOAL) * 100)) if days_with_data else 0
        sleep_score = min(100, round((avg_sleep / cls.SLEEP_GOAL_MIN) * 100)) if days_with_data else 0
        water_score = min(100, round((avg_water / cls.WATER_GOAL_ML) * 100)) if days_with_data else 0
        overall_score = round((step_score + sleep_score + water_score) / 3) if days_with_data else 0

        if not days_with_data:
            verdict = "no_data"
            headline = "No wearable data yet"
        elif overall_score >= 75:
            verdict = "fit"
            headline = "You're on track"
        elif overall_score >= 45:
            verdict = "needs_improvement"
            headline = "Good start, room to grow"
        else:
            verdict = "at_risk"
            headline = "Let's build some momentum"

        suggestions = []
        if days_with_data:
            if step_score < 75:
                gap = max(cls.STEPS_GOAL - avg_steps, 0)
                suggestions.append(f"Add roughly {gap} more steps a day — a 15-20 min walk usually covers it.")
            if sleep_score < 75:
                suggestions.append(f"You're averaging {avg_sleep}h of sleep — aim for {cls.SLEEP_GOAL_MIN}-8h for better recovery.")
            if water_score < 75:
                suggestions.append(f"Hydration is averaging {avg_water}ml/day — aim for at least {cls.WATER_GOAL_ML}ml.")
            if fp and fp.sitting_time == 'high':
                suggestions.append("You reported a lot of sitting time — try standing or stretching every hour.")
            if bmi and bmi >= 30:
                suggestions.append("Your BMI is in a higher range — a doctor or dietitian can help set a safe, personalized plan.")
            if bmi and bmi < 18.5:
                suggestions.append("Your BMI is on the lower side — consider a nutrient-dense diet plan and check in with a doctor if unintentional.")
            if not suggestions:
                suggestions.append("Keep up the consistency — you're hitting your activity, sleep, and hydration goals.")
        else:
            suggestions.append("Sync your wearable or log a few days of activity to get a personalized assessment.")

        return {
            'verdict': verdict,
            'headline': headline,
            'overall_score': overall_score,
            'days_with_data': days_with_data,
            'avg_steps': avg_steps,
            'avg_sleep_hours': avg_sleep,
            'avg_water_ml': avg_water,
            'active_days': active_days,
            'good_sleep_days': good_sleep_days,
            'hydrated_days': hydrated_days,
            'bmi': bmi,
            'suggestions': suggestions,
        }
