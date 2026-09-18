from typing import Dict, Any
from neuro_readiness import config

def check_safety(raw_inputs: Dict[str, Any], component_scores: Dict[str, float], calculated_score: float, baseline: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check for critical safety limits.
    Returns override details and capped score.
    """
    flags = []
    override = False
    
    # 1. Sleep critical
    sleep_h = raw_inputs.get('sleep_hours')
    if sleep_h is not None and sleep_h < config.SAFETY_CRITICAL_SLEEP_HOURS:
        flags.append(f"Critically low sleep (< {config.SAFETY_CRITICAL_SLEEP_HOURS}h)")
        override = True
        
    # 2. RHR elevation
    rhr = raw_inputs.get('rhr')
    base_rhr = baseline.get('rhr_baseline')
    if rhr is not None and base_rhr is not None:
        if (rhr - base_rhr) > config.SAFETY_CRITICAL_RHR_ELEVATION:
            flags.append(f"Critically elevated RHR (> {config.SAFETY_CRITICAL_RHR_ELEVATION} bpm above baseline)")
            override = True
            
    # 3. Reaction deviation
    median_ms = raw_inputs.get('reaction_median_ms')
    base_reaction = baseline.get('reaction_baseline')
    if median_ms is not None and base_reaction is not None and base_reaction > 0:
        dev = (median_ms - base_reaction) / base_reaction * 100
        if dev > config.SAFETY_CRITICAL_REACTION_DEVIATION:
            flags.append(f"Significant reaction time delay (> {config.SAFETY_CRITICAL_REACTION_DEVIATION}% slower)")
            
    # 4. Injuries
    if raw_inputs.get('has_injuries'):
        flags.append("Active injury reported")
        
    if len(flags) > 1:
        override = True
        
    capped = False
    adjusted_score = calculated_score
    if override:
        if adjusted_score > config.SAFETY_MAX_SCORE_ON_OVERRIDE:
            adjusted_score = float(config.SAFETY_MAX_SCORE_ON_OVERRIDE)
            capped = True
            
    return {
        'override': override,
        'adjusted_score': adjusted_score,
        'flags': flags,
        'capped': capped
    }
