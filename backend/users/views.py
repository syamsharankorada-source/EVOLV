import json
import uuid
import logging
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import login, logout
from users.models import User
from users.services.otp_service import OTPService
from Fit_AI.security import (
    validate_phone,
    sanitize_text,
    validate_int,
    validate_float,
    validate_choice,
)
from Fit_AI.rate_limiter import rate_limit, get_client_ip

auth_logger = logging.getLogger('auth_audit')
sec_logger = logging.getLogger('security')


@ensure_csrf_cookie
def index(request):
    """Render SPA shell with CSRF cookie set."""
    return render(request, 'fit.html')


@rate_limit(key_type='phone', limit=5, period_seconds=300, message='Too many OTP requests. Please wait 5 minutes before trying again.')
def request_otp(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON body'}, status=400)

    raw_phone = data.get('phone', '')
    is_valid, phone = validate_phone(raw_phone)
    if not is_valid:
        return JsonResponse({
            'success': False,
            'message': 'Please enter a valid phone number (10 to 15 digits).'
        }, status=400)

    otp = OTPService.generate_otp(phone)
    ip = get_client_ip(request)
    auth_logger.info(f"OTP requested for phone ...{phone[-4:]} from IP {ip}")

    # Dispatch OTP through configured SMS backend (console, twilio, msg91, etc.)
    try:
        from users.services.sms_service import get_sms_service
        sms_service = get_sms_service()
        sms_service.send_otp(phone, otp)
    except Exception as e:
        auth_logger.error(f"SMS delivery error: {e}")

    resp = {'success': True, 'message': 'OTP sent successfully'}
    # In local development only, return dev_otp for ease of automated testing
    if settings.DEBUG:
        resp['dev_otp'] = otp

    return JsonResponse(resp)


@ensure_csrf_cookie
@rate_limit(key_type='phone', limit=5, period_seconds=300, message='Too many failed attempts. Please wait 5 minutes before trying again.')
def verify_otp(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'success': False, 'message': 'Invalid JSON body'}, status=400)

    raw_phone = data.get('phone', '')
    submitted_otp = str(data.get('otp', '')).strip()

    is_valid_phone, phone = validate_phone(raw_phone)
    if not is_valid_phone:
        return JsonResponse({'success': False, 'message': 'Invalid phone number.'}, status=400)

    is_valid, err_msg = OTPService.verify_otp(phone, submitted_otp)
    if not is_valid:
        return JsonResponse({'success': False, 'message': err_msg}, status=400)

    # Resolve or create user with normalized username
    username = f"usr_{phone}"
    user, created = User.objects.get_or_create(username=username)
    if user.is_guest:
        user.is_guest = False
        user.save(update_fields=['is_guest'])

    # Rotate session key to prevent session fixation attacks
    if request.session.session_key:
        request.session.cycle_key()

    login(request, user)
    ip = get_client_ip(request)
    auth_logger.info(f"User {user.username} logged in successfully via OTP from IP {ip}")

    return JsonResponse({
        'success': True,
        'data': {
            'name': user.first_name or 'Athlete',
            'is_onboarded': user.is_onboarded,
            'is_guest': False
        }
    })


