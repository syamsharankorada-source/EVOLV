import os
import re
from groq import Groq
from django.conf import settings
from kang.services.knowledge import KnowledgeService
from kang.services.safety import KangSafetyEngine
from kang.services.memory import KangMemoryService


def _strip_markdown(text: str) -> str:
    """Remove common Markdown symbols and force real line breaks between list items,
    so chat bubbles show clean, properly structured plain text."""
    if not text:
        return text
    # Headers: ### Heading -> Heading
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    # Bold/italic: **text**, __text__, *text*, _text_ -> text
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    text = re.sub(r'(?<!\w)\*(.*?)\*(?!\w)', r'\1', text)
    text = re.sub(r'(?<!\w)_(.*?)_(?!\w)', r'\1', text)
    # Inline code / code fences
    text = text.replace('```', '').replace('`', '')
    # Table pipes and separator rows like |---|---|
    text = re.sub(r'^\s*\|?[-\s|]+\|?\s*$', '', text, flags=re.MULTILINE)
    text = text.replace('|', ' ')
    # Strip existing bullet markers (-, *, +) at line start
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)

    # Force a line break before each top-level numbered item ("1. ", "2. ", ..., "10. ", "11. ", ...),
    # regardless of how much whitespace preceded it in the model's raw output.
    # (?<!\d) stops the regex from also matching *inside* a multi-digit number like "10." —
    # without it, "10." was being split into "1" + "\n" + "0." because a lone "0." on its own
    # also satisfies \d{1,2}\.\s
    text = re.sub(r'(?<=\S)[ \t]*\n?[ \t]*(?<!\d)(?=\d{1,2}\.\s)', '\n', text)
    # Force a line break + indent before lettered sub-items ("a. ", "b. ", "c. ", "d. ")
    # (?<![A-Za-z]) stops the regex from matching a letter that's just the end of a normal word
    # (e.g. "...muscles rebuild." was being split into "rebuil" + "\n   d." because that trailing
    # "d." looked identical to a lettered list marker).
    text = re.sub(r'(?<=\S)[ \t]*\n?[ \t]*(?<![A-Za-z])(?=[a-d]\.\s)', '\n   ', text)

    # Collapse extra horizontal whitespace and excess blank lines left behind
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


