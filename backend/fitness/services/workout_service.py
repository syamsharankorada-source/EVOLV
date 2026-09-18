import csv
import os
import datetime
import random
from pathlib import Path
from django.conf import settings


class WorkoutEngine:
    _cached_exercises = None

    # What each onboarding equipment choice actually grants access to.
    # CSV Equipment values are matched (case-insensitive) against these sets.
    EQUIPMENT_ACCESS = {
        'none': {'none', 'wall', 'chair', 'step'},
        'dumbbells': {'none', 'wall', 'chair', 'step', 'dumbbell', 'bench', 'resistance band', 'jump rope'},
        'full_gym': None,  # None = no restriction, everything is available
    }

    # Beginners get Beginner-only; Intermediate gets Beginner+Intermediate; Advanced gets all.
    LEVEL_ACCESS = {
        'beginner': {'beginner'},
        'intermediate': {'beginner', 'intermediate'},
        'advanced': {'beginner', 'intermediate', 'advanced'},
    }

    # Day focus -> which CSV Muscle_group values count toward that day
    FOCUS_MUSCLES = {
        'Chest & Triceps': {'chest', 'triceps'},
        'Back & Biceps': {'back', 'biceps'},
        'Legs & Core': {'legs', 'core', 'glutes', 'calves'},
        'Active Recovery / Cardio': {'full body', 'legs'},
        'Shoulders & Abs': {'shoulders', 'abs', 'core'},
        'Full Body HIIT': {'full body', 'legs', 'core', 'abs'},
    }

    @classmethod
    def load_exercises(cls):
        if cls._cached_exercises is not None:
            return cls._cached_exercises
        csv_path = Path(settings.BASE_DIR) / 'data' / 'exercises.csv'
        exercises = []
        if os.path.exists(csv_path):
            try:
                # utf-8-sig strips the BOM so the first column key is 'Exercises',
                # not '\ufeffExercises'
                with open(csv_path, mode='r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        exercises.append(row)
            except Exception:
                pass
        cls._cached_exercises = exercises
        return cls._cached_exercises

    @classmethod
    def generate_workout_plan(cls, fitness_profile) -> dict:
        exercises_pool = cls.load_exercises()
        if not exercises_pool:
            exercises_pool = [{"Exercises": "Push-up", "Muscle_group": "Chest", "Equipment": "None", "Restrictions": "", "Level": "Beginner"}]

        limitations = [l.lower() for l in (fitness_profile.limitations or [])]
        injuries = [i.lower() for i in (fitness_profile.injuries or [])]
        equipment_choice = (fitness_profile.available_equipment or ['none'])
        equipment_choice = equipment_choice[0].lower() if equipment_choice else 'none'
        allowed_equipment = cls.EQUIPMENT_ACCESS.get(equipment_choice, cls.EQUIPMENT_ACCESS['none'])

        fitness_level = fitness_profile.fitness_level.lower()
        allowed_levels = cls.LEVEL_ACCESS.get(fitness_level, cls.LEVEL_ACCESS['beginner'])
        duration = fitness_profile.preferred_duration_minutes or 30

        filtered = []
        for ex in exercises_pool:
            ex_name = ex.get('Exercises', '').lower()
            ex_equip = ex.get('Equipment', 'None').lower()
            ex_level = ex.get('Level', 'Beginner').lower()
            contraindications = ex.get('Restrictions', '').lower()

            is_unsafe = False
            for lim in limitations + injuries:
                if lim and (lim in contraindications or (lim in ['knee', 'knee_pain'] and 'squat' in ex_name)):
                    is_unsafe = True
                    break
            if is_unsafe:
                continue

            if allowed_equipment is not None and ex_equip not in allowed_equipment:
                continue
            if ex_level not in allowed_levels:
                continue

            filtered.append(ex)

        pool = filtered if len(filtered) >= 6 else exercises_pool

        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        splits = [
            {"day": "Monday", "focus": "Chest & Triceps"},
            {"day": "Tuesday", "focus": "Back & Biceps"},
            {"day": "Wednesday", "focus": "Legs & Core"},
            {"day": "Thursday", "focus": "Active Recovery / Cardio"},
            {"day": "Friday", "focus": "Shoulders & Abs"},
            {"day": "Saturday", "focus": "Full Body HIIT"},
            {"day": "Sunday", "focus": "Rest"}
        ]

        today_idx = datetime.datetime.today().weekday()
        today_name = days_of_week[today_idx]

        # Stable-per-week randomization: same plan all week, changes next week,
        # rather than a fresh random shuffle on every page load.
        week_seed = f"{fitness_profile.user_id}-{datetime.date.today().isocalendar()[1]}"
        rng = random.Random(week_seed)

        weekly_plan = []
        today_exercises = []

        for split in splits:
            if "Rest" in split["focus"]:
                day_ex = []
            else:
                wanted_muscles = cls.FOCUS_MUSCLES.get(split["focus"], set())
                day_pool = [e for e in pool if e.get('Muscle_group', '').lower() in wanted_muscles]
                if len(day_pool) < 5:
                    day_pool = pool  # not enough targeted exercises — fall back to full allowed pool

                day_pool = day_pool[:]
                rng.shuffle(day_pool)
                chosen = day_pool[:5]

                day_ex = []
                for idx, item in enumerate(chosen):
                    sets = 3 if fitness_level in ['intermediate', 'advanced'] else 2
                    reps = "10-12 reps" if fitness_level == 'beginner' else "12-15 reps"
                    day_ex.append({
                        "id": idx + 1,
                        "name": item.get('Exercises', f"Exercise {idx+1}"),
                        "target_muscle": item.get('Muscle_group', split["focus"]),
                        "sets": sets,
                        "reps": reps,
                        "rest_seconds": 60 if fitness_level == 'beginner' else 45,
                        "equipment": item.get('Equipment', 'None')
                    })
            
            weekly_plan.append({
                "day": split["day"],
                "focus": split["focus"],
                "exercises": day_ex,
                "is_today": split["day"] == today_name
            })

            if split["day"] == today_name:
                today_exercises = day_ex

        return {
            "title": f"{today_name} - {splits[today_idx]['focus']}",
            "duration_minutes": duration,
            "difficulty": fitness_level,
            "exercises": today_exercises,
            "weekly_plan": weekly_plan,
            "safety_notes": [],
            "progression_notes": [f"Adaptive level scaled for {fitness_level}."]
        }