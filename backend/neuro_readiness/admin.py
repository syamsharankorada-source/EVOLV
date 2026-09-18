from django.contrib import admin
from .models import DailyReadiness, ReactionTrial, UserBaseline, WorkoutOutcome

@admin.register(DailyReadiness)
class DailyReadinessAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'final_score', 'readiness_category', 'safety_override')
    list_filter = ('date', 'readiness_category', 'safety_override')
    search_fields = ('user__username', 'user__email', 'readiness_category')

@admin.register(ReactionTrial)
class ReactionTrialAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_id', 'trial_num', 'reaction_ms', 'is_valid', 'is_practice')
    list_filter = ('is_valid', 'is_practice', 'created_at')
    search_fields = ('user__username', 'session_id')

@admin.register(UserBaseline)
class UserBaselineAdmin(admin.ModelAdmin):
    list_display = ('user', 'valid_days_count', 'last_updated')
    search_fields = ('user__username',)

@admin.register(WorkoutOutcome)
class WorkoutOutcomeAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'readiness_before', 'performance_rating', 'actual_rpe')
    list_filter = ('date', 'performance_rating')
    search_fields = ('user__username', 'notes')
