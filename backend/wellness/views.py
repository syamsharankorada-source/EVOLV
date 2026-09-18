import json
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.contrib.auth import login
from django.views.decorators.csrf import ensure_csrf_cookie
from wellness.models import WellnessLog, DevicePairingToken
from wellness.services.device_sync import MockDeviceProvider
from wellness.services.assessment import AssessmentService

from Fit_AI.rate_limiter import rate_limit

def wellness_today_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=401)
        
    if request.method == 'GET':
        today = timezone.now().date()
        log, _ = WellnessLog.objects.get_or_create(user=request.user, date=today)
        return JsonResponse({
            'success': True,
            'data': {
                'water_ml': log.water_ml,
                'steps': log.steps,
                'sleep_hours': log.sleep_hours,
                'heart_rate': log.heart_rate,
                'device_name': log.device_name or 'Wearable Device'
            }
        })
    return JsonResponse({'success': False}, status=405)

@rate_limit(key_type='user', limit=30, period_seconds=60)
def sync_band_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=401)
        
    if request.method == 'POST':
        payload = None
        try:
            if request.body:
                payload = json.loads(request.body)
        except Exception:
            payload = None
        sync_data = MockDeviceProvider.sync_data(request.user, payload=payload)
        return JsonResponse({'success': True, 'message': 'Device synced successfully', 'data': sync_data})
    return JsonResponse({'success': False}, status=405)

def wellness_history_view(request):
    """Last 14 days of wearable/wellness data, for trend charts."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=401)

    # Ensure history exists if user has synced
    MockDeviceProvider.ensure_history(request.user)

    days = 14
    today = timezone.now().date()
    start = today - timezone.timedelta(days=days - 1)
    logs = WellnessLog.objects.filter(user=request.user, date__gte=start, date__lte=today).order_by('date')
    by_date = {log.date: log for log in logs}

    history = []
    d = start
    while d <= today:
        log = by_date.get(d)
        history.append({
            'date': d.isoformat(),
            'water_ml': log.water_ml if log else 0,
            'steps': log.steps if log else 0,
            'sleep_hours': log.sleep_hours if log else 0.0,
            'heart_rate': log.heart_rate if log else 72,
            'device_name': log.device_name if log else '',
        })
        d += timezone.timedelta(days=1)

    return JsonResponse({'success': True, 'data': {'days': history}})

def wellness_assessment_view(request):
    """Rule-based, general-wellness verdict from recent wearable history + profile —
    not a medical diagnosis, just activity/lifestyle guidance."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False}, status=401)

    assessment = AssessmentService.assess(request.user)
    return JsonResponse({'success': True, 'data': assessment})

@rate_limit(key_type='user', limit=10, period_seconds=600)
def generate_pair_token_view(request):
    """Desktop calls this to get a QR-able link. Scanning it on a phone logs
    that phone into THIS account (see mobile_connect_view) so a watch paired
    from the phone syncs into the same dashboard the QR was shown on."""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Log in first.'}, status=401)
    if request.method != 'POST':
        return JsonResponse({'success': False}, status=405)

    # Clean up this user's old unused tokens so they don't pile up.
    DevicePairingToken.objects.filter(user=request.user, used_at__isnull=True).delete()
    token_obj = DevicePairingToken.objects.create(user=request.user)
    pair_url = request.build_absolute_uri(f'/mobile-connect/{token_obj.token}/')
    return JsonResponse({'success': True, 'data': {'token': token_obj.token, 'url': pair_url, 'expires_in_minutes': 15}})

@ensure_csrf_cookie
@rate_limit(key_type='ip', limit=20, period_seconds=600)
def mobile_connect_view(request, token):
    """The phone lands here after scanning the QR code."""
    try:
        token_obj = DevicePairingToken.objects.select_related('user').get(token=token)
    except DevicePairingToken.DoesNotExist:
        return redirect('/?pairError=invalid')

    if not token_obj.is_valid():
        return redirect('/?pairError=expired')

    login(request, token_obj.user)
    request.session.cycle_key()
    token_obj.used_at = timezone.now()
    token_obj.save(update_fields=['used_at'])
    return redirect('/?openWearable=1')