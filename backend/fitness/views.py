import json
from django.http import JsonResponse
from django.utils import timezone
from fitness.services.workout_service import WorkoutEngine
from fitness.services.nutrition_service import NutritionEngine
from fitness.services.nutrition_vision import MealVisionService, RecipeService, NotFoodError, MealVisionError
from fitness.services.progress import ProgressService
from fitness.services.badges import BadgeService, LeaderboardService
from fitness.models import WorkoutLog, MealLog

from Fit_AI.security import sanitize_text, validate_image_data, validate_int, validate_choice
from Fit_AI.rate_limiter import rate_limit

def workout_plan_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    if request.method == 'GET':
        try:
            prof = getattr(request.user, 'fitness_profile', None)

            # Profile లేకపోతే డిఫాల్ట్ ఆబ్జెక్ట్ ఇస్తున్నాం (ఎర్రర్ రాకుండా)
            class DefaultProfile:
                user_id = getattr(request.user, 'id', 0)
                fitness_level = 'beginner'
                preferred_duration_minutes = 30
                limitations = []
                injuries = []
                available_equipment = ['none']

            p = prof if prof else DefaultProfile()
            plan = WorkoutEngine.generate_workout_plan(p)
            return JsonResponse({'success': True, 'data': plan})
        except Exception as e:
            print("Workout plan view error:", e)
            return JsonResponse({'success': False, 'message': 'Could not generate workout plan'}, status=500)
    return JsonResponse({'success': False}, status=405)

@rate_limit(key_type='user', limit=30, period_seconds=60)
def log_workout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'success': False, 'message': 'Invalid JSON payload'}, status=400)

        title = sanitize_text(data.get('title', 'AI Custom Workout'), max_length=150, default='AI Custom Workout')
        duration_minutes = validate_int(data.get('duration_minutes', 30), min_val=1, max_val=480, default=30)
        feedback = validate_choice(
            data.get('feedback', 'comfortable'),
            ['too_easy', 'comfortable', 'challenging', 'too_difficult', 'easy', 'medium', 'hard'],
            default='comfortable'
        )

        WorkoutLog.objects.create(
            user=request.user,
            title=title,
            duration_minutes=duration_minutes,
            difficulty_feedback=feedback,
            xp_earned=duration_minutes * 5
        )
        return JsonResponse({'success': True, 'message': 'Workout logged successfully'})
    return JsonResponse({'success': False}, status=405)

def progress_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    if request.method == 'GET':
        progress_data = ProgressService.get_user_progress(request.user)
        return JsonResponse({'success': True, 'data': progress_data})
    return JsonResponse({'success': False}, status=405)

def badges_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        data = BadgeService.get_badges(request.user)
        return JsonResponse({'success': True, 'data': data})
    return JsonResponse({'success': False}, status=405)

def leaderboard_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        data = LeaderboardService.get_leaderboard(request.user)
        return JsonResponse({'success': True, 'data': data})
    return JsonResponse({'success': False}, status=405)

def nutrition_plan_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    
    if request.method == 'GET':
        try:
            prof = getattr(request.user, 'fitness_profile', None)
            diet = getattr(request.user, 'dietary_profile', None)

            class DummyProfile:
                weight_kg = 70.0
                height_cm = 170.0
                age = 25
                gender = 'male'
                activity_level = 'moderate'
                primary_goal = 'general_fitness'

            class DummyDiet:
                diet_preference = 'non_vegetarian'

            p = prof if prof else DummyProfile()
            d = diet if diet else DummyDiet()

            plan = NutritionEngine.generate_meal_plan(p, d)
            return JsonResponse({'success': True, 'data': plan})
        except Exception as e:
            print("Nutrition plan view error:", e)
            return JsonResponse({'success': False, 'message': 'Could not generate nutrition plan'}, status=500)
    return JsonResponse({'success': False}, status=405)


