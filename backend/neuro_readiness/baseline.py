import statistics
from datetime import timedelta
from django.utils import timezone
from typing import Dict, Any, Optional

def compute_baselines(user) -> Dict[str, Any]:
    """Compute historical baselines from DailyReadiness records."""
    try:
        from neuro_readiness.models import DailyReadiness
    except ImportError:
        return {}

    # Get recent records (e.g., last 28 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=28)
    records = DailyReadiness.objects.filter(
        user=user, 
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    hrvs, rhrs, reactions, sleeps, subjective_scores = [], [], [], [], []
    valid_days = set()
    
    for r in records:
        if r.hrv: hrvs.append(r.hrv)
        if r.resting_heart_rate: rhrs.append(r.resting_heart_rate)
        if r.reaction_time_ms: reactions.append(r.reaction_time_ms)
        if r.sleep_hours: sleeps.append(r.sleep_hours)
        if r.subjective_score: subjective_scores.append(r.subjective_score)
        valid_days.add(r.created_at.date())
        
    baselines = {
        'valid_days_count': len(valid_days),
        'hrv_baseline': statistics.median(hrvs) if hrvs else None,
        'rhr_baseline': statistics.median(rhrs) if rhrs else None,
        'reaction_baseline': statistics.median(reactions) if reactions else None,
        'sleep_baseline': statistics.median(sleeps) if sleeps else None,
        'subjective_baseline': statistics.median(subjective_scores) if subjective_scores else None,
        # training load baseline calculation would typically aggregate weekly loads here
        # simplifying for now or relying on external calculation if needed
        'training_load_baseline': None 
    }
    
    return baselines

def update_user_baseline(user) -> Any:
    """Compute and save baselines to UserBaseline model."""
    try:
        from neuro_readiness.models import UserBaseline
    except ImportError:
        return None

    baselines = compute_baselines(user)
    
    baseline_record, created = UserBaseline.objects.get_or_create(user=user)
    
    if baselines['hrv_baseline'] is not None:
        baseline_record.hrv_baseline = baselines['hrv_baseline']
    if baselines['rhr_baseline'] is not None:
        baseline_record.rhr_baseline = baselines['rhr_baseline']
    if baselines['reaction_baseline'] is not None:
        baseline_record.reaction_baseline = baselines['reaction_baseline']
    if baselines['sleep_baseline'] is not None:
        baseline_record.sleep_baseline = baselines['sleep_baseline']
    if baselines['subjective_baseline'] is not None:
        baseline_record.subjective_baseline = baselines['subjective_baseline']
        
    baseline_record.valid_days_count = baselines['valid_days_count']
    baseline_record.save()
    
    return baseline_record
