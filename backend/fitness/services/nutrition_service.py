import datetime

class NutritionEngine:
    @classmethod
    def calculate_targets(cls, fitness_profile, dietary_profile) -> dict:
        weight = fitness_profile.weight_kg or 70.0
        height = fitness_profile.height_cm or 170.0
        age = fitness_profile.age or 25
        gender = fitness_profile.gender or 'male'
        goal = fitness_profile.primary_goal or 'general_fitness'

        if gender == 'female':
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age + 5

        multipliers = {'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'very_active': 1.725}
        tdee = bmr * multipliers.get(fitness_profile.activity_level, 1.4)

        if 'weight_management' in goal or 'loss' in goal:
            target_calories = int(tdee - 400)
            protein_factor = 2.0
        elif 'muscle' in goal or 'strength' in goal:
            target_calories = int(tdee + 350)
            protein_factor = 2.2
        else:
            target_calories = int(tdee)
            protein_factor = 1.6

        target_protein = int(weight * protein_factor)
        target_fats = int((target_calories * 0.25) / 9)
        target_carbs = int((target_calories - (target_protein * 4 + target_fats * 9)) / 4)

        return {
            "target_calories": target_calories,
            "target_protein_g": target_protein,
            "target_carbs_g": max(target_carbs, 50),
            "target_fats_g": max(target_fats, 30),
            "disclaimer": "Automated estimates for fitness planning, not medical advice."
        }

    @classmethod
    def generate_meal_plan(cls, fitness_profile, dietary_profile) -> dict:
        targets = cls.calculate_targets(fitness_profile, dietary_profile)
        diet = dietary_profile.diet_preference.lower()
        
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_idx = datetime.datetime.today().weekday()
        today_name = days_of_week[today_idx]

        weekly_plan = []
        for i, day in enumerate(days_of_week):
            if 'veg' in diet and 'non' not in diet:
                breakfast = ["Oatmeal with whey", "Poha with peanuts", "Idli with sprouts", "Moong Dal Chilla", "Protein Smoothie", "Besan Chilla", "Chia Pudding"][i]
                lunch = ["Brown rice & Paneer", "Quinoa & Tofu", "Lentils & Rice", "Chickpea Salad", "Soya Chunks Curry", "Rajma & Brown Rice", "Mixed Veg Sabzi"][i]
                dinner = ["Dal & Greens", "Grilled Tofu", "Vegetable Soup", "Paneer Tikka", "Mushroom Curry", "Salad & Seeds", "Roasted Veggies"][i]
            else:
                breakfast = ["Scrambled egg whites", "Omelette with toast", "Protein Oats", "Boiled Eggs", "Chicken Sausage", "Protein Smoothie", "Egg Sandwich"][i]
                lunch = ["Grilled chicken & rice", "Fish & sweet potato", "Chicken salad", "Turkey & Quinoa", "Beef stir fry", "Chicken wrap", "Lean Steak"][i]
                dinner = ["Baked fish & asparagus", "Chicken breast & greens", "Salmon salad", "Tuna & Broccoli", "Chicken Soup", "Prawn Salad", "Grilled Chicken"][i]

            meals = [
                {"meal": "Breakfast", "recommendation": breakfast, "calories": int(targets['target_calories']*0.25), "protein_g": int(targets['target_protein_g']*0.25)},
                {"meal": "Lunch", "recommendation": lunch, "calories": int(targets['target_calories']*0.35), "protein_g": int(targets['target_protein_g']*0.35)},
                {"meal": "Snack", "recommendation": "Greek yogurt & nuts", "calories": int(targets['target_calories']*0.15), "protein_g": int(targets['target_protein_g']*0.15)},
                {"meal": "Dinner", "recommendation": dinner, "calories": int(targets['target_calories']*0.25), "protein_g": int(targets['target_protein_g']*0.25)}
            ]
            
            weekly_plan.append({
                "day": day,
                "is_today": day == today_name,
                "meals": meals
            })

        return {
            "targets": targets,
            "meals": weekly_plan[today_idx]["meals"], 
            "weekly_plan": weekly_plan,
            "diet_type": dietary_profile.diet_preference,
            "safety_disclaimer": targets['disclaimer']
        }