@ensure_csrf_cookie
@rate_limit(key_type='ip', limit=10, period_seconds=3600, message='Too many guest accounts created from this IP. Please sign in.')
def guest_login(request):
    """Create a throwaway guest account with default profiles."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        from users.models import FitnessProfile, DietaryProfile, HealthProfile

        guest_id = uuid.uuid4().hex[:12]
        user = User.objects.create_user(username=f"guest_{guest_id}")
        user.is_guest = True
        user.is_onboarded = True
        user.save()

        FitnessProfile.objects.get_or_create(user=user)
        DietaryProfile.objects.get_or_create(user=user)
        HealthProfile.objects.get_or_create(user=user)

        if request.session.session_key:
            request.session.cycle_key()

        login(request, user)
        ip = get_client_ip(request)
        auth_logger.info(f"Guest session created: {user.username} from IP {ip}")

        return JsonResponse({
            'success': True,
            'data': {'name': 'Guest', 'is_onboarded': True, 'is_guest': True}
        })
    except Exception as e:
        sec_logger.error(f"Guest login error: {e}")
        return JsonResponse({'success': False, 'message': 'Could not start guest session'}, status=500)


def logout_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        if request.user.is_authenticated:
            user = request.user
            ip = get_client_ip(request)
            auth_logger.info(f"User {user.username} logged out from IP {ip}")

            if user.is_guest:
                logout(request)
                user.delete()
            else:
                logout(request)
        else:
            logout(request)
    except Exception as e:
        sec_logger.error(f"Logout error: {e}")
    return JsonResponse({'success': True})


def get_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated', 'data': None}, status=401)

    return JsonResponse({
        'success': True,
        'data': {
            'name': request.user.first_name or ('Guest' if request.user.is_guest else 'Athlete'),
            'is_onboarded': request.user.is_onboarded,
            'is_guest': request.user.is_guest,
        }
    })


def profile_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)

    try:
        fp = getattr(request.user, 'fitness_profile', None)
        dp = getattr(request.user, 'dietary_profile', None)
        data = {
            'name': request.user.first_name or ('Guest' if request.user.is_guest else 'Athlete'),
            'age': fp.age if fp else 25,
            'age_group': fp.age_group if fp else '',
            'gender': fp.gender if fp else 'male',
            'height_cm': fp.height_cm if fp else 170.0,
            'weight_kg': fp.weight_kg if fp else 70.0,
            'target_weight_kg': fp.target_weight_kg if fp else None,
            'bmi': fp.bmi if fp else 0.0,
            'fitness_level': fp.fitness_level if fp else 'beginner',
            'activity_level': fp.activity_level if fp else 'moderate',
            'available_equipment': fp.available_equipment if fp else [],
            'preferred_duration_minutes': fp.preferred_duration_minutes if fp else 30,
            'workout_days_per_week': fp.workout_days_per_week if fp else 3,
            'wearable_device': fp.wearable_device if fp else 'none',
            'sleep_hours_avg': fp.sleep_hours_avg if fp else '7_8',
            'sitting_time': fp.sitting_time if fp else 'moderate',
            'goal': (fp.primary_goal if fp else 'general_fitness'),
            'secondary_goals': fp.secondary_goals if fp else [],
            'notifications': fp.notifications if fp else {},
            'preferred_location': fp.preferred_location if fp else 'home',
            'limitations': fp.limitations if fp else [],
            'injuries': fp.injuries if fp else [],
            'diet_preference': dp.diet_preference if dp else 'non_veg',
            'allergies': dp.allergies if dp else [],
            'meals_per_day': dp.meals_per_day if dp else 3,
            'water_target_ml': dp.water_target_ml if dp else 2500,
        }
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        sec_logger.error(f"Profile view error: {e}")
        return JsonResponse({'success': False, 'message': 'Could not load profile'}, status=500)


def onboarding_view(request):
    """Strictly validates and saves onboarding profile data for authenticated users."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required to save profile'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        user = request.user

        # Sanitize name
        raw_name = data.get('name')
        if raw_name:
            clean_name = sanitize_text(raw_name, max_length=100, allow_newlines=False)
            if clean_name:
                user.first_name = clean_name

        if user.is_guest:
            user.is_guest = False
        user.is_onboarded = True
        user.save()

        from users.models import FitnessProfile, DietaryProfile, HealthProfile

        fp, _ = FitnessProfile.objects.get_or_create(user=user)
        fp.age = validate_int(data.get('age'), default=fp.age, min_val=10, max_val=120)
        fp.age_group = sanitize_text(data.get('age_group', fp.age_group), max_length=50, allow_newlines=False)
        fp.gender = validate_choice(data.get('gender'), {'male', 'female', 'other'}, default=fp.gender)
        fp.height_cm = validate_float(data.get('height_cm'), default=fp.height_cm, min_val=50.0, max_val=260.0)
        fp.weight_kg = validate_float(data.get('weight_kg'), default=fp.weight_kg, min_val=20.0, max_val=400.0)

        raw_target_wt = data.get('target_weight_kg')
        if raw_target_wt is not None:
            fp.target_weight_kg = validate_float(raw_target_wt, default=None, min_val=20.0, max_val=400.0)

        fp.fitness_level = validate_choice(data.get('fitness_level'), {'beginner', 'intermediate', 'advanced'}, default=fp.fitness_level)
        fp.activity_level = validate_choice(data.get('activity_level'), {'sedentary', 'light', 'moderate', 'very_active'}, default=fp.activity_level)

        # Available equipment validation
        equipment = data.get('available_equipment')
        if isinstance(equipment, str):
            equipment = [equipment]
        if isinstance(equipment, list):
            fp.available_equipment = [sanitize_text(e, max_length=50) for e in equipment if e][:20]

        fp.preferred_duration_minutes = validate_int(data.get('preferred_duration_minutes'), default=fp.preferred_duration_minutes, min_val=5, max_val=180)
        fp.workout_days_per_week = validate_int(data.get('workout_days_per_week'), default=fp.workout_days_per_week, min_val=1, max_val=7)
        fp.wearable_device = sanitize_text(data.get('wearable_device', fp.wearable_device), max_length=50, allow_newlines=False)
        fp.sleep_hours_avg = sanitize_text(data.get('sleep_hours_avg', fp.sleep_hours_avg), max_length=20, allow_newlines=False)
        fp.sitting_time = sanitize_text(data.get('sitting_time', fp.sitting_time), max_length=20, allow_newlines=False)
        fp.preferred_location = sanitize_text(data.get('preferred_location') or data.get('location', fp.preferred_location), max_length=50, allow_newlines=False)

        goals = data.get('primary_goal') or data.get('goals')
        if isinstance(goals, list) and goals:
            fp.primary_goal = sanitize_text(goals[0], max_length=50, allow_newlines=False)
            fp.secondary_goals = [sanitize_text(g, max_length=50, allow_newlines=False) for g in goals[1:]][:5]
        elif isinstance(goals, str) and goals:
            fp.primary_goal = sanitize_text(goals, max_length=50, allow_newlines=False)

        # Sanitize limitations & injuries lists
        raw_limitations = data.get('limitations')
        if isinstance(raw_limitations, str):
            raw_limitations = [raw_limitations] if raw_limitations and raw_limitations.lower() != 'none' else []
        if isinstance(raw_limitations, list):
            fp.limitations = [sanitize_text(item, max_length=100) for item in raw_limitations if item][:20]

        raw_injuries = data.get('injuries') or data.get('injury')
        if isinstance(raw_injuries, str):
            raw_injuries = [raw_injuries] if raw_injuries.strip() else []
        if isinstance(raw_injuries, list):
            fp.injuries = [sanitize_text(item, max_length=100) for item in raw_injuries if item][:20]

        fp.save()

        # Dietary Profile validation
        dp, _ = DietaryProfile.objects.get_or_create(user=user)
        dp.diet_preference = sanitize_text(data.get('diet_preference', dp.diet_preference), max_length=50, allow_newlines=False)

        raw_allergies = data.get('allergies')
        if isinstance(raw_allergies, str):
            raw_allergies = [a.strip() for a in raw_allergies.split(',') if a.strip()]
        if isinstance(raw_allergies, list):
            dp.allergies = [sanitize_text(a, max_length=100) for a in raw_allergies if a][:20]

        dp.meals_per_day = validate_int(data.get('meals_per_day'), default=dp.meals_per_day, min_val=1, max_val=10)
        dp.water_target_ml = validate_int(data.get('water_target_ml'), default=dp.water_target_ml, min_val=500, max_val=10000)
        dp.save()

        HealthProfile.objects.get_or_create(user=user)
        return JsonResponse({'success': True})

    except Exception as e:
        sec_logger.error(f"Onboarding save error: {e}")
        return JsonResponse({'success': False, 'message': 'Could not save profile data'}, status=500)


def family_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
    return JsonResponse({'success': True, 'data': []})