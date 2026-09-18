from typing import Optional
from neuro_readiness import config

def calculate_sleep_score(sleep_hours: Optional[float], sleep_quality: Optional[int]) -> Optional[float]:
    """
    Calculate sleep score based on duration and quality.
    Duration accounts for 70% and quality for 30%.
    If quality is None, duration accounts for 100%.
    """
    if sleep_hours is None:
        return None
        
    duration_score = 0.0
    for i, (min_h, max_h, score) in enumerate(config.SLEEP_DURATION_THRESHOLDS):
        if min_h <= sleep_hours < max_h:
            # Check if we can interpolate
            if i > 0 and sleep_hours < max_h:
                prev_min_h, prev_max_h, prev_score = config.SLEEP_DURATION_THRESHOLDS[i-1]
                # Linear interpolation
                range_span = max_h - min_h
                progress = (sleep_hours - min_h) / range_span if range_span > 0 else 0
                duration_score = score + progress * (prev_score - score)
            else:
                duration_score = score
            break
            
    if sleep_quality is None:
        final_score = duration_score
    else:
        # Map 1-5 to 0-100: (q * 20)
        quality_score = max(0, min(100, sleep_quality * 20))
        final_score = (duration_score * config.SLEEP_DURATION_WEIGHT) + (quality_score * config.SLEEP_QUALITY_WEIGHT)
        
    return max(0.0, min(100.0, float(final_score)))
