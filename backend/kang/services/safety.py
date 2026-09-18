import re

class KangSafetyEngine:
    SELF_HARM_KEYWORDS = [
        r'\bsuicide\b', r'\bsuicidal\b', r'\bkill myself\b', r'\bwant to die\b',
        r'\bend my life\b', r'\bself[\s-]harm\b', r'\bhurting myself\b',
        r'\bcutting myself\b', r'\btake my own life\b', r'\bdon\'t want to live\b',
        r'\bdo not want to live\b', r'\bbetter off dead\b'
    ]

    EMERGENCY_KEYWORDS = [
        r'\bchest pain\b', r'\bheart attack\b', r'\bshortness of breath\b',
        r'\bsevere dizziness\b', r'\bfainted\b', r'\bfainting\b',
        r'\bbroken bone\b', r'\bfracture\b', r'\bheavy bleeding\b',
        r'\bunconscious\b', r'\bambulance\b'
    ]
    
    MEDICAL_KEYWORDS = [
        r'\bpregnancy\b', r'\bpregnant\b', r'\bsurgery\b', r'\bhernia\b',
        r'\bhypertension\b', r'\bacute pain\b', r'\bswollen joint\b', r'\bdoctor said\b'
    ]
    
    CAUTION_KEYWORDS = [
        r'\bknee pain\b', r'\bback ache\b', r'\bsore shoulder\b',
        r'\bpulled muscle\b', r'\bsprain\b', r'\bstiff neck\b'
    ]

    SELF_HARM_RESPONSE = (
        "I hear you, and I care about your safety and well-being. Please know that you do not have to go through this alone, and there is compassionate support available right now.\n\n"
        "Please connect immediately with someone you trust, or reach out to a trained professional or crisis helpline:\n"
        "- In the US: Call or text 988, or chat at 988lifeline.org (Suicide & Crisis Lifeline, free, confidential, 24/7).\n"
        "- In India: Call 14416 or 1800-891-4416 (Tele-MANAS, free 24/7 mental health helpline) or call Vandrevala Foundation at 9999 666 555.\n"
        "- In the UK: Call 111 (NHS) or call 116 123 (Samaritans).\n"
        "- In other regions: Contact your local emergency services (like 911, 112, or 999) or visit https://findahelpline.com to find free, confidential crisis support in your area.\n\n"
        "If you are in immediate physical danger, please contact your local emergency services right away. You matter, and help is available."
    )

    @classmethod
    def evaluate(cls, user_message: str, fitness_profile=None) -> dict:
        text = user_message.lower()

        # Prioritize self-harm crisis support check
        for pattern in cls.SELF_HARM_KEYWORDS:
            if re.search(pattern, text):
                return {
                    "level": "EMERGENCY",
                    "override_reply": cls.SELF_HARM_RESPONSE,
                    "emotion": "concerned",
                    "safety_directive": "Crisis intervention: Provide immediate crisis helpline and emergency support resources."
                }
        
        for pattern in cls.EMERGENCY_KEYWORDS:
            if re.search(pattern, text):
                return {
                    "level": "EMERGENCY",
                    "override_reply": "🚨 WARNING: Stop all activity immediately and contact emergency medical services.",
                    "emotion": "concerned"
                }
                
        for pattern in cls.MEDICAL_KEYWORDS:
            if re.search(pattern, text):
                return {
                    "level": "MEDICAL",
                    "override_reply": "⚠️ Notice: Consult your physician before attempting exercise under these conditions.",
                    "emotion": "warning"
                }
                
        for pattern in cls.CAUTION_KEYWORDS:
            if re.search(pattern, text):
                return {
                    "level": "CAUTION",
                    "override_reply": None,
                    "emotion": "focused",
                    "safety_directive": "Suggest low-impact alternatives and avoid diagnosing."
                }
                
        return {
            "level": "SAFE",
            "override_reply": None,
            "emotion": "focused",
            "safety_directive": None
        }