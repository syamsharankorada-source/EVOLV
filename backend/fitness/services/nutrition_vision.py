import os
import json
import re
import time
from groq import Groq
from django.conf import settings


class MealVisionError(Exception):
    """Raised when the photo genuinely can't be analyzed after retries."""


class NotFoodError(Exception):
    """Raised when the model is confident the photo does not show food."""


def _get_client():
    api_key = os.environ.get('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', None)
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)


VISION_PROMPT = (
    "You are an expert clinical dietitian and food recognition AI. "
    "Look ONLY at what is actually visible in this photo -- do not guess a generic meal. "
    "First decide whether the photo shows real, edible food or a drink meant for consumption. "
    "If it does NOT (e.g. it's a person, an object, a screen, an empty plate, or unclear/blurry), "
    'respond with {"is_food": false, "reason": "short explanation"} and nothing else. '
    "If it DOES show food, then: "
    "1. Identify the exact dish/food items and count how many distinct items or pieces are visible. "
    "2. Estimate the realistic portion size/weight for what is actually on the plate (not a generic single serving). "
    "3. Calculate nutrition for the FULL visible portion: Calories (kcal), Protein (g), Carbs (g), Fats (g), Fiber (g). "
    "Respond ONLY with a valid JSON object with these exact keys: "
    '{"is_food": true, "meal_name": "Specific Food/Dish Name", "portion_estimate": "e.g. 2 rotis + 1 cup dal, ~350g", '
    '"calories": 450, "protein_g": 28.5, "carbs_g": 42.0, "fats_g": 14.0, "fiber_g": 6.5}. '
    "Do not include markdown, code fences, or explanations -- only the raw JSON object."
)


class MealVisionService:
    MODEL = "qwen/qwen3.6-27b"
    MAX_ATTEMPTS = 2  # one retry on transient failures (rate limit, truncated output, etc.)

    @classmethod
    def _call_model(cls, image_data_url: str) -> str:
        client = _get_client()
        kwargs = dict(
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": VISION_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            }],
            model=cls.MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
            max_completion_tokens=700,
        )
        try:
            # This model supports a "thinking" mode that, left on, burns most/all of
            # max_completion_tokens on an internal reasoning trace before ever writing
            # the JSON answer -- that truncation is what was causing every real photo
            # to fail parsing and silently fall back to the same canned numbers.
            # Explicitly asking for non-thinking mode makes it answer directly.
            completion = client.chat.completions.create(reasoning_effort="none", reasoning_format="hidden", **kwargs)
        except TypeError:
            # Older groq-sdk versions may not accept these kwargs yet -- fall back
            # to a plain call rather than hard-failing the whole request.
            completion = client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content.strip()

    @classmethod
    def analyze_meal(cls, image_data_url: str) -> dict:
        """Snap-a-meal: sends the photo to Groq vision model and asks for a
        high-accuracy structured nutrition estimate. Raises NotFoodError if the
        photo isn't food, or MealVisionError if it genuinely couldn't be read."""
        last_error = None
        for attempt in range(1, cls.MAX_ATTEMPTS + 1):
            try:
                raw = cls._call_model(image_data_url)
                if raw.startswith("```"):
                    raw = re.sub(r"^```json\s*", "", raw)
                    raw = re.sub(r"^```\s*", "", raw)
                    raw = re.sub(r"\s*```$", "", raw)
                data = json.loads(raw)

                if data.get("is_food") is False:
                    reason = str(data.get("reason", "")).strip()
                    raise NotFoodError(reason or "That doesn't look like a food photo.")

                def num(key, default=0):
                    try:
                        return float(data.get(key, default))
                    except (TypeError, ValueError):
                        return default

                meal_name = str(data.get("meal_name", "")).strip()
                if not meal_name or meal_name.lower() == "meal":
                    # Couldn't get a real name back -- treat as a failed read rather
                    # than logging a vague guess, so the person can retake the photo.
                    raise MealVisionError("Could not identify the dish clearly.")

                calories = int(num("calories", 0))
                if calories <= 0:
                    raise MealVisionError("Could not estimate calories from this photo.")

                return {
                    "meal_name": meal_name[:255],
                    "portion_estimate": str(data.get("portion_estimate", ""))[:255],
                    "calories": calories,
                    "protein_g": round(max(num("protein_g", 0), 0), 1),
                    "carbs_g": round(max(num("carbs_g", 0), 0), 1),
                    "fats_g": round(max(num("fats_g", 0), 0), 1),
                    "fiber_g": round(max(num("fiber_g", 0), 0), 1),
                }
            except NotFoodError:
                raise
            except Exception as e:
                last_error = e
                print(f"Meal vision analysis attempt {attempt} failed:", repr(e))
                if attempt < cls.MAX_ATTEMPTS:
                    time.sleep(0.6)
                    continue

        raise MealVisionError(f"Could not analyze this photo: {last_error}")


class RecipeService:
    @classmethod
    def get_recipe(cls, dish_name: str, dietary_profile=None) -> dict:
        """Step-by-step guidance for making a dish from the person's own diet plan."""
        try:
            client = _get_client()

            constraints = []
            if dietary_profile:
                pref = getattr(dietary_profile, 'diet_preference', None)
                if pref:
                    constraints.append(f"Diet preference: {pref}")
                allergies = getattr(dietary_profile, 'allergies', None)
                if allergies:
                    constraints.append(f"Allergies/avoid: {', '.join(allergies)}")
            constraints_text = " ".join(constraints) if constraints else "No specific dietary constraints given."

            prompt = (
                f"Give simple, home-cook-friendly instructions for making '{dish_name}'. "
                f"{constraints_text} "
                "Include a short ingredient list with approximate quantities for one serving, "
                "then numbered step-by-step cooking instructions. Keep it practical and concise. "
                "Reply in plain conversational text only -- no Markdown, no headers, no bold/italic "
                "asterisks, no tables. Put each numbered step on its own line."
            )

            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="openai/gpt-oss-120b",
                temperature=0.6,
                max_completion_tokens=600,
            )
            text = completion.choices[0].message.content.strip()
            text = re.sub(r'(?<=\S)[ \t]*\n?[ \t]*(?<!\d)(?=\d{1,2}\.\s)', '\n', text)
            return {"dish_name": dish_name, "recipe": text.strip()}
        except Exception as e:
            print("Recipe generation error:", e)
            return {"dish_name": dish_name, "recipe": "Could not fetch the recipe right now -- please try again in a moment."}
