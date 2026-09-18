import json
import datetime
from django.http import JsonResponse
from django.utils import timezone
from .models import DailyReadiness, ReactionTrial, UserBaseline, WorkoutOutcome
from wellness.models import WellnessLog
from neuro_readiness import (
    validation,
    sleep,
    hrv,
    resting_hr,
    reaction,
    subjective,
    training_load,
    baseline,
    scoring,
    safety,
    recommendation,
    confidence,
    explanation,
)

def auth_required(func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'message': 'Not authenticated'}, status=401)
        return func(request, *args, **kwargs)
    return wrapper


@auth_required
def check_in_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        
        # Normalize incoming payload keys
        raw_sleep = data.get('sleep_hours')
        raw_quality = data.get('sleep_quality')
        raw_hrv = data.get('hrv')
        raw_rhr = data.get('resting_heart_rate') or data.get('resting_hr') or data.get('rhr')
        raw_energy = data.get('energy') if data.get('energy') is not None else data.get('energy_level')
        raw_focus = data.get('focus') if data.get('focus') is not None else data.get('mental_focus')
        raw_fatigue = data.get('muscle_fatigue')
        raw_dur = data.get('workout_duration') or data.get('recent_workout_duration')
        raw_rpe = data.get('workout_rpe') or data.get('recent_workout_rpe')
        raw_rx_time = data.get('reaction_time') or data.get('reaction_time_ms')
        raw_rx_var = data.get('reaction_variability')
        
        normalized_data = {
            'sleep_hours': raw_sleep,
            'sleep_quality': raw_quality,
            'hrv': raw_hrv,
            'rhr': raw_rhr,
            'energy': raw_energy,
            'focus': raw_focus,
            'muscle_fatigue': raw_fatigue,
            'workout_duration': raw_dur,
            'workout_rpe': raw_rpe,
            'reaction_time_ms': raw_rx_time,
            'reaction_variability': raw_rx_var,
        }

        # Validate inputs
        cleaned_data, errors = validation.validate_check_in(normalized_data)
        
        today = timezone.now().date()
        readiness, _ = DailyReadiness.objects.get_or_create(user=request.user, date=today)
        
        # Auto-pull sleep_hours and heart_rate from WellnessLog if missing
        wellness_log = WellnessLog.objects.filter(user=request.user, date=today).first()
        if wellness_log:
            if cleaned_data.get('sleep_hours') is None and wellness_log.sleep_hours:
                cleaned_data['sleep_hours'] = wellness_log.sleep_hours
            if cleaned_data.get('rhr') is None and wellness_log.heart_rate:
                cleaned_data['rhr'] = wellness_log.heart_rate

        # Save raw inputs
        readiness.sleep_hours = cleaned_data.get('sleep_hours')
        readiness.sleep_quality = cleaned_data.get('sleep_quality')
        readiness.hrv = cleaned_data.get('hrv')
        readiness.resting_heart_rate = cleaned_data.get('rhr')
        readiness.energy = cleaned_data.get('energy')
        readiness.focus = cleaned_data.get('focus')
        readiness.muscle_fatigue = cleaned_data.get('muscle_fatigue')
        readiness.workout_duration = cleaned_data.get('workout_duration')
        readiness.workout_rpe = cleaned_data.get('workout_rpe')
        if cleaned_data.get('reaction_time_ms') is not None:
            readiness.reaction_time_ms = cleaned_data.get('reaction_time_ms')
        if cleaned_data.get('reaction_variability') is not None:
            readiness.reaction_variability = cleaned_data.get('reaction_variability')
        readiness.save()

        # Update baselines
        baseline_record = baseline.update_user_baseline(request.user)
        baselines_dict = baseline.compute_baselines(request.user)

        # Calculate component scores
        readiness.sleep_score = sleep.calculate_sleep_score(readiness.sleep_hours, readiness.sleep_quality)
        readiness.hrv_score = hrv.calculate_hrv_score(readiness.hrv, baselines_dict.get('hrv_baseline'))
        readiness.rhr_score = resting_hr.calculate_rhr_score(readiness.resting_heart_rate, baselines_dict.get('rhr_baseline'))
        readiness.reaction_score = reaction.calculate_reaction_score(
            readiness.reaction_time_ms, 
            readiness.reaction_variability, 
            baselines_dict.get('reaction_baseline')
        )
        readiness.subjective_score = subjective.calculate_subjective_score(
            readiness.energy, 
            readiness.focus, 
            readiness.muscle_fatigue
        )
        
        recent_load = training_load.calculate_recent_load(request.user)
        readiness.training_load_score = training_load.calculate_training_load_score(
            recent_load, 
            baselines_dict.get('training_load_baseline')
        )

        # Weighted calculation
        components_map = {
            'sleep': readiness.sleep_score,
            'hrv': readiness.hrv_score,
            'rhr': readiness.rhr_score,
            'reaction': readiness.reaction_score,
            'subjective': readiness.subjective_score,
            'training_load': readiness.training_load_score
        }
        
        calculated_score, eff_weights = scoring.calculate_readiness(components_map)
        readiness.calculated_score = calculated_score

        # Safety check
        raw_safety_inputs = {
            'sleep_hours': readiness.sleep_hours,
            'rhr': readiness.resting_heart_rate,
            'reaction_median_ms': readiness.reaction_time_ms,
            'has_injuries': getattr(getattr(request.user, 'fitness_profile', None), 'injuries', []) != []
        }
        safety_res = safety.check_safety(raw_safety_inputs, components_map, calculated_score, baselines_dict)
        readiness.safety_override = safety_res.get('override', False)
        readiness.safety_flags = safety_res.get('flags', [])
        readiness.final_score = safety_res.get('adjusted_score', calculated_score)

        # Category, Confidence, Recommendation, Explanation
        readiness.readiness_category = scoring.get_category(readiness.final_score)
        
        missing_data_list = [k for k, v in components_map.items() if v is None]
        readiness.missing_data = missing_data_list
        readiness.baseline_confidence = confidence.assess_confidence(
            baselines_dict.get('valid_days_count', 0),
            missing_data_list
        )
        
        rec_obj = recommendation.get_recommendation(
            readiness.final_score,
            readiness.readiness_category,
            readiness.safety_flags
        )
        
        baseline_diffs = {}
        explanation_obj = explanation.build_explanation(
            components_map,
            baseline_diffs,
            missing_data_list,
            readiness.safety_flags,
            rec_obj
        )
        readiness.explanation = explanation_obj
        readiness.save()

        conf_numeric = 0.5
        if readiness.baseline_confidence == 'HIGH':
            conf_numeric = 0.95
        elif readiness.baseline_confidence == 'MEDIUM':
            conf_numeric = 0.75
        else:
            conf_numeric = 0.40

        return JsonResponse({
            'success': True,
            'data': {
                'score': readiness.final_score,
                'final_score': readiness.final_score,
                'category': readiness.readiness_category,
                'confidence': conf_numeric,
                'baseline_confidence': readiness.baseline_confidence,
                'components': {
                    'Sleep': readiness.sleep_score or 0,
                    'HRV': readiness.hrv_score or 0,
                    'Resting HR': readiness.rhr_score or 0,
                    'Reaction': readiness.reaction_score or 0,
                    'Subjective': readiness.subjective_score or 0,
                    'Training Load': readiness.training_load_score or 0,
                },
                'limiting_factors': explanation_obj.get('limiting_factors', []),
                'positive_factors': explanation_obj.get('positive_factors', []),
                'recommendation': rec_obj.get('guidance', ''),
                'explanation': explanation_obj,
                'safety_flags': readiness.safety_flags
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@auth_required
def reaction_test_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        trials = data.get('trials', [])
        
        cleaned_trials = []
        for t in trials:
            rx = t.get('reaction_ms') or t.get('reaction_time')
            obj = ReactionTrial.objects.create(
                user=request.user,
                session_id=session_id,
                trial_num=t.get('trial_num', 0),
                reaction_ms=rx or 0.0,
                is_practice=t.get('is_practice', False),
                is_valid=t.get('is_valid', True)
            )
            if not t.get('is_practice', False):
                cleaned_trials.append({'reaction_time': rx})
        
        results = reaction.process_trials(cleaned_trials)
        return JsonResponse({'success': True, 'data': results})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@auth_required
def today_view(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    today = timezone.now().date()
    readiness = DailyReadiness.objects.filter(user=request.user, date=today).first()
    if readiness and readiness.final_score is not None:
        conf_numeric = 0.5
        if readiness.baseline_confidence == 'HIGH':
            conf_numeric = 0.95
        elif readiness.baseline_confidence == 'MEDIUM':
            conf_numeric = 0.75
        else:
            conf_numeric = 0.40

        rec_guidance = ''
        if isinstance(readiness.explanation, dict):
            rec_guidance = readiness.explanation.get('summary', '')

        return JsonResponse({
            'success': True,
            'data': {
                'score': readiness.final_score,
                'final_score': readiness.final_score,
                'category': readiness.readiness_category,
                'confidence': conf_numeric,
                'baseline_confidence': readiness.baseline_confidence,
                'components': {
                    'Sleep': readiness.sleep_score or 0,
                    'HRV': readiness.hrv_score or 0,
                    'Resting HR': readiness.rhr_score or 0,
                    'Reaction': readiness.reaction_score or 0,
                    'Subjective': readiness.subjective_score or 0,
                    'Training Load': readiness.training_load_score or 0,
                },
                'limiting_factors': readiness.explanation.get('limiting_factors', []) if isinstance(readiness.explanation, dict) else [],
                'positive_factors': readiness.explanation.get('positive_factors', []) if isinstance(readiness.explanation, dict) else [],
                'recommendation': rec_guidance,
                'explanation': readiness.explanation,
                'safety_flags': readiness.safety_flags
            }
        })
    return JsonResponse({'success': True, 'data': None})


@auth_required
def history_view(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        days = int(request.GET.get('days', 14))
    except (TypeError, ValueError):
        days = 14
        
    start_date = timezone.now().date() - datetime.timedelta(days=days)
    records = DailyReadiness.objects.filter(user=request.user, date__gte=start_date).order_by('date')
    
    data = []
    for r in records:
        data.append({
            'date': r.date.isoformat(),
            'score': r.final_score or 0,
            'final_score': r.final_score or 0,
            'category': r.readiness_category,
            'sleep_score': r.sleep_score,
            'hrv_score': r.hrv_score,
            'rhr_score': r.rhr_score,
            'reaction_score': r.reaction_score,
            'subjective_score': r.subjective_score
        })
    return JsonResponse({'success': True, 'data': data})


@auth_required
def baseline_view(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    baseline_obj = UserBaseline.objects.filter(user=request.user).first()
    if baseline_obj:
        data = {
            'hrv_baseline': baseline_obj.hrv_baseline,
            'rhr_baseline': baseline_obj.rhr_baseline,
            'reaction_baseline': baseline_obj.reaction_baseline,
            'sleep_baseline': baseline_obj.sleep_baseline,
            'training_load_baseline': baseline_obj.training_load_baseline,
            'subjective_baseline': baseline_obj.subjective_baseline,
            'valid_days_count': baseline_obj.valid_days_count
        }
        return JsonResponse({'success': True, 'data': data})
    return JsonResponse({'success': True, 'data': None})


@auth_required
def recommendation_view(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    today = timezone.now().date()
    readiness = DailyReadiness.objects.filter(user=request.user, date=today).first()
    if readiness and readiness.final_score is not None:
        rec = recommendation.get_recommendation(
            readiness.final_score,
            readiness.readiness_category,
            readiness.safety_flags
        )
        return JsonResponse({'success': True, 'data': rec})
    return JsonResponse({'success': True, 'data': None})


@auth_required
def workout_outcome_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        today = timezone.now().date()
        readiness = DailyReadiness.objects.filter(user=request.user, date=today).first()
        if not readiness:
            return JsonResponse({'success': False, 'message': 'No readiness record for today'}, status=400)
            
        outcome = WorkoutOutcome.objects.create(
            user=request.user,
            date=today,
            readiness_before=readiness.final_score or 0.0,
            recommended_intensity=readiness.readiness_category,
            actual_duration=data.get('actual_duration'),
            actual_rpe=data.get('actual_rpe'),
            performance_rating=data.get('performance_rating'),
            notes=data.get('notes', '')
        )
        return JsonResponse({'success': True, 'data': {'id': outcome.id}})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@auth_required
def analytics_view(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

    outcomes = WorkoutOutcome.objects.filter(user=request.user).order_by('-date')
    data_list = []
    scores = []
    performances = []
    
    for o in outcomes:
        data_list.append({
            'date': o.date.isoformat(),
            'readiness_before': o.readiness_before,
            'performance_rating': o.performance_rating
        })
        if o.readiness_before is not None and o.performance_rating is not None:
            scores.append(o.readiness_before)
            performances.append(o.performance_rating)
            
    correlation = None
    n = len(scores)
    if n > 2:
        sum_x = sum(scores)
        sum_y = sum(performances)
        sum_x2 = sum(x**2 for x in scores)
        sum_y2 = sum(y**2 for y in performances)
        sum_xy = sum(x*y for x, y in zip(scores, performances))
        
        numerator = (n * sum_xy) - (sum_x * sum_y)
        denominator = ((n * sum_x2 - sum_x**2) * (n * sum_y2 - sum_y**2)) ** 0.5
        if denominator != 0:
            correlation = numerator / denominator
            
    return JsonResponse({
        'success': True,
        'data': {
            'outcomes': data_list,
            'correlation': correlation
        }
    })