@rate_limit(key_type='user', limit=10, period_seconds=60)
def meal_scan_view(request):
    """'Snap Your Meal' — analyze a photo with Groq vision and log it against today's totals."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            image = data.get('image', '')
            if not image:
                return JsonResponse({'success': False, 'message': 'No image provided'}, status=400)

            # Validate image payload and dimensions/format
            is_valid_img, img_err = validate_image_data(image, max_size_bytes=5 * 1024 * 1024)
            if not is_valid_img:
                return JsonResponse({'success': False, 'message': f'Invalid image: {img_err}'}, status=400)

            try:
                result = MealVisionService.analyze_meal(image)
            except NotFoodError as e:
                # Don't log anything -- ask for a real food photo instead of
                # silently recording made-up nutrition numbers.
                return JsonResponse({'success': False, 'message': str(e) or "That doesn't look like food — try a clear photo of your meal."}, status=422)
            except MealVisionError as e:
                return JsonResponse({'success': False, 'message': "Couldn't read that photo clearly — please retake it with good lighting and try again."}, status=502)

            meal_name = sanitize_text(result.get('meal_name', 'Logged Meal'), max_length=150, default='Logged Meal')
            MealLog.objects.create(
                user=request.user,
                meal_name=meal_name,
                calories=int(result.get('calories', 0)),
                protein_g=float(result.get('protein_g', 0.0)),
                carbs_g=float(result.get('carbs_g', 0.0)),
                fats_g=float(result.get('fats_g', 0.0)),
                fiber_g=float(result.get('fiber_g', 0.0)),
            )
            return JsonResponse({'success': True, 'data': result})
        except Exception as e:
            print("Meal scan view error:", e)
            return JsonResponse({'success': False, 'message': 'Could not analyze meal'}, status=500)

    return JsonResponse({'success': False}, status=405)


def nutrition_today_view(request):
    """Today's logged intake totals + targets, for the donut trackers."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        try:
            today = timezone.now().date()
            logs = MealLog.objects.filter(user=request.user, logged_at__date=today)

            totals = {
                'calories': sum(l.calories for l in logs),
                'protein_g': round(sum(l.protein_g for l in logs), 1),
                'carbs_g': round(sum(l.carbs_g for l in logs), 1),
                'fats_g': round(sum(l.fats_g for l in logs), 1),
                'fiber_g': round(sum(l.fiber_g for l in logs), 1),
            }

            prof = getattr(request.user, 'fitness_profile', None)
            diet = getattr(request.user, 'dietary_profile', None)

            class DummyProfile:
                weight_kg = 70.0
                height_cm = 170.0
                age = 25
                gender = 'male'
                activity_level = 'moderate'
                primary_goal = 'general_fitness'

            class DummyDiet:
                diet_preference = 'non_vegetarian'

            targets = NutritionEngine.calculate_targets(prof or DummyProfile(), diet or DummyDiet())
            # Fiber isn't part of calculate_targets — use a standard ~14g/1000kcal guideline
            fiber_target = max(round(targets['target_calories'] / 1000 * 14), 20)

            meals = [
                {'meal_name': l.meal_name, 'calories': l.calories, 'protein_g': l.protein_g,
                 'carbs_g': l.carbs_g, 'fats_g': l.fats_g, 'fiber_g': l.fiber_g,
                 'logged_at': l.logged_at.isoformat()}
                for l in logs.order_by('-logged_at')
            ]

            return JsonResponse({'success': True, 'data': {
                'totals': totals,
                'targets': {**targets, 'target_fiber_g': fiber_target},
                'meals': meals,
            }})
        except Exception as e:
            print("Nutrition today view error:", e)
            return JsonResponse({'success': False, 'message': 'Could not load today\'s intake'}, status=500)

    return JsonResponse({'success': False}, status=405)


@rate_limit(key_type='user', limit=20, period_seconds=60)
def recipe_view(request):
    """Recipe guidance for a dish from the person's diet plan, personalized to their profile."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dish_name = sanitize_text(data.get('dish_name'), max_length=100)
            if not dish_name:
                return JsonResponse({'success': False, 'message': 'No dish specified'}, status=400)

            diet = getattr(request.user, 'dietary_profile', None)
            result = RecipeService.get_recipe(dish_name, diet)
            return JsonResponse({'success': True, 'data': result})
        except Exception as e:
            print("Recipe view error:", e)
            return JsonResponse({'success': False, 'message': 'Could not fetch recipe'}, status=500)

    return JsonResponse({'success': False}, status=405)