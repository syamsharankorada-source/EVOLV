import random
from django.utils import timezone
from wellness.models import WellnessLog

class MockDeviceProvider:
    @staticmethod
    def sync_data(user, payload=None) -> dict:
        today = timezone.now().date()
        log, _ = WellnessLog.objects.get_or_create(user=user, date=today)
        
        if payload and isinstance(payload, dict):
            # Real or custom device data
            if 'steps' in payload:
                try:
                    log.steps = max(int(payload['steps']), log.steps)
                except (ValueError, TypeError):
                    pass
            if 'sleep_hours' in payload:
                try:
                    log.sleep_hours = float(payload['sleep_hours'])
                except (ValueError, TypeError):
                    pass
            if 'water_ml' in payload:
                try:
                    log.water_ml = max(int(payload['water_ml']), log.water_ml)
                except (ValueError, TypeError):
                    pass
            if 'heart_rate' in payload:
                try:
                    log.heart_rate = int(payload['heart_rate'])
                except (ValueError, TypeError):
                    pass
            if 'device_name' in payload:
                log.device_name = str(payload['device_name'])[:50]
        else:
            # Incremental sync simulation
            log.steps += random.randint(800, 2500)
            if log.steps > 18000:
                log.steps = 18000
                
            if log.sleep_hours == 0.0:
                log.sleep_hours = round(random.uniform(6.5, 8.5), 1)
                
            log.water_ml += random.randint(250, 600)
            if log.water_ml > 4500:
                log.water_ml = 4500
                
            log.heart_rate = random.randint(68, 82)
            if not log.device_name:
                log.device_name = "EVOLV Smart Band"
            
        log.save()

        # Check if we should ensure historical past 14 days data exists
        MockDeviceProvider.ensure_history(user, log.device_name)
        
        return {
            "steps": log.steps,
            "sleep_hours": log.sleep_hours,
            "water_ml": log.water_ml,
            "heart_rate": log.heart_rate,
            "device_name": log.device_name
        }

    @staticmethod
    def ensure_history(user, device_name="EVOLV Wearable"):
        """Populate realistic past 14 days of data for newly paired devices if empty"""
        today = timezone.now().date()
        for i in range(1, 15):
            past_date = today - timezone.timedelta(days=i)
            log, created = WellnessLog.objects.get_or_create(user=user, date=past_date)
            if created or log.steps == 0:
                # Realistic past days variation
                log.steps = random.randint(6200, 11500)
                log.sleep_hours = round(random.uniform(6.2, 8.2), 1)
                log.water_ml = random.randint(1800, 3200)
                log.heart_rate = random.randint(65, 80)
                log.device_name = device_name
                log.save()