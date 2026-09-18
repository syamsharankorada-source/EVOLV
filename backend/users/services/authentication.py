from django.conf import settings
from django.contrib.auth import login
from users.models import User, FitnessProfile, DietaryProfile, HealthProfile

class AuthenticationService:
    @staticmethod
    def request_otp(phone: str) -> dict:
        phone = phone.strip()
        if not phone:
            return {"success": False, "message": "Phone number is required."}
        if getattr(settings, 'DEBUG', False):
            return {"success": True, "message": "OTP sent.", "dev_otp": "1234"}
        return {"success": True, "message": "OTP dispatched."}

    @staticmethod
    def verify_otp(request, phone: str, otp: str, display_name: str = "") -> dict:
        phone = phone.strip()
        otp = otp.strip()
        is_valid = (getattr(settings, 'DEBUG', False) and otp in ("1234", "0000"))
        
        if not is_valid:
            return {"success": False, "message": "Invalid OTP."}
            
        username = f"usr_{phone}"
        user, created = User.objects.get_or_create(phone=phone, defaults={
            'username': username,
            'first_name': display_name or 'Athlete'
        })
        
        if created or not hasattr(user, 'fitness_profile'):
            FitnessProfile.objects.get_or_create(user=user)
            DietaryProfile.objects.get_or_create(user=user)
            HealthProfile.objects.get_or_create(user=user)
            
        login(request, user)
        
        return {
            "success": True,
            "data": {
                "id": user.id,
                "phone": user.phone,
                "name": user.first_name,
                "is_onboarded": user.is_onboarded
            }
        }