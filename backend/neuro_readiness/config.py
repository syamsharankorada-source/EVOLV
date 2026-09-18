# Score weights (must sum to 1.0)
WEIGHTS = {
    'sleep': 0.20,
    'hrv': 0.20,
    'reaction': 0.20,
    'training_load': 0.20,
    'subjective': 0.10,
    'rhr': 0.10,
}

# Sleep duration thresholds: (min_hours, max_hours, score)
SLEEP_DURATION_THRESHOLDS = [
    (8.0, float('inf'), 100),
    (7.0, 8.0, 90),
    (6.0, 7.0, 75),
    (5.0, 6.0, 55),
    (0.0, 5.0, 30),
]

SLEEP_DURATION_WEIGHT = 0.70
SLEEP_QUALITY_WEIGHT = 0.30

# HRV deviation thresholds: (deviation_percent, score) for interpolation
HRV_DEVIATION_POINTS = [
    (0, 100),    # at or above baseline
    (-5, 90),
    (-10, 80),
    (-15, 65),
    (-20, 50),
    (-25, 35),
]

# RHR deviation thresholds: (bpm_above_baseline, score) for interpolation
RHR_DEVIATION_POINTS = [
    (0, 100),
    (2, 100),
    (4, 90),
    (6, 80),
    (9, 65),
    (10, 45),
]

# Reaction deviation thresholds: (percent_above_baseline, score)
REACTION_DEVIATION_POINTS = [
    (0, 100),    # at or faster than baseline
    (5, 90),
    (10, 80),
    (15, 70),
    (20, 60),
    (30, 40),
    (50, 30),
]

# Reaction variability penalty
REACTION_VARIABILITY_PENALTY_THRESHOLD = 50  # ms std dev
REACTION_VARIABILITY_MAX_PENALTY = 15  # max points deducted

# Reaction validity
REACTION_MIN_VALID_MS = 150  # below = anticipation
REACTION_MAX_VALID_MS = 1500  # above = distraction
REACTION_TRIAL_COUNT = 5
REACTION_PRACTICE_COUNT = 1

# Training load thresholds: (deviation_percent, score)
TRAINING_LOAD_DEVIATION_POINTS = [
    (-20, 100),   # well below baseline = very recovered
    (0, 90),      # at baseline
    (10, 80),
    (20, 70),
    (30, 60),
    (50, 45),
    (75, 30),
]

TRAINING_LOAD_LOOKBACK_DAYS = 7
TRAINING_LOAD_BASELINE_DAYS = 28

# Difficulty feedback -> RPE mapping
DIFFICULTY_TO_RPE = {
    'too_easy': 3,
    'comfortable': 5,
    'challenging': 7,
    'too_difficult': 9,
}
DEFAULT_RPE = 5

# Baseline confidence thresholds
CONFIDENCE_LOW_MAX_DAYS = 6
CONFIDENCE_MEDIUM_MAX_DAYS = 13
# 14+ = HIGH

# Readiness categories
CATEGORY_THRESHOLDS = [
    (90, 'PERFORMANCE'),
    (80, 'HIGH'),
    (70, 'MODERATE'),
    (60, 'REDUCED'),
    (0, 'RECOVERY'),
]

# Safety thresholds
SAFETY_CRITICAL_SLEEP_HOURS = 4.0
SAFETY_CRITICAL_RHR_ELEVATION = 15  # BPM above baseline
SAFETY_CRITICAL_REACTION_DEVIATION = 40  # percent above baseline
SAFETY_MAX_SCORE_ON_OVERRIDE = 59  # caps score to RECOVERY

# Subjective ranges
SUBJECTIVE_MIN = 1
SUBJECTIVE_MAX = 10

# Validation ranges
VALID_SLEEP_HOURS = (0.0, 24.0)
VALID_SLEEP_QUALITY = (1, 5)
VALID_HRV = (5.0, 300.0)
VALID_RHR = (30, 220)
VALID_ENERGY = (1, 10)
VALID_FOCUS = (1, 10)
VALID_FATIGUE = (1, 10)
VALID_RPE = (1, 10)
VALID_DURATION = (1, 480)