class KangOrchestrator:
    @classmethod
    def get_response(cls, user_message, user_profile=None, session=None):
        try:
            # 1. Safety Engine Check
            safety_res = KangSafetyEngine.evaluate(user_message, user_profile)
            if safety_res["level"] == "EMERGENCY" or safety_res["level"] == "MEDICAL":
                return {
                    "reply": safety_res["override_reply"],
                    "emotion": safety_res["emotion"],
                    "intent": "safety_alert",
                    "safety_level": safety_res["level"]
                }

            # 2. Knowledge & Context Building from CSVs
            knowledge = KnowledgeService()
            context_data = knowledge.get_full_context(user_message, user_profile)

            # 3. Initialize Groq Client from env/settings — never hard-code keys in source
            api_key = os.environ.get('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', None)
            if not api_key:
                raise RuntimeError(
                    "GROQ_API_KEY is not set. Make sure your .env is loaded "
                    "(e.g. via python-dotenv in manage.py/settings.py) and that "
                    "GROQ_API_KEY is defined in it."
                )
            client = Groq(api_key=api_key)

            system_prompt = (
                "You are KANG, an elite AI Fitness & Athletic Coach. Your core specialty is fitness, workouts, nutrition, and "
                "mental wellness — provide helpful, motivating, clear, and structured advice on workouts, diet, "
                "form correction, recovery, and athletic performance.\n\n"
                "You are fluent in English, Telugu (తెలుగు), Hindi (हिंदी), and mixed conversational formats (such as Telugu/Hindi in English script / Teluglish / Hinglish). "
                "Always respond naturally in the language and style the user addresses you in, while keeping your energetic, motivating, expert coach persona.\n\n"
                "Beyond your core specialty, you are also a knowledgeable sports expert covering rules, training drills, history, and combat sports.\n\n"
                "Formatting rules:\n"
                "- Reply in neat conversational text with real line breaks between points.\n"
                "- When providing numbered steps or recommendations, put each item on its own new line (e.g. '1. Point one\\n2. Point two').\n"
                "- Avoid messy markdown symbols, tables, or asterisks. Keep it neat, clean, and easy to read.\n\n"
                f"{context_data}"
            )

            # 4. Build message list with session conversation history
            messages = [{"role": "system", "content": system_prompt}]
            if session and hasattr(session, 'messages'):
                past_turns = list(session.messages.order_by('-created_at')[:6])
                for m in reversed(past_turns):
                    if m.user_message:
                        messages.append({"role": "user", "content": m.user_message})
                    if m.kang_reply:
                        messages.append({"role": "assistant", "content": m.kang_reply})
            messages.append({"role": "user", "content": user_message})

            # 5. Resilient Groq API Call with multi-model fallback
            chat_model = getattr(settings, 'GROQ_MODEL', None) or os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b')
            candidates = [chat_model, 'qwen/qwen3.8-27b', 'qwen/qwen3.6-27b', 'groq/compound']
            models_to_try = []
            for m in candidates:
                if m and m not in models_to_try:
                    models_to_try.append(m)

            chat_completion = None
            last_err = None
            for model_name in models_to_try:
                try:
                    chat_completion = client.chat.completions.create(
                        messages=messages,
                        model=model_name,
                        temperature=0.7,
                        max_tokens=650,
                    )
                    if chat_completion and chat_completion.choices and chat_completion.choices[0].message.content:
                        break
                except Exception as ex:
                    last_err = ex
                    print(f"Groq model '{model_name}' attempt failed: {ex}")

            if not chat_completion or not chat_completion.choices or not chat_completion.choices[0].message.content:
                if last_err:
                    raise last_err
                raise RuntimeError("Empty response from Groq API")

            reply_text = _strip_markdown(chat_completion.choices[0].message.content.strip())

            return {
                "reply": reply_text,
                "emotion": safety_res.get("emotion", "encouraging"),
                "intent": "fitness_guidance",
                "safety_level": safety_res.get("level", "SAFE")
            }

        except Exception as e:
            print("Groq API Error / Fallback:", e)
            # Try expert deterministic engine first for accurate, direct advice
            try:
                from kang.services.expert_engine import KangExpertEngine
                expert_match = KangExpertEngine.match_intent(user_message)
                if expert_match:
                    return {
                        "reply": expert_match["reply"],
                        "emotion": expert_match.get("emotion", "encouraging"),
                        "intent": expert_match.get("intent", "fitness_guidance"),
                        "safety_level": "SAFE"
                    }
            except Exception as expert_err:
                print("Expert Engine Error:", expert_err)

            # Context-aware fallback if expert match didn't trigger
            if context_data and any(k in context_data for k in ["[NUTRITION DATA]", "[HEALTH DATA]", "[CRITICAL SAFETY]"]):
                clean_ctx = re.sub(r'\[.*?\]\s*', '- ', context_data.strip())
                return {
                    "reply": f"Here is what my clinical knowledge base shows for your query:\n\n{clean_ctx}\n\nStay consistent with your daily targets!",
                    "emotion": "focused",
                    "intent": "nutrition_guidance",
                    "safety_level": "SAFE"
                }

            return {
                "reply": f"I analyzed your request regarding '{user_message}'. To achieve optimal results, focus on progressive overload in your resistance training, hit your daily protein target (1.6-2.0g/kg), and prioritize 7-8 hours of sleep for central nervous system recovery.",
                "emotion": "encouraging",
                "intent": "fitness_guidance",
                "safety_level": "SAFE"
            }

    @classmethod
    def analyze_form(cls, image_data_url: str, exercise_label: str, reps: int, posture: str):
        """
        Qualitative coaching feedback on a snapshot from the live Form Corrector.
        The rep count / posture verdict themselves come from real-time client-side
        pose-angle tracking (MediaPipe) — this just asks a vision-capable model to
        add a KANG-style coaching note on top of what the camera already measured.
        """
        try:
            api_key = os.environ.get('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', None)
            if not api_key:
                raise RuntimeError("GROQ_API_KEY is not set.")
            client = Groq(api_key=api_key)

            prompt = (
                f"This is a snapshot from a live {exercise_label} form-check. "
                f"Our pose tracker currently measured {reps} reps and posture status '{posture}'. "
                "As KANG, the AI fitness coach, give one short, encouraging, specific coaching tip "
                "based on what you can see in the image (body alignment, joint positions, common "
                "mistakes for this exercise). Keep it to 2-3 sentences, plain conversational text, "
                "no Markdown."
            )

            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url}},
                        ],
                    }
                ],
                model="qwen/qwen3.6-27b",
                temperature=0.6,
                max_completion_tokens=300,
            )

            reply_text = _strip_markdown(chat_completion.choices[0].message.content.strip())
            return {"reply": reply_text}

        except Exception as e:
            print("Groq vision API error:", e)
            return {"reply": f"Nice work — {reps} reps logged! Keep your core braced and move with control on every rep."}
