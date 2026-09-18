from typing import Optional
from neuro_readiness import config

def calculate_rhr_score(today_rhr: Optional[int], baseline_rhr: Optional[float]) -> Optional[float]:
    """
    Calculate Resting Heart Rate score based on bpm above baseline.
    """
    if today_rhr is None or baseline_rhr is None:
        return None
        
    bpm_above = today_rhr - baseline_rhr
    
    if bpm_above <= 0:
        return 100.0
        
    score = 0.0
    for i in range(len(config.RHR_DEVIATION_POINTS) - 1):
        d1, s1 = config.RHR_DEVIATION_POINTS[i]
        d2, s2 = config.RHR_DEVIATION_POINTS[i+1]
        
        if d1 <= bpm_above <= d2:
            progress = (bpm_above - d1) / (d2 - d1)
            score = s1 + progress * (s2 - s1)
            break
    else:
        # Above highest point
        if bpm_above > config.RHR_DEVIATION_POINTS[-1][0]:
            score = config.RHR_DEVIATION_POINTS[-1][1]
            
    return max(0.0, min(100.0, float(score)))
