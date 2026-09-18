import statistics
from typing import List, Dict, Optional, Any
from neuro_readiness import config

def process_trials(trials: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process reaction time trials, filtering invalid ones and returning stats.
    """
    valid_rts = []
    invalid_count = 0
    
    for trial in trials:
        rt = trial.get('reaction_time')
        if rt is not None and isinstance(rt, (int, float)):
            if config.REACTION_MIN_VALID_MS <= rt <= config.REACTION_MAX_VALID_MS:
                valid_rts.append(rt)
            else:
                invalid_count += 1
                
    valid_count = len(valid_rts)
    
    if valid_count < 2:
        return {
            'median_ms': None,
            'mean_ms': None,
            'std_dev_ms': None,
            'valid_count': valid_count,
            'invalid_count': invalid_count
        }
        
    return {
        'median_ms': statistics.median(valid_rts),
        'mean_ms': statistics.mean(valid_rts),
        'std_dev_ms': statistics.stdev(valid_rts) if valid_count > 1 else 0.0,
        'valid_count': valid_count,
        'invalid_count': invalid_count
    }


def calculate_reaction_score(median_ms: Optional[float], variability_ms: Optional[float], baseline_ms: Optional[float]) -> Optional[float]:
    """
    Calculate reaction time score based on deviation from baseline and variability.
    """
    if median_ms is None or baseline_ms is None or baseline_ms <= 0:
        return None
        
    deviation_percent = (median_ms - baseline_ms) / baseline_ms * 100
    
    if deviation_percent <= 0:
        base_score = 100.0
    else:
        base_score = 0.0
        for i in range(len(config.REACTION_DEVIATION_POINTS) - 1):
            d1, s1 = config.REACTION_DEVIATION_POINTS[i]
            d2, s2 = config.REACTION_DEVIATION_POINTS[i+1]
            
            if d1 <= deviation_percent <= d2:
                progress = (deviation_percent - d1) / (d2 - d1)
                base_score = s1 + progress * (s2 - s1)
                break
        else:
            if deviation_percent > config.REACTION_DEVIATION_POINTS[-1][0]:
                base_score = config.REACTION_DEVIATION_POINTS[-1][1]
                
    # Apply variability penalty
    penalty = 0.0
    if variability_ms is not None and variability_ms > config.REACTION_VARIABILITY_PENALTY_THRESHOLD:
        excess = variability_ms - config.REACTION_VARIABILITY_PENALTY_THRESHOLD
        # Max penalty reached at 2x threshold over
        penalty = min(config.REACTION_VARIABILITY_MAX_PENALTY, (excess / config.REACTION_VARIABILITY_PENALTY_THRESHOLD) * config.REACTION_VARIABILITY_MAX_PENALTY)
        
    final_score = base_score - penalty
    return max(0.0, min(100.0, float(final_score)))
