from typing import Dict, List, Tuple, Any
from neuro_readiness import config

def calculate_readiness(components: Dict[str, float], weights: Dict[str, float] = None, missing_data: List[str] = None) -> Tuple[float, Dict[str, float]]:
    """
    Calculate final readiness score using weighted sum.
    Redistributes weight if some components are None.
    """
    base_weights = weights or config.WEIGHTS
    effective_weights = {}
    
    available_weight_sum = 0.0
    for key, score in components.items():
        if score is not None:
            available_weight_sum += base_weights.get(key, 0.0)
            
    if available_weight_sum == 0.0:
        return 0.0, {}
        
    score_sum = 0.0
    for key, score in components.items():
        if score is not None:
            # Re-proportion weight
            orig_w = base_weights.get(key, 0.0)
            eff_w = orig_w / available_weight_sum
            effective_weights[key] = eff_w
            score_sum += score * eff_w
            
    final_score = max(0.0, min(100.0, float(score_sum)))
    return final_score, effective_weights

def get_category(score: float) -> str:
    """Map a 0-100 score to a categorical string."""
    for threshold, category in config.CATEGORY_THRESHOLDS:
        if score >= threshold:
            return category
    return config.CATEGORY_THRESHOLDS[-1][1]
