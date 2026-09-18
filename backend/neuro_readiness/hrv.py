from typing import Optional
from neuro_readiness import config

def calculate_hrv_score(today_hrv: Optional[float], baseline_hrv: Optional[float]) -> Optional[float]:
    """
    Calculate HRV score based on deviation from baseline.
    """
    if today_hrv is None or baseline_hrv is None or baseline_hrv <= 0:
        return None
        
    deviation_percent = (today_hrv - baseline_hrv) / baseline_hrv * 100
    
    if deviation_percent >= 0:
        return 100.0
        
    score = 0.0
    # Interpolate from HRV_DEVIATION_POINTS
    # Points are sorted in descending order of deviation (-5, -10, etc)
    for i in range(len(config.HRV_DEVIATION_POINTS) - 1):
        d1, s1 = config.HRV_DEVIATION_POINTS[i]
        d2, s2 = config.HRV_DEVIATION_POINTS[i+1]
        
        if d2 <= deviation_percent <= d1:
            progress = (deviation_percent - d2) / (d1 - d2)
            score = s2 + progress * (s1 - s2)
            break
    else:
        # Below lowest point
        if deviation_percent < config.HRV_DEVIATION_POINTS[-1][0]:
            score = config.HRV_DEVIATION_POINTS[-1][1]
            
    return max(0.0, min(100.0, float(score)))
