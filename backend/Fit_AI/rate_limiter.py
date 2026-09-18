import time
import json
import logging
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger('security')


def get_client_ip(request) -> str:
    """Extracts client IP address respecting reverse proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def check_rate_limit(key: str, limit: int, period_seconds: int) -> tuple[bool, int]:
    """
    Sliding window rate limit checker using Django cache.
    Returns (is_allowed, retry_after_seconds).
    """
    cache_key = f"ratelimit:{key}"
    now = time.time()
    cutoff = now - period_seconds

    # Retrieve existing request timestamps
    history = cache.get(cache_key) or []
    # Filter out requests outside current sliding window
    history = [t for t in history if t > cutoff]

    if len(history) >= limit:
        oldest_in_window = history[0]
        retry_after = max(1, int(period_seconds - (now - oldest_in_window)))
        return False, retry_after

    history.append(now)
    cache.set(cache_key, history, timeout=period_seconds + 5)
    return True, 0


def rate_limit(key_type: str = 'ip', limit: int = 60, period_seconds: int = 60, message: str = None):
    """
    Decorator to enforce rate limiting on Django views.
    
    key_type options:
    - 'ip': limits by client IP address
    - 'user': limits by authenticated user ID (falls back to IP for guests)
    - 'phone': extracts phone number from JSON body (for OTP / auth endpoints)
    - 'combined': IP + endpoint
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = get_client_ip(request)
            endpoint = request.path

            if key_type == 'user':
                if request.user.is_authenticated:
                    identifier = f"usr_{request.user.id}:{endpoint}"
                else:
                    identifier = f"ip_{ip}:{endpoint}"
            elif key_type == 'phone':
                phone_val = ''
                try:
                    if request.body:
                        body_data = json.loads(request.body)
                        phone_val = body_data.get('phone', '')
                except Exception:
                    phone_val = ''
                identifier = f"phone_{phone_val or ip}:{endpoint}"
            else:
                identifier = f"ip_{ip}:{endpoint}"

            allowed, retry_after = check_rate_limit(identifier, limit, period_seconds)
            if not allowed:
                logger.warning(
                    f"Rate limit exceeded: key={identifier} IP={ip} "
                    f"limit={limit}/{period_seconds}s retry_after={retry_after}s"
                )
                err_msg = message or f"Too many requests. Please wait {retry_after} seconds before trying again."
                response = JsonResponse({
                    'success': False,
                    'message': err_msg,
                    'retry_after': retry_after
                }, status=429)
                response['Retry-After'] = str(retry_after)
                return response

            return view_func(request, *args, **kwargs)
        return wrapper
    def_name = getattr(view_func := decorator, '__name__', 'rate_limit')
    return decorator

