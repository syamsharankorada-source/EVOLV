from typing import List, Dict, Any
from neuro_readiness import config

def assess_confidence(valid_days: int, missing_data: List[str], reaction_quality: Dict[str, Any] = None) -> str:
    """
    Assess confidence level of the readiness score.
    """
    level = 2 # 0: LOW, 1: MEDIUM, 2: HIGH
    
    if valid_days <= config.CONFIDENCE_LOW_MAX_DAYS:
        level = 0
    elif valid_days <= config.CONFIDENCE_MEDIUM_MAX_DAYS:
        level = min(level, 1)
        
    if missing_data and len(missing_data) >= 3:
        level -= 1
        
    if reaction_quality:
        valid_count = reaction_quality.get('valid_count', 0)
        if valid_count < 3:
            level -= 1
            
    level = max(0, level)
    
    return ['LOW', 'MEDIUM', 'HIGH'][level]
