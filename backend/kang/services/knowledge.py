import os
import pandas as pd
from django.conf import settings

class KnowledgeService:
    def __init__(self):
        self.data_dir = os.path.join(settings.BASE_DIR, 'data')
        self.df_foods = self._load_csv('foods.csv')
        self.df_exercises = self._load_csv('exercises.csv')
        self.df_safety = self._load_csv('safety_rules.csv')
        self.df_health = self._load_csv('health_food.csv')

    def _load_csv(self, filename):
        try:
            return pd.read_csv(os.path.join(self.data_dir, filename))
        except Exception as e:
            print(f"Warning: Could not load {filename} - {e}")
            return None

    def get_full_context(self, user_msg: str, profile) -> str:
        if not user_msg:
            return ""
            
        context = ""
        msg_lower = user_msg.lower()

        # 1. Dynamic User Context (BMI & Profile)
        if profile:
            bmi = profile.get_bmi() if hasattr(profile, 'get_bmi') else None
            bmi_category = "Normal"
            if bmi:
                if bmi < 18.5: bmi_category = "Underweight"
                elif 25 <= bmi < 30: bmi_category = "Overweight"
                elif bmi >= 30: bmi_category = "Obese"

            context += f"--- LIVE USER VITALS ---\n"
            context += f"BMI: {bmi if bmi else 'Unknown'} ({bmi_category}). Goal: {getattr(profile, 'primary_goal', 'General')}. Fitness Level: {getattr(profile, 'fitness_level', 'Beginner')}.\n"
            context += f"Limitations: {getattr(profile, 'limitations', 'None')}. Diet: {getattr(profile, 'diet_preference', 'Standard')}.\n\n"

            # Check Safety Rules based on User Limitation
            limitations = getattr(profile, 'limitations', None)
            if limitations and str(limitations).lower() != 'none' and self.df_safety is not None:
                lim_text = str(limitations).replace('_', ' ').lower()
                try:
                    match = self.df_safety[self.df_safety['Condition'].str.contains(lim_text, case=False, na=False)]
                    if not match.empty:
                        row = match.iloc[0]
                        context += f"[CRITICAL SAFETY] Due to user limitation ({lim_text}), AVOID: {row['Avoid']}. MODIFY WITH: {row['Alternative']}.\n"
                except: pass

        # 2. Food / Nutrition Knowledge
        if self.df_foods is not None:
            try:
                for _, row in self.df_foods.iterrows():
                    if str(row['Food']).lower() in msg_lower:
                        context += f"[NUTRITION DATA] {row['Food']}: {row['Calories']} kcal, {row['Protien_g']}g Protein. Best for: {row['Goal']}.\n"
            except: pass

        # 3. Health & Condition Specific Foods
        if self.df_health is not None:
            try:
                for _, row in self.df_health.iterrows():
                    if str(row['Health_condition']).lower() in msg_lower:
                        context += f"[HEALTH DATA] For {row['Health_condition']}, {row['Food']} is good because {row['Reason']}.\n"
            except: pass

        return context