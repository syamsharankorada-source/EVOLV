from typing import Dict, List, Any

def build_explanation(component_scores: Dict[str, float], baseline_diffs: Dict[str, float], missing_data: List[str], safety_flags: List[str], recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a structured explanation for the readiness score.
    """
    limiting_factors = []
    positive_factors = []
    
    for comp, score in component_scores.items():
        if score is None:
            continue
        if score < 70:
            limiting_factors.append(comp)
        elif score >= 85:
            positive_factors.append(comp)
            
    summary_parts = []
    if positive_factors:
        summary_parts.append(f"Strong metrics in {', '.join(positive_factors)}.")
    if limiting_factors:
        summary_parts.append(f"Needs attention: {', '.join(limiting_factors)}.")
    if safety_flags:
        summary_parts.append("Critical safety flags present.")
        
    summary = " ".join(summary_parts) if summary_parts else "Metrics are stable."
    
    return {
        'limiting_factors': limiting_factors,
        'positive_factors': positive_factors,
        'missing_signals': missing_data,
        'safety_notes': safety_flags,
        'summary': summary
    }
