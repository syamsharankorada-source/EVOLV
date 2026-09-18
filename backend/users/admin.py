from django.contrib import admin
from .models import User, FitnessProfile, DietaryProfile, HealthProfile, FamilyMember

admin.site.register(User)
admin.site.register(FitnessProfile)
admin.site.register(DietaryProfile)
admin.site.register(HealthProfile)
admin.site.register(FamilyMember)