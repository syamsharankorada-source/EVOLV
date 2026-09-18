from datetime import timedelta
from django.utils import timezone
from typing import Optional
from neuro_readiness import config

def calculate_session_load(duration_minutes: int, rpe: int) -> int:
    """Calculate the training load for a single session."""
    if duration_minutes is None or rpe is None:
        return 0
    return duration_minutes * rpe

def calculate_recent_load(user, lookback_days: int = 7) -> float:
    """Calculate total training load for the user over recent days."""
    try:
        from fitness.models import WorkoutLog
    except ImportError:
        return 0.0

    end_date = timezone.now()
    start_date = end_date - timedelta(days=lookback_days)
    
    recent_workouts = WorkoutLog.objects.filter(
        user=user,
        completed_at__gte=start_date,
        completed_at__lte=end_date
    )
    
    total_load = 0.0
    for workout in recent_workouts:
        duration = workout.duration_minutes or 0
        rpe = config.DEFAULT_RPE
        if hasattr(workout, 'difficulty_feedback') and workout.difficulty_feedback:
            rpe = config.DIFFICULTY_TO_RPE.get(workout.difficulty_feedback, config.DEFAULT_RPE)
        elif hasattr(workout, 'rpe') and workout.rpe:
            rpe = workout.rpe
            
        total_load += calculate_session_load(duration, rpe)
        
    return total_load

def calculate_training_load_score(recent_load: float, baseline_load: Optional[float]) -> Optional[float]:
    """Calculate training load score based on deviation from baseline load."""
    if baseline_load is None or baseline_load <= 0:
        return None
        
    deviation_percent = (recent_load - baseline_load) / baseline_load * 100
    
    score = 0.0
    for i in range(len(config.TRAINING_LOAD_DEVIATION_POINTS) - 1):
        d1, s1 = config.TRAINING_LOAD_DEVIATION_POINTS[i]
        d2, s2 = config.TRAINING_LOAD_DEVIATION_POINTS[i+1]
        
        if d1 <= deviation_percent <= d2:
            progress = (deviation_percent - d1) / (d2 - d1)
            score = s1 + progress * (s2 - s1)
            break
    else:
        if deviation_percent < config.TRAINING_LOAD_DEVIATION_POINTS[0][0]:
            score = config.TRAINING_LOAD_DEVIATION_POINTS[0][1]
        elif deviation_percent > config.TRAINING_LOAD_DEVIATION_POINTS[-1][0]:
            score = config.TRAINING_LOAD_DEVIATION_POINTS[-1][1]
            
    return max(0.0, min(100.0, float(score)))
