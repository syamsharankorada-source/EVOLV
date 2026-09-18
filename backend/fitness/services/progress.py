from django.utils import timezone
from fitness.models import WorkoutLog
from django.db.models import Sum

class ProgressService:
    @staticmethod
    def get_user_progress(user) -> dict:
        logs = WorkoutLog.objects.filter(user=user).order_by('-completed_at')
        total_workouts = logs.count()
        total_xp = logs.aggregate(Sum('xp_earned'))['xp_earned__sum'] or 0
        
        streak = 0
        if total_workouts > 0:
            current_date = timezone.now().date()
            dates_set = set(log.completed_at.date() for log in logs)
            
            while current_date in dates_set:
                streak += 1
                current_date -= timezone.timedelta(days=1)
                
            if streak == 0 and (timezone.now().date() - timezone.timedelta(days=1)) in dates_set:
                current_date = timezone.now().date() - timezone.timedelta(days=1)
                while current_date in dates_set:
                    streak += 1
                    current_date -= timezone.timedelta(days=1)

        return {
            "streak": streak,
            "total_workouts": total_workouts,
            "total_xp": total_xp
        }