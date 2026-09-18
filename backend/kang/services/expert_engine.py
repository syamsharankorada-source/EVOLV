import re
from typing import Optional, Dict, Any


class KangExpertEngine:
    """
    High-accuracy, real-time deterministic fitness, nutrition, and workout knowledge engine.
    Supplies accurate, step-by-step guidance when external LLM APIs are unreachable or unconfigured.
    """

    EXERCISES = {
        'squat': {
            'title': 'Bodyweight Squat',
            'target': 'Quadriceps, Glutes, Hamstrings & Core',
            'steps': [
                'Stand tall with your feet shoulder-width apart and toes pointing slightly outward (about 15-30 degrees).',
                'Brace your core muscles tight, keep your chest upright, and fix your gaze straight ahead.',
                'Hinge at your hips and bend your knees simultaneously, pushing your hips back as if sitting into an invisible chair.',
                'Descend until your thighs are at least parallel to the floor, ensuring knees track inline with your toes without caving in.',
                'Drive firmly through your heels and midfoot to push the ground away, standing back up to full extension and squeezing your glutes at the top.'
            ],
            'common_mistakes': 'Do not let your heels lift off the ground or allow your lower back to round.',
            'pro_tip': 'Inhale on the descent down, exhale forcefully as you drive upward.'
        },
        'pushup': {
            'title': 'Standard Push-Up',
            'target': 'Pectorals, Anterior Deltoids, Triceps & Core',
            'steps': [
                'Set up in a high plank position with your hands planted slightly wider than shoulder-width, fingers spread.',
                'Align your body in a dead-straight line from the back of your head down through your hips to your heels.',
                'Engage your glutes and pull your belly button inward to prevent your lower back from sagging.',
                'Lower your chest toward the floor with elbows tucked at a 45-degree angle to your ribs (not flared out 90 degrees).',
                'Lower until your chest hovers 1-2 inches above the ground, then press aggressively through your palms to return to full lockout.'
            ],
            'common_mistakes': 'Avoid letting your head drop forward or letting your lower back sag.',
            'pro_tip': 'Keep your shoulder blades pulled down and back (scapular retraction) during the descent.'
        },
        'plank': {
            'title': 'Forearm Plank',
            'target': 'Transverse Abdominis, Rectus Abdominis, Glutes & Shoulders',
            'steps': [
                'Place your forearms on the floor with elbows aligned directly beneath your shoulders, arms parallel.',
                'Extend both legs straight back with toes tucked, distributing weight between forearms and balls of feet.',
                'Actively squeeze your glutes, quadriceps, and abdominal wall simultaneously to form an iron-straight bridge.',
                'Keep your neck neutral by looking directly at the floor between your hands.',
                'Breathe steadily through your diaphragm for the prescribed duration (e.g. 30 to 60 seconds) without holding your breath.'
            ],
            'common_mistakes': 'Do not allow your hips to pike up in an A-frame or drop below parallel.',
            'pro_tip': 'Think about pulling your elbows toward your toes to generate intense core tension.'
        },
        'lunge': {
            'title': 'Walking or Forward Lunge',
            'target': 'Quadriceps, Glutes, Hamstrings & Calves',
            'steps': [
                'Stand upright with hands on your hips and feet hip-distance apart.',
                'Take a large, controlled step forward with your right leg.',
                'Lower your hips straight down until both knees are bent at roughly 90-degree angles.',
                'Ensure your front knee stays stacked directly over your front ankle and does not jut past your toes.',
                'Drive through the front heel to push back up to starting position or step through with the trailing leg.'
            ],
            'common_mistakes': 'Avoid leaning excessively forward from your torso or letting the back knee slam into the floor.',
            'pro_tip': 'Keep your torso vertical as if your spine is sliding along a wall.'
        },
        'glute bridge': {
            'title': 'Glute Bridge',
            'target': 'Gluteus Maximus, Hamstrings & Lower Back Stability',
            'steps': [
                'Lie flat on your back with knees bent and feet planted flat on the floor, hip-width apart and 6-8 inches from your glutes.',
                'Rest your arms by your sides with palms pressing lightly into the floor.',
                'Brace your core, then drive down through your heels to hoist your hips toward the ceiling.',
                'Hold at peak contraction for 1-2 seconds, creating a straight ramp line from knees down to shoulders.',
                'Lower down with control until your pelvis lightly touches the mat, then immediately repeat.'
            ],
            'common_mistakes': 'Do not hyperextend your lower back at the top; the movement must come from your glutes.',
            'pro_tip': 'Place a resistance band right above your knees to activate the gluteus medius.'
        },
        'hollow': {
            'title': 'Hollow Body Hold',
            'target': 'Deep Core, Rectus Abdominis & Hip Flexors',
            'steps': [
                'Lie on your back with legs fully extended together and arms stretched straight overhead past your ears.',
                'Tilt your pelvis backward to glue your entire lower back firmly into the floor with zero gap.',
                'Simultaneously lift your shoulder blades, head, and legs about 4-6 inches off the floor, forming a shallow banana shape.',
                'Point your toes forward and squeeze your inner thighs and abdominal wall as hard as possible.',
                'Hold this tension while breathing shallowly, ensuring your lumbar spine never breaks contact with the floor.'
            ],
            'common_mistakes': 'If your lower back arches off the mat, bend your knees or raise your legs higher to regress.',
            'pro_tip': 'This is the master foundation movement for gymnastics, pull-ups, and handstands.'
        },
        'deadlift': {
            'title': 'Hip Hinge / Deadlift',
            'target': 'Posterior Chain (Hamstrings, Glutes, Erector Spinae & Lats)',
            'steps': [
                'Stand with your feet hip-width apart, weight balanced over mid-foot.',
                'Soften your knees slightly (about 15 degrees) and lock that knee angle in place.',
                'Push your hips straight back toward the wall behind you while keeping your spine neutral and lats packed tight.',
                'Hinge forward until your torso is roughly 45 degrees to the floor and you feel a deep stretch in your hamstrings.',
                'Drive your hips forward aggressively and squeeze your glutes hard at the top to complete the repetition.'
            ],
            'common_mistakes': 'Never round your upper or lower back during the hinge; maintain a flat neutral spine.',
            'pro_tip': 'Think of pushing an elevator door shut with your hips rather than bending over.'
        },
        'bicep curl': {
            'title': 'Bicep Curl',
            'target': 'Biceps Brachii & Brachialis',
            'steps': [
                'Stand tall holding dumbbells or resistance bands at arm\'s length by your thighs, palms facing forward.',
                'Pin your elbows firmly against your ribcage and keep your shoulders pulled back.',
                'Without swinging your torso, curl the weights up toward your front shoulders by contracting your biceps.',
                'Squeeze your biceps maximally at the top for a count of one.',
                'Lower the weights back down under strict 2-3 second eccentric control to full arm extension.'
            ],
            'common_mistakes': 'Do not swing your torso or thrust your hips to heave the weights upward.',
            'pro_tip': 'Control the lowering phase—the eccentric stretch accounts for massive muscle growth.'
        },
        'overhead press': {
            'title': 'Overhead Shoulder Press',
            'target': 'Anterior & Lateral Deltoids, Upper Chest, Triceps & Traps',
            'steps': [
                'Stand with feet shoulder-width apart, holding weights at shoulder level with wrists stacked over elbows.',
                'Squeeze your glutes and brace your abs tight to protect your lumbar spine.',
                'Press the weights straight vertically overhead, moving your head slightly back to clear the path.',
                'Lock out your arms overhead with weights aligned directly over your midfoot, head returning to neutral.',
                'Lower the weights under strict control back to the collarbone starting position.'
            ],
            'common_mistakes': 'Do not arch your lower back backward to assist the lift.',
            'pro_tip': 'Look straight ahead and exhale sharply as you press past your forehead.'
        }
    }

    NUTRITION_TOPICS = {
        'post-workout': (
            "1. Consume 25-40 grams of high-quality protein within 45-60 minutes post-workout to kickstart muscle protein synthesis.\n"
            "2. Pair it with 40-60 grams of fast-to-moderate digesting carbohydrates to replenish depleted muscle glycogen stores.\n"
            "3. Ideal meals include: Whey or plant protein shake with banana; grilled chicken breast with white rice; or boiled eggs with whole grain toast.\n"
            "4. Rehydrate thoroughly: drink at least 500-750 ml of water with a pinch of salt or electrolytes."
        ),
        'pre-workout': (
            "1. Eat a light, carb-dominant meal 60-90 minutes before training to fuel high-intensity muscular contractions.\n"
            "2. Great choices: Oatmeal with sliced banana; whole wheat toast with peanut butter; or a fruit smoothie.\n"
            "3. Keep fat and excess fiber low right before training to avoid sluggish digestion and gastrointestinal distress.\n"
            "4. Drink 400-500 ml of water 30 minutes before your first working set."
        ),
        'weight loss': (
            "1. Maintain a moderate, sustainable caloric deficit of 300-500 kcal below your Total Daily Energy Expenditure (TDEE).\n"
            "2. Prioritize high-protein intake (1.6 to 2.2 grams per kg of body weight) to preserve lean muscle while burning body fat.\n"
            "3. Fill half your plate at lunch and dinner with fibrous leafy vegetables to enhance satiety.\n"
            "4. Drink 3-4 liters of plain water daily and limit liquid calories like sugary sodas, alcohol, and fruit juices."
        ),
        'muscle gain': (
            "1. Target a lean surplus of 250-400 calories above your maintenance level to fuel hypertrophy without excessive fat gain.\n"
            "2. Consume 1.8-2.2 grams of protein per kilogram of body weight spread evenly across 3-5 meals.\n"
            "3. Progressively overload your workouts weekly by adding weight, repetitions, or improving execution form.\n"
            "4. Sleep 7-9 hours every night—muscles are stimulated in the gym but grow during deep restorative sleep."
        ),
        'protein': (
            "1. Top Vegetarian sources: Paneer (18g/100g), Soya chunks (52g/100g), Greek yogurt (10g/100g), Sprouts, Lentils, and Whey.\n"
            "2. Top Non-Vegetarian sources: Chicken breast (31g/100g), Whole eggs (6g/egg), Fish, and Lean mutton.\n"
            "3. Space your protein intake every 3-4 hours to keep muscle protein synthesis elevated throughout the day."
        ),
        'creatine': (
            "1. Creatine Monohydrate is the most thoroughly researched and safest supplement for strength and muscle mass.\n"
            "2. Take 3 to 5 grams consistently every single day, at any convenient time.\n"
            "3. Loading phase is optional: 20g/day for 5 days saturates stores faster, but 5g/day achieves the same result in 3 weeks.\n"
            "4. Ensure adequate daily water intake (at least 3.5 liters) as creatine draws water into muscle cells."
        )
    }

    @classmethod
    def match_intent(cls, msg: str) -> Optional[Dict[str, Any]]:
        text = msg.lower().strip()

        # 1. Match Exercise Form / Technique queries
        for key, ex in cls.EXERCISES.items():
            if key in text or (key == 'hollow' and 'banana' in text):
                steps_formatted = "\n".join(f"{i+1}. {s}" for i, s in enumerate(ex['steps']))
                reply = (
                    f"Here is how to execute a textbook {ex['title']} ({ex['target']}):\n\n"
                    f"{steps_formatted}\n\n"
                    f"Common Fault to Avoid: {ex['common_mistakes']}\n"
                    f"Pro Tip: {ex['pro_tip']}"
                )
                return {
                    'reply': reply,
                    'emotion': 'focused',
                    'intent': 'exercise_form'
                }

        # 2. Match Nutrition & Diet queries
        if any(w in text for w in ['post-workout', 'post workout', 'after workout', 'after gym', 'what to eat after']):
            return {'reply': cls.NUTRITION_TOPICS['post-workout'], 'emotion': 'encouraging', 'intent': 'nutrition'}
        if any(w in text for w in ['pre-workout', 'pre workout', 'before workout', 'before gym', 'what to eat before']):
            return {'reply': cls.NUTRITION_TOPICS['pre-workout'], 'emotion': 'focused', 'intent': 'nutrition'}
        if any(w in text for w in ['lose weight', 'fat loss', 'cut weight', 'weight loss', 'burn fat']):
            return {'reply': cls.NUTRITION_TOPICS['weight loss'], 'emotion': 'encouraging', 'intent': 'weight_loss'}
        if any(w in text for w in ['build muscle', 'muscle gain', 'bulk', 'hypertrophy', 'gain size']):
            return {'reply': cls.NUTRITION_TOPICS['muscle gain'], 'emotion': 'focused', 'intent': 'muscle_gain'}
        if any(w in text for w in ['protein', 'high protein', 'protein sources']):
            return {'reply': cls.NUTRITION_TOPICS['protein'], 'emotion': 'encouraging', 'intent': 'nutrition'}
        if any(w in text for w in ['creatine', 'creatine monohydrate']):
            return {'reply': cls.NUTRITION_TOPICS['creatine'], 'emotion': 'focused', 'intent': 'supplements'}

        # 3. Workout structure query
        if any(w in text for w in ['workout plan', 'routine', 'split', 'how to train']):
            reply = (
                "1. Choose a structured training split: Push/Pull/Legs for 3-6 days, or Upper/Lower for 4 days weekly.\n"
                "2. Begin every session with 5 minutes of dynamic joint mobility (arm circles, hip openers, bodyweight squats).\n"
                "3. Perform 3-4 compound movements first (squat, bench press, deadlift, overhead press, pull-ups).\n"
                "4. Follow with 2-3 isolation exercises (curls, lateral raises, triceps pushdowns) for 3 sets of 10-15 reps.\n"
                "5. Cool down with light walking and static stretching to promote recovery."
            )
            return {'reply': reply, 'emotion': 'encouraging', 'intent': 'workout_planning'}

        # 4. General greeting or motivational check-in
        if any(text.startswith(w) for w in ['hi', 'hello', 'hey', 'good morning', 'good evening', 'yo']):
            reply = (
                "Ready to crush your session! I am KANG, your AI Coach. "
                "Ask me about any workout technique (squats, pushups, lunges), "
                "nutrition strategies (pre/post-workout meals, fat loss), or form correction!"
            )
            return {'reply': reply, 'emotion': 'encouraging', 'intent': 'greeting'}

        return None

