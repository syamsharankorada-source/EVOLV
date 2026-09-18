from typing import Optional
from neuro_readiness import config

def calculate_subjective_score(energy: Optional[int], focus: Optional[int], muscle_fatigue: Optional[int]) -> Optional[float]:
    """
    Calculate subjective score based on energy, focus, and muscle fatigue (1-10).
    Higher energy and focus is good, higher muscle fatigue is bad (so we invert it).
    """
    if energy is None and focus is None and muscle_fatigue is None:
        return None
        
    values = []
    if energy is not None:
        values.append(energy)
    if focus is not None:
        values.append(focus)
    if muscle_fatigue is not None:
        values.append(11 - muscle_fatigue)
        
    if not values:
        return None
        
    max_possible = len(values) * 10
    total = sum(values)
    
    score = (total / max_possible) * 100
    return max(0.0, min(100.0, float(score)))
