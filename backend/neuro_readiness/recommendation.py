from typing import Dict, List, Any

def get_recommendation(score: float, category: str, safety_flags: List[str] = None) -> Dict[str, Any]:
    """
    Generate recommendation based on score category and safety flags.
    """
    recommendation = {
        'intensity': 'low',
        'guidance': '',
        'suggestions': []
    }
    
    if category == 'PERFORMANCE':
        recommendation['intensity'] = 'high'
        recommendation['guidance'] = 'Prime condition. Ready for maximal effort and high intensity training.'
        recommendation['suggestions'] = ['Push for personal bests', 'Focus on high-intensity intervals', 'Heavy strength training is optimal']
    elif category == 'HIGH':
        recommendation['intensity'] = 'moderate-high'
        recommendation['guidance'] = 'Good condition. Proceed with normal training plan.'
        recommendation['suggestions'] = ['Maintain normal volume', 'Standard strength/cardio sessions', 'Good day for skill work']
    elif category == 'MODERATE':
        recommendation['intensity'] = 'moderate'
        recommendation['guidance'] = 'Average readiness. Avoid maximal effort.'
        recommendation['suggestions'] = ['Reduce overall volume by 10-20%', 'Focus on maintenance', 'Avoid pushing to absolute failure']
    elif category == 'REDUCED':
        recommendation['intensity'] = 'low-moderate'
        recommendation['guidance'] = 'Reduced readiness. Consider lighter day.'
        recommendation['suggestions'] = ['Focus on technique', 'Light aerobic work', 'Reduce intensity and volume significantly']
    else: # RECOVERY
        recommendation['intensity'] = 'low'
        recommendation['guidance'] = 'Prioritize recovery.'
        recommendation['suggestions'] = ['Active recovery only (walking, mobility)', 'Focus on rest and hydration', 'Avoid strenuous exercise']
        
    if safety_flags:
        recommendation['suggestions'].extend([f"Safety Warning: {flag}" for flag in safety_flags])
        
    return recommendation
