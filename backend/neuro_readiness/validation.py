from typing import Dict, List, Tuple, Any

from neuro_readiness import config

def _clamp_and_validate(value: float | None, valid_range: Tuple[float, float]) -> float | None:
    """Validate and clamp a numerical value to a specific range."""
    if value is None:
        return None
    try:
        val = float(value)
    except (TypeError, ValueError):
        return None
    
    if val < valid_range[0]:
        return valid_range[0]
    if val > valid_range[1]:
        return valid_range[1]
    return val


def validate_check_in(data: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Validate all check-in fields.
    Returns (cleaned_data, errors).
    """
    cleaned_data = {}
    errors = []
    
    # Validation mapping (field_name, valid_range, is_int)
    validations = {
        'sleep_hours': (config.VALID_SLEEP_HOURS, False),
        'sleep_quality': (config.VALID_SLEEP_QUALITY, True),
        'hrv': (config.VALID_HRV, False),
        'rhr': (config.VALID_RHR, True),
        'energy': (config.VALID_ENERGY, True),
        'focus': (config.VALID_FOCUS, True),
        'muscle_fatigue': (config.VALID_FATIGUE, True)
    }
    
    for field, (v_range, is_int) in validations.items():
        if field in data and data[field] is not None:
            val = _clamp_and_validate(data[field], v_range)
            if val is None:
                errors.append(f"Invalid value for {field}")
            else:
                cleaned_data[field] = int(val) if is_int else val
        else:
            cleaned_data[field] = None
            
    # Include unvalidated fields as is, or apply specific validation
    if 'has_injuries' in data:
        cleaned_data['has_injuries'] = bool(data.get('has_injuries'))
        
    return cleaned_data, errors


def validate_reaction_trials(trials: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Validates a list of trial data dictionaries.
    Requires at least 'reaction_time' in each trial.
    """
    cleaned_trials = []
    errors = []
    
    if not isinstance(trials, list):
        return [], ["trials must be a list"]
        
    for idx, trial in enumerate(trials):
        if not isinstance(trial, dict):
            errors.append(f"Trial {idx} is not a dictionary")
            continue
            
        rt = trial.get('reaction_time')
        if rt is not None:
            try:
                rt_val = float(rt)
                cleaned_trials.append({'reaction_time': rt_val})
            except (TypeError, ValueError):
                errors.append(f"Invalid reaction_time in trial {idx}")
        else:
            errors.append(f"Missing reaction_time in trial {idx}")
            
    return cleaned_trials, errors


def identify_missing_data(data: Dict[str, Any]) -> List[str]:
    """
    Identifies missing fields from a check-in.
    """
    missing = []
    expected_fields = ['sleep_hours', 'sleep_quality', 'hrv', 'rhr', 'energy', 'focus', 'muscle_fatigue']
    
    for field in expected_fields:
        if data.get(field) is None:
            missing.append(field)
            
    return missing
