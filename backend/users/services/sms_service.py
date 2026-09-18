import os
import logging
from abc import ABC, abstractmethod
from django.conf import settings

logger = logging.getLogger('auth_audit')


class BaseSMSService(ABC):
    """Abstract base interface for sending SMS messages."""

    @abstractmethod
    def send_sms(self, phone: str, message: str) -> bool:
        """
        Sends an SMS to the specified phone number.
        Returns True if successfully dispatched/sent, False otherwise.
        """
        pass

    def send_otp(self, phone: str, otp: str) -> bool:
        """
        Convenience method to deliver standard EVOLV OTP.
        """
        message = f"Your EVOLV verification code is {otp}. Valid for 5 minutes. Do not share this code."
        return self.send_sms(phone, message)


class ConsoleSMSBackend(BaseSMSService):
    """Development SMS backend that logs messages to the console and audit logs."""

    def send_sms(self, phone: str, message: str) -> bool:
        masked = f"...{phone[-4:]}" if len(phone) >= 4 else phone
        logger.info(f"[DEV SMS] To: {masked} | Message: {message}")
        print(f"[SMS CONSOLE BACKEND] To: {phone} | {message}")
        return True


class TwilioSMSBackend(BaseSMSService):
    """
    Production SMS backend using Twilio REST API.
    Configured via environment variables:
    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
    """

    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '').strip()
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '').strip()
        self.from_number = os.getenv('TWILIO_FROM_NUMBER', '').strip()

    def send_sms(self, phone: str, message: str) -> bool:
        if not (self.account_sid and self.auth_token and self.from_number):
            logger.error("TwilioSMSBackend configuration missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER")
            return False

        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)
            msg = client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone,
            )
            masked = f"...{phone[-4:]}" if len(phone) >= 4 else phone
            logger.info(f"Twilio SMS sent to {masked}, SID: {msg.sid}")
            return True
        except ImportError:
            logger.error("twilio python package is not installed. Install with: pip install twilio")
            return False
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {e}")
            return False


class MSG91SMSBackend(BaseSMSService):
    """
    Production SMS backend using MSG91 API.
    Configured via environment variables:
    MSG91_AUTH_KEY, MSG91_FLOW_ID, MSG91_SENDER_ID
    """

    def __init__(self):
        self.auth_key = os.getenv('MSG91_AUTH_KEY', '').strip()
        self.flow_id = os.getenv('MSG91_FLOW_ID', '').strip()
        self.sender_id = os.getenv('MSG91_SENDER_ID', '').strip()

    def send_sms(self, phone: str, message: str) -> bool:
        if not (self.auth_key and (self.flow_id or self.sender_id)):
            logger.error("MSG91SMSBackend configuration missing MSG91_AUTH_KEY or template configuration")
            return False

        try:
            import urllib.request
            import json

            # Standard MSG91 flow / SMS endpoint
            url = "https://control.msg91.com/api/v5/flow/"
            payload = {
                "template_id": self.flow_id,
                "short_url": "0",
                "recipients": [
                    {
                        "mobiles": phone.lstrip('+'),
                        "message": message,
                    }
                ]
            }
            headers = {
                "authkey": self.auth_key,
                "content-type": "application/json",
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                masked = f"...{phone[-4:]}" if len(phone) >= 4 else phone
                logger.info(f"MSG91 SMS sent to {masked}, status: {status}")
                return 200 <= status < 300
        except Exception as e:
            logger.error(f"Failed to send SMS via MSG91: {e}")
            return False


def get_sms_service() -> BaseSMSService:
    """
    Factory function selecting the appropriate SMS backend:
    - If DEBUG=True and SMS_BACKEND is not explicitly set, defaults to ConsoleSMSBackend.
    - Otherwise inspects settings.SMS_BACKEND / env SMS_BACKEND ('twilio', 'msg91', 'console').
    """
    backend_choice = getattr(settings, 'SMS_BACKEND', None) or os.getenv('SMS_BACKEND', '')
    backend_choice = backend_choice.strip().lower()

    if not backend_choice:
        if settings.DEBUG:
            backend_choice = 'console'
        else:
            backend_choice = 'console'

    if backend_choice == 'twilio':
        return TwilioSMSBackend()
    elif backend_choice == 'msg91':
        return MSG91SMSBackend()
    else:
        return ConsoleSMSBackend()

