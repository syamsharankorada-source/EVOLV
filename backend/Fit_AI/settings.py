import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# BASE_DIR is the backend package directory: d:\fitainew\backend
BASE_DIR = Path(__file__).resolve().parent.parent

# PROJECT_ROOT is the corporate workspace root: d:\fitainew
PROJECT_ROOT = BASE_DIR.parent

# Ensure backend directory is in sys.path so all app imports work seamlessly
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env from PROJECT_ROOT or BASE_DIR
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# --- CORE SECURITY CONFIGURATION ---
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

if not SECRET_KEY:
    if DEBUG:
        # Fallback only permitted for local development
        SECRET_KEY = 'django-insecure-local-dev-fallback-key-for-fitai'
    else:
        raise ValueError("CRITICAL: SECRET_KEY environment variable must be set when DEBUG is False!")

allowed_hosts_raw = os.getenv('ALLOWED_HOSTS', '*' if DEBUG else 'localhost,127.0.0.1')
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_raw.split(',') if h.strip()]

# CSRF Trusted Origins for reverse proxies / tunnels
_csrf_trusted = os.getenv('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_trusted.split(',') if o.strip()]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- APPLICATION DEFINITION ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'users',
    'fitness',
    'wellness',
    'kang',
    'community',
    'neuro_readiness',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Fit_AI.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            d for d in [
                PROJECT_ROOT / 'frontend' / 'templates',
                BASE_DIR / 'templates',
            ] if os.path.isdir(d)
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Fit_AI.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# --- CACHE CONFIGURATION (Used for Rate Limiting & OTP Storage) ---
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'fitai-security-cache',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 10000,
        }
    }
}

AUTH_USER_MODEL = 'users.User'

# --- AUTHENTICATION & PASSWORD HARDENING ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_RESET_TIMEOUT = 900  # 15 minutes

# --- SESSION & COOKIE SECURITY ---
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Allows SPA frontend (api.js) to read csrftoken cookie for header
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400 * 7  # 7 days
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

# HTTPS / SSL Deployment Settings
ssl_redirect_env = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
SECURE_SSL_REDIRECT = ssl_redirect_env and not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

SECURE_HSTS_SECONDS = 31536000 if (not DEBUG and SECURE_SSL_REDIRECT) else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG and SECURE_SSL_REDIRECT
SECURE_HSTS_PRELOAD = not DEBUG and SECURE_SSL_REDIRECT

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# --- UPLOAD LIMITS & RESTRICTIONS ---
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5 MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# --- CACHE & RATE LIMITING CONFIGURATION ---
# Supported backends: 'locmem' (default for local dev), 'redis'
CACHE_BACKEND = os.getenv('CACHE_BACKEND', 'locmem' if DEBUG else 'locmem').strip().lower()
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1').strip()

if CACHE_BACKEND == 'redis':
    try:
        import redis  # Verify redis client is available
    except ImportError:
        raise ImportError(
            "CACHE_BACKEND is set to 'redis' but the 'redis' python package is not installed. "
            "Install it via: pip install redis"
        )
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'TIMEOUT': 300,
        }
    }
elif CACHE_BACKEND == 'locmem':
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'evolv-local-cache',
            'TIMEOUT': 300,
        }
    }
else:
    raise ValueError(f"Unknown CACHE_BACKEND '{CACHE_BACKEND}'. Supported options are 'locmem' or 'redis'.")

# --- STRUCTURED AUDIT & SECURITY LOGGING ---
LOGS_DIR = PROJECT_ROOT / 'logs'
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}] ({module}:{lineno}) - {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{asctime}] {levelname} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'security.log',
            'formatter': 'verbose',
        },
        'auth_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'auth.log',
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'errors.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'security': {
            'handlers': ['console', 'security_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'auth_audit': {
            'handlers': ['console', 'auth_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    d for d in [
        PROJECT_ROOT / 'frontend' / 'static',
        BASE_DIR / 'static',
    ] if os.path.isdir(d)
]
STATIC_ROOT = PROJECT_ROOT / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = PROJECT_ROOT / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- GROQ API CONFIGURATION ---
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '').strip()
GROQ_MODEL = os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b')

if not DEBUG and not GROQ_API_KEY:
    raise ValueError("CRITICAL: GROQ_API_KEY environment variable is required and cannot be empty when DEBUG=False!")

# --- SMS SERVICE CONFIGURATION ---
SMS_BACKEND = os.getenv('SMS_BACKEND', 'console')