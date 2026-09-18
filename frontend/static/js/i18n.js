/**
 * EVOLV i18n — Multilingual Translation System
 * Supports: English (en), Hindi (hi), Telugu (te)
 */
const I18n = {
    currentLang: 'en',

    translations: {
        en: {
            // ── App title ──────────────────────────────────────────────
            app_title: 'EVOLV - Smart Fitness Analytics',

            // ── Auth Modal ─────────────────────────────────────────────
            auth_welcome: 'Welcome Back',
            auth_signin_sub: 'Sign in with Phone or Email',
            auth_phone_placeholder: 'Phone Number or Email',
            auth_send_otp: 'Send OTP',
            auth_or: 'or',
            auth_create_account: 'Create New Account',
            auth_guest: 'Continue as Guest',
            auth_otp_hint: 'Enter 4-digit OTP sent to your device',
            auth_verify: 'Verify & Login',

            // ── Navbar ─────────────────────────────────────────────────
            nav_sign_in: 'Sign In',
            nav_get_started: 'Get Started',
            nav_dashboard: 'Dashboard',
            nav_ai_coach: 'KANG AI',
            nav_neuro: 'Neuro Readiness',
            nav_workouts: 'Workouts',
            nav_nutrition: 'Nutrition',
            nav_community: 'Community',
            nav_progress: 'Progress',
            nav_settings: 'Settings',
            nav_shortcuts: 'Shortcuts',
            nav_vibe: 'Vibe',


            // ── Landing ────────────────────────────────────────────────
            landing_badge: 'Your Personal AI Fitness Coach',
            landing_h1_line1: 'Fitness Redefined',
            landing_h1_line2: 'with AI.',
            landing_subtext: 'Personalized workouts, real nutrition guidance, and KANG — your personal AI coach — all in one simple place.',
            landing_login: 'Login / Sign In',
            landing_setup: 'Setup New Profile',

            // ── Onboarding ─────────────────────────────────────────────
            ob_step_label: 'Step',
            ob_step_of: 'of',
            ob_setup: 'EVOLV Setup',
            ob_back: 'Back',
            ob_next: 'Next',
            ob_activate: 'Activate EVOLV',

            ob_step1_title: 'Help us create the perfect plan for you',
            ob_step1_sub: "Answer a few quick questions to get started. We'll use this information to personalize the app and tailor workouts to your goals.",
            ob_phone_label: 'Phone Number or Email',
            ob_name_label: 'Full Name',
            ob_name_placeholder: 'e.g. Alex Hunter',
            ob_gender_label: 'Gender',
            ob_gender_male: 'Man',
            ob_gender_female: 'Woman',
            ob_gender_other: 'Other / Non-binary',
            ob_age_label: 'Age group',
            ob_age_teen: 'Teen (<19 years)',
            ob_age_20s: '20 - 29 years',
            ob_age_30s: '30 - 39 years',
            ob_age_40s: '40 - 49 years',
            ob_age_50plus: '50+ years',
            ob_height_label: 'Height (cm)',
            ob_weight_label: 'Weight (kg)',

            ob_step2_title: 'Goal',
            ob_step2_sub: 'Tell us what you want to achieve by using the app.',
            ob_goal_burn_fat: 'Burn fat',
            ob_goal_endurance: 'Increase endurance',
            ob_goal_stress: 'Reduce stress',
            ob_goal_sleep: 'Sleep better',
            ob_goal_healthier: 'Live healthier',
            ob_goal_muscle: 'Build muscle',

            ob_step3_title: 'Equipment',
            ob_step3_sub: 'Select your equipment so we will be able to fill training sets with appropriate exercises. You can change equipment any time.',
            ob_equip_barbell: 'Barbell',
            ob_equip_dumbbells: 'Dumbbells',
            ob_equip_bench: 'Bench',
            ob_equip_pullup: 'Pull-up bar',
            ob_equip_gym: 'Other (Gym)',
            ob_equip_bodyweight: 'Bodyweight Only',

            ob_step4_title: 'Fitness Experience',
            ob_step4_sub: 'Let us know your training background and workout preferences.',
            ob_fitness_label: 'Current Fitness Level',
            ob_fitness_beginner: 'Beginner (New to consistent exercise)',
            ob_fitness_intermediate: 'Intermediate (1-2 years experience)',
            ob_fitness_advanced: 'Advanced (3+ years consistent lifting/training)',
            ob_location_label: 'Primary Workout Location',
            ob_location_home: 'Home',
            ob_location_gym: 'Commercial Gym',
            ob_location_outdoor: 'Outdoor / Calisthenics Park',
            ob_duration_label: 'Preferred Duration (Mins)',
            ob_duration_20: '20 - 30 minutes (Quick)',
            ob_duration_45: '40 - 50 minutes (Standard)',
            ob_duration_60: '60+ minutes (Comprehensive)',

            ob_step5_title: 'Lifestyle & Wellness',
            ob_step5_sub: 'Your daily habits help EVOLV calculate accurate calorie burn and recovery needs.',
            ob_activity_label: 'Daily Activity Level',
            ob_activity_sedentary: 'Sedentary (Desk job, minimal daily movement)',
            ob_activity_light: 'Lightly Active (Light walking, light chores)',
            ob_activity_moderate: 'Moderately Active (Active during day, on feet)',
            ob_activity_very: 'Very Active (Heavy manual work or athlete)',
            ob_sleep_label: 'Average Sleep',
            ob_sitting_label: 'Sitting Time / Day',
            ob_water_label: 'Daily Water Target (ml)',

            ob_step6_title: 'Dietary Preferences',
            ob_step6_sub: 'Customize your nutrition meal plan and macro recommendations.',
            ob_diet_label: 'Primary Diet',
            ob_diet_nonveg: 'Non-Vegetarian (Chicken, Fish, Eggs, Meat)',
            ob_diet_veg: 'Vegetarian (Dairy, Plant-based, Pulses)',
            ob_diet_egg: 'Eggetarian (Vegetarian + Eggs)',
            ob_diet_vegan: 'Vegan (Strict 100% Plant-based)',
            ob_diet_keto: 'Keto / Low-Carb',
            ob_allergies_label: 'Allergies / Foods to Avoid',
            ob_allergies_placeholder: 'e.g. Peanuts, Gluten, Dairy, Shellfish',
            ob_meals_label: 'Meals per Day',
            ob_meals_2: '2 Meals (Intermittent Fasting)',
            ob_meals_3: '3 Standard Meals (Breakfast, Lunch, Dinner)',
            ob_meals_4: '4 Meals (3 Main Meals + 1 Snack)',
            ob_meals_5: '5 Small Frequent Meals',

            ob_step7_title: 'Physical Limitations',
            ob_step7_sub: 'Tell us about any joint discomfort or past injuries so KANG can adapt exercise suggestions.',
            ob_limitations_label: 'Joint / Body Discomfort',
            ob_lim_none: 'None (Ready for all movements)',
            ob_lim_knee: 'Knee Discomfort / Sensitive knees',
            ob_lim_back: 'Lower Back Discomfort',
            ob_lim_shoulder: 'Shoulder Impingement / Mobility limit',
            ob_lim_wrist: 'Wrist Strain',
            ob_injury_label: 'Specific Injury or Health Note (Optional)',
            ob_injury_placeholder: 'e.g. ACL surgery in 2023, Avoid heavy overhead press',

            ob_step8_title: 'Schedule & Target',
            ob_step8_sub: 'Define your weekly workout frequency and long-term milestone.',
            ob_workout_days_label: 'Workout Days per Week',
            ob_days_2: '2 Days / Week (Light)',
            ob_days_3: '3 Days / Week (Full Body Split)',
            ob_days_4: '4 Days / Week (Upper / Lower Split)',
            ob_days_5: '5 Days / Week (Push / Pull / Legs)',
            ob_days_6: '6 Days / Week (Advanced High Frequency)',
            ob_target_weight_label: 'Target Goal Weight (kg, optional)',

            ob_step9_title: 'Device & Tracker',
            ob_step9_sub: 'Link your smartwatch, fitness band, or smartphone to sync heart rate, steps, and sleep.',
            ob_wearable_label: 'Do you use a fitness band or smartwatch?',
            ob_wearable_none: 'No Device',
            ob_device_bt_title: 'Live Device Connection',
            ob_device_bt_sub: 'You can also pair Bluetooth / QR code anytime from Progress.',
            ob_device_ready: 'Ready',

            ob_step10_title: 'Notifications',
            ob_step10_sub: 'Decide what notifications you want to receive. You can change these and other options in the app settings at any time.',
            ob_notif_training: 'Training notifications',
            ob_notif_weight: 'Weight-in notifications',
            ob_notif_water: 'Watering notifications',

            // ── Dashboard ──────────────────────────────────────────────
            dash_sync: 'Sync',
            dash_start_workout: 'Start Workout',
            dash_todays_workout: "Today's Workout Plan",
            dash_details: 'Details →',
            dash_nutrition_snap: 'Nutrition Snapshot',
            dash_scanner: 'Scanner →',
            dash_day_streak: 'Day Streak',
            dash_workouts: 'Workouts',
            dash_total_xp: 'Total XP',
            dash_daily_log: 'Daily Log',
            dash_water: 'Water',
            dash_steps: 'Steps',
            dash_sleep: 'Sleep',

            // ── Workout Session Modal ──────────────────────────────────
            session_live: 'Live Session',
            session_form_guide: '2D Athletic Form Guide',
            session_controlled: 'Controlled demo',
            session_pause: 'Pause',
            session_resume: 'Resume',
            session_form_fix: 'Form Fix',
            session_next: 'Next',
            session_swap: 'Swap',
            session_finish_early: 'Finish Early',
            session_workout_done: 'Workout Done!',
            session_how_feel: 'How did it feel?',
            session_too_easy: 'Too Easy',
            session_comfortable: 'Comfort',
            session_challenging: 'Challenge',
            session_too_hard: 'Too Hard',

            // ── Workouts View ──────────────────────────────────────────
            workouts_title: 'Workout Regimen',

            // ── Nutrition View ─────────────────────────────────────────
            nutrition_title: 'Nutrition Engine',
            nutrition_sub: 'Scan food to auto-calculate macros.',
            nutrition_snap: 'Snap Meal',
            nutrition_today: "Today's Intake",
            nutrition_calories: 'Calories',
            nutrition_protein: 'Protein',
            nutrition_carbs: 'Carbs',
            nutrition_fats: 'Fats',
            nutrition_fiber: 'Fiber',

            // ── Community View ─────────────────────────────────────────
            community_title: 'Community Hub',
            community_sub: 'Find certified-by-self-report nutritionists & coaches, or share your own content.',
            community_browse: 'Browse Coaches',
            community_feed: 'Community Feed',
            community_mycoach: 'My Coach Profile',
            community_new_post: 'New Post',
            community_become_coach: 'Become a Community Coach',
            community_save_coach: 'Save Coach Profile',
            community_hire_requests: "Hire Requests You've Received",
            community_hire_req: 'Request to Hire',
            community_share: 'Share Content',
            community_publish: 'Publish',

            // ── Progress View ──────────────────────────────────────────
            progress_title: 'Progress & Analytics',

            // ── AI Coach View ──────────────────────────────────────────
            kang_placeholder: 'Ask KANG anything about your fitness...',
            kang_send: 'Send',
            kang_clear: 'Clear History',
            kang_new_chat: 'New Chat',

            // ── Neuro View ─────────────────────────────────────────────
            neuro_title: 'Neuro-Athletic Readiness',

            // ── Settings View ──────────────────────────────────────────
            settings_title: 'Settings',
            settings_connect_device: 'Connect Device',
            settings_connect_device_sub: 'Smartwatches, Fitness Bands, Smartphones',
            settings_connect_btn: 'Connect',
            settings_alarms: 'Smart Alarms',
            settings_alarms_sub: 'Hydration Reminders',
            settings_language: 'Language',
            settings_language_sub: 'Choose your preferred display language',
            settings_shortcuts: 'Keyboard Shortcuts',
            settings_shortcuts_sub: 'All available keyboard shortcuts for EVOLV',
            settings_sign_out: 'Sign Out',
            settings_reset: 'Reset Data',

            // ── Shortcuts Modal ────────────────────────────────────────
            sc_title: 'Keyboard Shortcuts',
            sc_sub: 'Navigate EVOLV and run actions instantly',
            sc_nav: 'Navigation',
            sc_actions: 'Quick Actions',
            sc_session: 'During Active Session',
            sc_footer: 'Shortcuts are paused while typing in form inputs.',
            sc_close: 'Close',
            sc_dashboard: 'Dashboard',
            sc_kang: 'KANG AI Coach',
            sc_neuro: 'Neuro Readiness',
            sc_workouts: 'Workouts',
            sc_nutrition: 'Nutrition',
            sc_community: 'Community',
            sc_progress: 'Progress',
            sc_vibe: 'The Vibe',
            sc_settings: 'Settings',
            sc_start_workout: 'Start Workout',
            sc_reaction: 'Start CNS Reaction Test',
            sc_sync: 'Sync Smartwatch',
            sc_show_shortcuts: 'Show Shortcuts Cheat Sheet',
            sc_close_modal: 'Close Any Active Modal',
            sc_tap_react: 'Tap / React (Reaction Test)',
            sc_pause_resume: 'Pause / Resume Workout',
            sc_next_ex: 'Next Exercise',
            sc_form_fix: 'Form Fix Analysis',

            // ── Scanner Modal ──────────────────────────────────────────
            scanner_cancel: 'Cancel',
            scanner_capture: 'Capture & Analyze',
            scanner_desc: 'Align the food within the frame.',

            // ── Wearable Modal ─────────────────────────────────────────
            wearable_title: 'Connect Your Device',
            wearable_sub: 'Pair any Bluetooth wearable or smartphone to sync steps, heart rate, sleep, and more.',
            wearable_bluetooth: 'Bluetooth',
            wearable_qr: 'QR Pairing',
            wearable_select: 'Select Model',
            wearable_scan_btn: 'Scan & Connect Device',
            wearable_regen_qr: 'Regenerate QR code',
            wearable_save: "Save Today's Data",

            // ── Form Corrector ─────────────────────────────────────────
            fc_live: 'LIVE ANALYSIS',
            fc_exercise: 'Exercise',
            fc_stage: 'Stage',
            fc_posture: 'Posture',
            fc_reps: 'Reps',
            fc_good_posture: 'Good Posture',
            fc_reset: 'Reset',
            fc_ask_kang: 'Ask KANG for Feedback',
        },

        hi: {
            // ── App title ──────────────────────────────────────────────
            app_title: 'EVOLV - स्मार्ट फिटनेस एनालिटिक्स',

            // ── Auth Modal ─────────────────────────────────────────────
            auth_welcome: 'वापस स्वागत है',
            auth_signin_sub: 'फोन या ईमेल से साइन इन करें',
            auth_phone_placeholder: 'फोन नंबर या ईमेल',
            auth_send_otp: 'OTP भेजें',
            auth_or: 'या',
            auth_create_account: 'नया खाता बनाएं',
            auth_guest: 'अतिथि के रूप में जारी रखें',
            auth_otp_hint: 'अपने डिवाइस पर भेजा गया 4-अंकीय OTP दर्ज करें',
            auth_verify: 'सत्यापित करें और लॉगिन करें',

            // ── Navbar ─────────────────────────────────────────────────
            nav_sign_in: 'साइन इन',
            nav_get_started: 'शुरू करें',
            nav_dashboard: 'डैशबोर्ड',
            nav_ai_coach: 'KANG AI',
            nav_neuro: 'न्यूरो तत्परता',
            nav_workouts: 'वर्कआउट',
            nav_nutrition: 'पोषण',
            nav_community: 'समुदाय',
            nav_progress: 'प्रगति',
            nav_settings: 'सेटिंग्स',
            nav_shortcuts: 'शॉर्टकट',
            nav_vibe: 'वाइब',


            // ── Landing ────────────────────────────────────────────────
            landing_badge: 'आपका व्यक्तिगत AI फिटनेस कोच',
            landing_h1_line1: 'फिटनेस, नए अंदाज़ में',
            landing_h1_line2: 'AI के साथ।',
            landing_subtext: 'व्यक्तिगत वर्कआउट, असली पोषण मार्गदर्शन, और KANG — आपका निजी AI कोच — सब एक ही जगह।',
            landing_login: 'लॉगिन / साइन इन',
            landing_setup: 'नया प्रोफ़ाइल सेटअप करें',

            // ── Onboarding ─────────────────────────────────────────────
            ob_step_label: 'चरण',
            ob_step_of: 'में से',
            ob_setup: 'EVOLV सेटअप',
            ob_back: 'वापस',
            ob_next: 'अगला',
            ob_activate: 'EVOLV सक्रिय करें',

            ob_step1_title: 'आपके लिए सही योजना बनाने में मदद करें',
            ob_step1_sub: 'शुरुआत के लिए कुछ त्वरित प्रश्नों के उत्तर दें। हम इस जानकारी का उपयोग ऐप को वैयक्तिकृत करने और आपके लक्ष्यों के अनुसार वर्कआउट तैयार करने के लिए करेंगे।',
            ob_phone_label: 'फोन नंबर या ईमेल',
            ob_name_label: 'पूरा नाम',
            ob_name_placeholder: 'जैसे: राज शर्मा',
            ob_gender_label: 'लिंग',
            ob_gender_male: 'पुरुष',
            ob_gender_female: 'महिला',
            ob_gender_other: 'अन्य / गैर-बाइनरी',
            ob_age_label: 'आयु वर्ग',
            ob_age_teen: 'किशोर (<19 वर्ष)',
            ob_age_20s: '20 - 29 वर्ष',
            ob_age_30s: '30 - 39 वर्ष',
            ob_age_40s: '40 - 49 वर्ष',
            ob_age_50plus: '50+ वर्ष',
            ob_height_label: 'ऊंचाई (सेमी)',
            ob_weight_label: 'वजन (किग्रा)',

            ob_step2_title: 'लक्ष्य',
            ob_step2_sub: 'हमें बताएं कि आप ऐप का उपयोग करके क्या हासिल करना चाहते हैं।',
            ob_goal_burn_fat: 'चर्बी जलाएं',
            ob_goal_endurance: 'सहनशक्ति बढ़ाएं',
            ob_goal_stress: 'तनाव कम करें',
            ob_goal_sleep: 'बेहतर नींद',
            ob_goal_healthier: 'स्वस्थ जीवन',
            ob_goal_muscle: 'मांसपेशियां बनाएं',

            ob_step3_title: 'उपकरण',
            ob_step3_sub: 'अपने उपकरण चुनें ताकि हम प्रशिक्षण सेट उचित व्यायामों से भर सकें। आप किसी भी समय उपकरण बदल सकते हैं।',
            ob_equip_barbell: 'बारबेल',
            ob_equip_dumbbells: 'डंबल',
            ob_equip_bench: 'बेंच',
            ob_equip_pullup: 'पुल-अप बार',
            ob_equip_gym: 'अन्य (जिम)',
            ob_equip_bodyweight: 'केवल बॉडीवेट',

            ob_step4_title: 'फिटनेस अनुभव',
            ob_step4_sub: 'हमें अपनी प्रशिक्षण पृष्ठभूमि और वर्कआउट प्राथमिकताओं के बारे में बताएं।',
            ob_fitness_label: 'वर्तमान फिटनेस स्तर',
            ob_fitness_beginner: 'शुरुआती (नियमित व्यायाम में नए)',
            ob_fitness_intermediate: 'मध्यम (1-2 साल का अनुभव)',
            ob_fitness_advanced: 'उन्नत (3+ साल का निरंतर प्रशिक्षण)',
            ob_location_label: 'प्राथमिक वर्कआउट स्थान',
            ob_location_home: 'घर',
            ob_location_gym: 'व्यावसायिक जिम',
            ob_location_outdoor: 'बाहर / कैलिस्थेनिक्स पार्क',
            ob_duration_label: 'पसंदीदा अवधि (मिनट)',
            ob_duration_20: '20 - 30 मिनट (त्वरित)',
            ob_duration_45: '40 - 50 मिनट (मानक)',
            ob_duration_60: '60+ मिनट (व्यापक)',

            ob_step5_title: 'जीवनशैली और स्वास्थ्य',
            ob_step5_sub: 'आपकी दैनिक आदतें EVOLV को सटीक कैलोरी बर्न और रिकवरी आवश्यकताओं की गणना करने में मदद करती हैं।',
            ob_activity_label: 'दैनिक गतिविधि स्तर',
            ob_activity_sedentary: 'बैठे रहना (डेस्क जॉब, न्यूनतम दैनिक गतिविधि)',
            ob_activity_light: 'हल्की सक्रियता (हल्की सैर, हल्के काम)',
            ob_activity_moderate: 'मध्यम सक्रिय (दिन के दौरान सक्रिय)',
            ob_activity_very: 'बहुत सक्रिय (भारी शारीरिक काम या एथलीट)',
            ob_sleep_label: 'औसत नींद',
            ob_sitting_label: 'बैठने का समय / दिन',
            ob_water_label: 'दैनिक पानी लक्ष्य (मिली)',

            ob_step6_title: 'आहार प्राथमिकताएं',
            ob_step6_sub: 'अपने पोषण भोजन योजना और मैक्रो अनुशंसाओं को अनुकूलित करें।',
            ob_diet_label: 'प्राथमिक आहार',
            ob_diet_nonveg: 'मांसाहारी (चिकन, मछली, अंडे, मांस)',
            ob_diet_veg: 'शाकाहारी (डेयरी, पौधे-आधारित, दालें)',
            ob_diet_egg: 'एगेटेरियन (शाकाहारी + अंडे)',
            ob_diet_vegan: 'वीगन (100% पौधे-आधारित)',
            ob_diet_keto: 'कीटो / कम-कार्ब',
            ob_allergies_label: 'एलर्जी / परहेज़ करने योग्य खाद्य पदार्थ',
            ob_allergies_placeholder: 'जैसे: मूंगफली, ग्लूटेन, डेयरी, शेलफिश',
            ob_meals_label: 'प्रति दिन भोजन',
            ob_meals_2: '2 भोजन (इंटरमिटेंट फास्टिंग)',
            ob_meals_3: '3 मानक भोजन (नाश्ता, दोपहर का खाना, रात का खाना)',
            ob_meals_4: '4 भोजन (3 मुख्य + 1 स्नैक)',
            ob_meals_5: '5 छोटे-छोटे बार-बार भोजन',

            ob_step7_title: 'शारीरिक सीमाएं',
            ob_step7_sub: 'किसी भी जोड़ की असुविधा या पिछली चोटों के बारे में बताएं ताकि KANG व्यायाम सुझावों को अनुकूलित कर सके।',
            ob_limitations_label: 'जोड़ / शरीर की असुविधा',
            ob_lim_none: 'कोई नहीं (सभी गतिविधियों के लिए तैयार)',
            ob_lim_knee: 'घुटने की परेशानी / संवेदनशील घुटने',
            ob_lim_back: 'पीठ के निचले हिस्से की परेशानी',
            ob_lim_shoulder: 'कंधे का प्रतिबंध / गतिशीलता सीमा',
            ob_lim_wrist: 'कलाई का खिंचाव',
            ob_injury_label: 'विशिष्ट चोट या स्वास्थ्य नोट (वैकल्पिक)',
            ob_injury_placeholder: 'जैसे: 2023 में ACL सर्जरी, भारी ओवरहेड प्रेस से बचें',

            ob_step8_title: 'शेड्यूल और लक्ष्य',
            ob_step8_sub: 'अपनी साप्ताहिक वर्कआउट आवृत्ति और दीर्घकालिक मील का पत्थर निर्धारित करें।',
            ob_workout_days_label: 'प्रति सप्ताह वर्कआउट के दिन',
            ob_days_2: '2 दिन / सप्ताह (हल्का)',
            ob_days_3: '3 दिन / सप्ताह (फुल बॉडी स्प्लिट)',
            ob_days_4: '4 दिन / सप्ताह (अपर / लोअर स्प्लिट)',
            ob_days_5: '5 दिन / सप्ताह (पुश / पुल / लेग्स)',
            ob_days_6: '6 दिन / सप्ताह (उन्नत उच्च आवृत्ति)',
            ob_target_weight_label: 'लक्ष्य वजन (किग्रा, वैकल्पिक)',

            ob_step9_title: 'डिवाइस और ट्रैकर',
            ob_step9_sub: 'हृदय गति, कदम और नींद सिंक करने के लिए अपनी स्मार्टवॉच, फिटनेस बैंड या स्मार्टफोन लिंक करें।',
            ob_wearable_label: 'क्या आप फिटनेस बैंड या स्मार्टवॉच उपयोग करते हैं?',
            ob_wearable_none: 'कोई डिवाइस नहीं',
            ob_device_bt_title: 'लाइव डिवाइस कनेक्शन',
            ob_device_bt_sub: 'आप प्रगति से किसी भी समय Bluetooth / QR कोड के माध्यम से जोड़ सकते हैं।',
            ob_device_ready: 'तैयार',

            ob_step10_title: 'अधिसूचनाएं',
            ob_step10_sub: 'तय करें कि आप कौन सी अधिसूचनाएं प्राप्त करना चाहते हैं। आप इन्हें और अन्य विकल्पों को किसी भी समय ऐप सेटिंग्स में बदल सकते हैं।',
            ob_notif_training: 'प्रशिक्षण अधिसूचनाएं',
            ob_notif_weight: 'वजन-इन अधिसूचनाएं',
            ob_notif_water: 'पानी पीने की अधिसूचनाएं',

            // ── Dashboard ──────────────────────────────────────────────
            dash_sync: 'सिंक',
            dash_start_workout: 'वर्कआउट शुरू करें',
            dash_todays_workout: 'आज का वर्कआउट प्लान',
            dash_details: 'विवरण →',
            dash_nutrition_snap: 'पोषण स्नैपशॉट',
            dash_scanner: 'स्कैनर →',
            dash_day_streak: 'दिन की स्ट्रीक',
            dash_workouts: 'वर्कआउट',
            dash_total_xp: 'कुल XP',
            dash_daily_log: 'दैनिक लॉग',
            dash_water: 'पानी',
            dash_steps: 'कदम',
            dash_sleep: 'नींद',

            // ── Workout Session Modal ──────────────────────────────────
            session_live: 'लाइव सेशन',
            session_form_guide: '2D एथलेटिक फॉर्म गाइड',
            session_controlled: 'नियंत्रित डेमो',
            session_pause: 'रोकें',
            session_resume: 'जारी रखें',
            session_form_fix: 'फॉर्म ठीक करें',
            session_next: 'अगला',
            session_swap: 'बदलें',
            session_finish_early: 'जल्दी समाप्त करें',
            session_workout_done: 'वर्कआउट पूरा!',
            session_how_feel: 'कैसा लगा?',
            session_too_easy: 'बहुत आसान',
            session_comfortable: 'आरामदायक',
            session_challenging: 'चुनौतीपूर्ण',
            session_too_hard: 'बहुत कठिन',

            // ── Workouts View ──────────────────────────────────────────
            workouts_title: 'वर्कआउट योजना',

            // ── Nutrition View ─────────────────────────────────────────
            nutrition_title: 'पोषण इंजन',
            nutrition_sub: 'मैक्रो की गणना के लिए भोजन स्कैन करें।',
            nutrition_snap: 'भोजन स्नैप करें',
            nutrition_today: 'आज का सेवन',
            nutrition_calories: 'कैलोरी',
            nutrition_protein: 'प्रोटीन',
            nutrition_carbs: 'कार्ब्स',
            nutrition_fats: 'वसा',
            nutrition_fiber: 'फाइबर',

            // ── Community View ─────────────────────────────────────────
            community_title: 'समुदाय हब',
            community_sub: 'प्रमाणित पोषण विशेषज्ञ और कोच खोजें, या अपनी सामग्री साझा करें।',
            community_browse: 'कोच देखें',
            community_feed: 'समुदाय फीड',
            community_mycoach: 'मेरा कोच प्रोफ़ाइल',
            community_new_post: 'नई पोस्ट',
            community_become_coach: 'समुदाय कोच बनें',
            community_save_coach: 'कोच प्रोफ़ाइल सहेजें',
            community_hire_requests: 'आपको मिली भर्ती अनुरोध',
            community_hire_req: 'भर्ती का अनुरोध',
            community_share: 'सामग्री साझा करें',
            community_publish: 'प्रकाशित करें',

            // ── Progress View ──────────────────────────────────────────
            progress_title: 'प्रगति और विश्लेषण',

            // ── AI Coach View ──────────────────────────────────────────
            kang_placeholder: 'KANG से फिटनेस के बारे में कुछ भी पूछें...',
            kang_send: 'भेजें',
            kang_clear: 'इतिहास साफ करें',
            kang_new_chat: 'नई चैट',

            // ── Neuro View ─────────────────────────────────────────────
            neuro_title: 'न्यूरो-एथलेटिक तत्परता',

            // ── Settings View ──────────────────────────────────────────
            settings_title: 'सेटिंग्स',
            settings_connect_device: 'डिवाइस कनेक्ट करें',
            settings_connect_device_sub: 'स्मार्टवॉच, फिटनेस बैंड, स्मार्टफोन',
            settings_connect_btn: 'कनेक्ट करें',
            settings_alarms: 'स्मार्ट अलार्म',
            settings_alarms_sub: 'हाइड्रेशन रिमाइंडर',
            settings_language: 'भाषा',
            settings_language_sub: 'अपनी पसंदीदा प्रदर्शन भाषा चुनें',
            settings_shortcuts: 'कीबोर्ड शॉर्टकट',
            settings_shortcuts_sub: 'EVOLV के सभी उपलब्ध कीबोर्ड शॉर्टकट',
            settings_sign_out: 'साइन आउट',
            settings_reset: 'डेटा रीसेट करें',

            // ── Shortcuts Modal ────────────────────────────────────────
            sc_title: 'कीबोर्ड शॉर्टकट',
            sc_sub: 'EVOLV में तुरंत नेविगेट करें और कार्य चलाएं',
            sc_nav: 'नेविगेशन',
            sc_actions: 'त्वरित कार्य',
            sc_session: 'सक्रिय सेशन के दौरान',
            sc_footer: 'फॉर्म इनपुट में टाइप करते समय शॉर्टकट रुक जाते हैं।',
            sc_close: 'बंद करें',
            sc_dashboard: 'डैशबोर्ड',
            sc_kang: 'KANG AI कोच',
            sc_neuro: 'न्यूरो तत्परता',
            sc_workouts: 'वर्कआउट',
            sc_nutrition: 'पोषण',
            sc_community: 'समुदाय',
            sc_progress: 'प्रगति',
            sc_vibe: 'द वाइब',
            sc_settings: 'सेटिंग्स',
            sc_start_workout: 'वर्कआउट शुरू करें',
            sc_reaction: 'CNS प्रतिक्रिया परीक्षण शुरू करें',
            sc_sync: 'स्मार्टवॉच सिंक करें',
            sc_show_shortcuts: 'शॉर्टकट चीट शीट दिखाएं',
            sc_close_modal: 'सक्रिय मोडल बंद करें',
            sc_tap_react: 'टैप / प्रतिक्रिया (प्रतिक्रिया परीक्षण)',
            sc_pause_resume: 'वर्कआउट रोकें / जारी रखें',
            sc_next_ex: 'अगला व्यायाम',
            sc_form_fix: 'फॉर्म सुधार विश्लेषण',

            // ── Scanner Modal ──────────────────────────────────────────
            scanner_cancel: 'रद्द करें',
            scanner_capture: 'कैप्चर और विश्लेषण करें',
            scanner_desc: 'भोजन को फ्रेम के भीतर संरेखित करें।',

            // ── Wearable Modal ─────────────────────────────────────────
            wearable_title: 'अपना डिवाइस कनेक्ट करें',
            wearable_sub: 'कदम, हृदय गति, नींद और अधिक सिंक करने के लिए किसी भी Bluetooth वियरेबल या स्मार्टफोन को जोड़ें।',
            wearable_bluetooth: 'ब्लूटूथ',
            wearable_qr: 'QR पेयरिंग',
            wearable_select: 'मॉडल चुनें',
            wearable_scan_btn: 'स्कैन और डिवाइस कनेक्ट करें',
            wearable_regen_qr: 'QR कोड पुनः उत्पन्न करें',
            wearable_save: 'आज का डेटा सहेजें',

            // ── Form Corrector ─────────────────────────────────────────
            fc_live: 'लाइव विश्लेषण',
            fc_exercise: 'व्यायाम',
            fc_stage: 'चरण',
            fc_posture: 'मुद्रा',
            fc_reps: 'रेप्स',
            fc_good_posture: 'अच्छी मुद्रा',
            fc_reset: 'रीसेट',
            fc_ask_kang: 'KANG से फीडबैक मांगें',
        },

        te: {
            // ── App title ──────────────────────────────────────────────
            app_title: 'EVOLV - స్మార్ట్ ఫిట్‌నెస్ అనలిటిక్స్',

            // ── Auth Modal ─────────────────────────────────────────────
            auth_welcome: 'తిరిగి స్వాగతం',
            auth_signin_sub: 'ఫోన్ లేదా ఇమెయిల్‌తో సైన్ ఇన్ చేయండి',
            auth_phone_placeholder: 'ఫోన్ నంబర్ లేదా ఇమెయిల్',
            auth_send_otp: 'OTP పంపండి',
            auth_or: 'లేదా',
            auth_create_account: 'కొత్త ఖాతా సృష్టించండి',
            auth_guest: 'అతిథిగా కొనసాగండి',
            auth_otp_hint: 'మీ పరికరానికి పంపిన 4-అంకెల OTP నమోదు చేయండి',
            auth_verify: 'ధృవీకరించండి & లాగిన్',

            // ── Navbar ─────────────────────────────────────────────────
            nav_sign_in: 'సైన్ ఇన్',
            nav_get_started: 'ప్రారంభించండి',
            nav_dashboard: 'డాష్‌బోర్డ్',
            nav_ai_coach: 'KANG AI',
            nav_neuro: 'న్యూరో సన్నద్ధత',
            nav_workouts: 'వ్యాయామాలు',
            nav_nutrition: 'పోషణ',
            nav_community: 'సమాజం',
            nav_progress: 'పురోగతి',
            nav_settings: 'సెట్టింగ్‌లు',
            nav_shortcuts: 'షార్ట్‌కట్‌లు',
            nav_vibe: 'వైబ్',


            // ── Landing ────────────────────────────────────────────────
            landing_badge: 'మీ వ్యక్తిగత AI ఫిట్‌నెస్ కోచ్',
            landing_h1_line1: 'ఫిట్‌నెస్ కొత్తగా',
            landing_h1_line2: 'AI తో.',
            landing_subtext: 'వ్యక్తిగత వ్యాయామాలు, నిజమైన పోషణ మార్గదర్శకత్వం, మరియు KANG — మీ వ్యక్తిగత AI కోచ్ — అన్నీ ఒకే చోట.',
            landing_login: 'లాగిన్ / సైన్ ఇన్',
            landing_setup: 'కొత్త ప్రొఫైల్ సెటప్ చేయండి',

            // ── Onboarding ─────────────────────────────────────────────
            ob_step_label: 'దశ',
            ob_step_of: 'లో',
            ob_setup: 'EVOLV సెటప్',
            ob_back: 'వెనక్కి',
            ob_next: 'తదుపరి',
            ob_activate: 'EVOLV సక్రియం చేయండి',

            ob_step1_title: 'మీకు సరైన ప్రణాళిక రూపొందించడానికి సహాయపడండి',
            ob_step1_sub: 'ప్రారంభించడానికి కొన్ని శీఘ్ర ప్రశ్నలకు సమాధానం ఇవ్వండి. యాప్‌ను వ్యక్తిగతీకరించడానికి మరియు మీ లక్ష్యాలకు అనుగుణంగా వ్యాయామాలు రూపొందించడానికి మేము ఈ సమాచారాన్ని ఉపయోగిస్తాము.',
            ob_phone_label: 'ఫోన్ నంబర్ లేదా ఇమెయిల్',
            ob_name_label: 'పూర్తి పేరు',
            ob_name_placeholder: 'ఉదా: రాజేష్ రెడ్డి',
            ob_gender_label: 'లింగం',
            ob_gender_male: 'పురుషుడు',
            ob_gender_female: 'స్త్రీ',
            ob_gender_other: 'ఇతర / నాన్-బైనరీ',
            ob_age_label: 'వయసు వర్గం',
            ob_age_teen: 'టీనేజ్ (<19 సంవత్సరాలు)',
            ob_age_20s: '20 - 29 సంవత్సరాలు',
            ob_age_30s: '30 - 39 సంవత్సరాలు',
            ob_age_40s: '40 - 49 సంవత్సరాలు',
            ob_age_50plus: '50+ సంవత్సరాలు',
            ob_height_label: 'ఎత్తు (సెమీ)',
            ob_weight_label: 'బరువు (కిలో)',

            ob_step2_title: 'లక్ష్యం',
            ob_step2_sub: 'యాప్ ఉపయోగించి మీరు ఏమి సాధించాలనుకుంటున్నారో చెప్పండి.',
            ob_goal_burn_fat: 'కొవ్వు తగ్గించండి',
            ob_goal_endurance: 'సహనశక్తి పెంచుకోండి',
            ob_goal_stress: 'ఒత్తిడి తగ్గించండి',
            ob_goal_sleep: 'మంచి నిద్ర',
            ob_goal_healthier: 'ఆరోగ్యంగా జీవించండి',
            ob_goal_muscle: 'కండరాలు పెంచుకోండి',

            ob_step3_title: 'పరికరాలు',
            ob_step3_sub: 'మీ పరికరాలు ఎంచుకోండి తద్వారా మేము తగిన వ్యాయామాలతో శిక్షణ సెట్‌లు నింపగలుగుతాము. మీరు ఎప్పుడైనా పరికరాలు మార్చవచ్చు.',
            ob_equip_barbell: 'బార్‌బెల్',
            ob_equip_dumbbells: 'డంబెల్‌లు',
            ob_equip_bench: 'బెంచ్',
            ob_equip_pullup: 'పుల్-అప్ బార్',
            ob_equip_gym: 'ఇతర (జిమ్)',
            ob_equip_bodyweight: 'బాడీవెయిట్ మాత్రమే',

            ob_step4_title: 'ఫిట్‌నెస్ అనుభవం',
            ob_step4_sub: 'మీ శిక్షణ నేపథ్యం మరియు వ్యాయామ ప్రాధాన్యతల గురించి చెప్పండి.',
            ob_fitness_label: 'ప్రస్తుత ఫిట్‌నెస్ స్థాయి',
            ob_fitness_beginner: 'ప్రారంభకుడు (నిరంతర వ్యాయామంలో కొత్తవారు)',
            ob_fitness_intermediate: 'మధ్యస్థ (1-2 సంవత్సరాల అనుభవం)',
            ob_fitness_advanced: 'అడ్వాన్స్‌డ్ (3+ సంవత్సరాల నిరంతర శిక్షణ)',
            ob_location_label: 'ప్రాథమిక వ్యాయామ స్థానం',
            ob_location_home: 'ఇల్లు',
            ob_location_gym: 'కమర్షియల్ జిమ్',
            ob_location_outdoor: 'బయట / కాలిస్థెనిక్స్ పార్క్',
            ob_duration_label: 'ఇష్టమైన వ్యవధి (నిమిషాలు)',
            ob_duration_20: '20 - 30 నిమిషాలు (శీఘ్రం)',
            ob_duration_45: '40 - 50 నిమిషాలు (సాధారణ)',
            ob_duration_60: '60+ నిమిషాలు (సమగ్రం)',

            ob_step5_title: 'జీవనశైలి & ఆరోగ్యం',
            ob_step5_sub: 'మీ రోజువారీ అలవాట్లు EVOLV కి సరైన కేలరీ బర్న్ మరియు రికవరీ అవసరాలను లెక్కించడంలో సహాయపడతాయి.',
            ob_activity_label: 'రోజువారీ కార్యాచరణ స్థాయి',
            ob_activity_sedentary: 'నిశ్చలంగా ఉండటం (డెస్క్ జాబ్, కనీస కదలిక)',
            ob_activity_light: 'తేలికపాటి (తేలికగా నడవడం, తేలికగా పని)',
            ob_activity_moderate: 'మధ్యస్థ (రోజంతా యాక్టివ్)',
            ob_activity_very: 'చాలా యాక్టివ్ (భారీ శారీరక పని లేదా అథ్లెట్)',
            ob_sleep_label: 'సగటు నిద్ర',
            ob_sitting_label: 'కూర్చున్న సమయం / రోజు',
            ob_water_label: 'రోజువారీ నీటి లక్ష్యం (మి.లీ)',

            ob_step6_title: 'ఆహార ప్రాధాన్యతలు',
            ob_step6_sub: 'మీ పోషణ భోజన ప్రణాళిక మరియు మాక్రో సిఫార్సులను అనుకూలీకరించండి.',
            ob_diet_label: 'ప్రాథమిక ఆహారం',
            ob_diet_nonveg: 'మాంసాహారి (చికెన్, చేప, గుడ్లు, మాంసం)',
            ob_diet_veg: 'శాకాహారి (పాలు, మొక్క ఆధారిత, పప్పులు)',
            ob_diet_egg: 'ఎగ్‌టేరియన్ (శాకాహారి + గుడ్లు)',
            ob_diet_vegan: 'వేగన్ (100% మొక్క ఆధారిత)',
            ob_diet_keto: 'కీటో / తక్కువ-కార్బ్',
            ob_allergies_label: 'అలర్జీలు / నివారించాల్సిన ఆహారాలు',
            ob_allergies_placeholder: 'ఉదా: వేరుశనగ, గ్లూటెన్, పాలు, షెల్‌ఫిష్',
            ob_meals_label: 'రోజుకు భోజనాలు',
            ob_meals_2: '2 భోజనాలు (ఇంటర్మిటెంట్ ఫాస్టింగ్)',
            ob_meals_3: '3 సాధారణ భోజనాలు (అల్పాహారం, మధ్యాహ్నభోజనం, రాత్రిభోజనం)',
            ob_meals_4: '4 భోజనాలు (3 ముఖ్యమైనవి + 1 స్నాక్)',
            ob_meals_5: '5 చిన్న తరచుగా భోజనాలు',

            ob_step7_title: 'శారీరక పరిమితులు',
            ob_step7_sub: 'కీళ్ళ అసౌకర్యం లేదా గత గాయాల గురించి చెప్పండి, తద్వారా KANG వ్యాయామ సూచనలను అనుకూలీకరించగలదు.',
            ob_limitations_label: 'కీళ్ళు / శరీర అసౌకర్యం',
            ob_lim_none: 'ఏమీ లేదు (అన్ని కదలికలకు సిద్ధం)',
            ob_lim_knee: 'మోకాలి అసౌకర్యం / సున్నితమైన మోకాళ్ళు',
            ob_lim_back: 'వెన్నుభాగ అసౌకర్యం',
            ob_lim_shoulder: 'భుజం అడ్డంకి / కదలిక పరిమితి',
            ob_lim_wrist: 'మణికట్టు వత్తిడి',
            ob_injury_label: 'నిర్దిష్ట గాయం లేదా ఆరోగ్య గమనిక (ఐచ్ఛికం)',
            ob_injury_placeholder: 'ఉదా: 2023లో ACL శస్త్రచికిత్స, భారీ ఓవర్‌హెడ్ ప్రెస్ నివారించండి',

            ob_step8_title: 'షెడ్యూల్ & లక్ష్యం',
            ob_step8_sub: 'మీ వారపు వ్యాయామ పౌనఃపున్యం మరియు దీర్ఘకాలిక మైలురాయిని నిర్ణయించండి.',
            ob_workout_days_label: 'వారానికి వ్యాయామ రోజులు',
            ob_days_2: '2 రోజులు / వారం (తేలికగా)',
            ob_days_3: '3 రోజులు / వారం (ఫుల్ బాడీ స్ప్లిట్)',
            ob_days_4: '4 రోజులు / వారం (అపర్ / లోయర్ స్ప్లిట్)',
            ob_days_5: '5 రోజులు / వారం (పుష్ / పుల్ / లెగ్స్)',
            ob_days_6: '6 రోజులు / వారం (అడ్వాన్స్‌డ్ హై ఫ్రీక్వెన్సీ)',
            ob_target_weight_label: 'లక్ష్య బరువు (కిలో, ఐచ్ఛికం)',

            ob_step9_title: 'పరికరం & ట్రాకర్',
            ob_step9_sub: 'హృదయ స్పందన, అడుగులు మరియు నిద్రను సమకాలీకరించడానికి మీ స్మార్ట్‌వాచ్, ఫిట్‌నెస్ బ్యాండ్ లేదా స్మార్ట్‌ఫోన్ లింక్ చేయండి.',
            ob_wearable_label: 'మీరు ఫిట్‌నెస్ బ్యాండ్ లేదా స్మార్ట్‌వాచ్ ఉపయోగిస్తారా?',
            ob_wearable_none: 'పరికరం లేదు',
            ob_device_bt_title: 'లైవ్ పరికరం కనెక్షన్',
            ob_device_bt_sub: 'మీరు ప్రగతి నుండి ఎప్పుడైనా Bluetooth / QR కోడ్ ద్వారా జత చేయవచ్చు.',
            ob_device_ready: 'సిద్ధం',

            ob_step10_title: 'నోటిఫికేషన్లు',
            ob_step10_sub: 'మీరు ఏ నోటిఫికేషన్లు అందుకోవాలో నిర్ణయించండి. మీరు ఎప్పుడైనా యాప్ సెట్టింగ్‌లలో వీటిని మరియు ఇతర ఎంపికలను మార్చవచ్చు.',
            ob_notif_training: 'శిక్షణ నోటిఫికేషన్లు',
            ob_notif_weight: 'బరువు-ఇన్ నోటిఫికేషన్లు',
            ob_notif_water: 'నీరు తాగే నోటిఫికేషన్లు',

            // ── Dashboard ──────────────────────────────────────────────
            dash_sync: 'సమకాలీకరించు',
            dash_start_workout: 'వ్యాయామం ప్రారంభించండి',
            dash_todays_workout: 'నేటి వ్యాయామ ప్రణాళిక',
            dash_details: 'వివరాలు →',
            dash_nutrition_snap: 'పోషణ స్నాప్‌షాట్',
            dash_scanner: 'స్కానర్ →',
            dash_day_streak: 'రోజుల వరుస',
            dash_workouts: 'వ్యాయామాలు',
            dash_total_xp: 'మొత్తం XP',
            dash_daily_log: 'రోజువారీ లాగ్',
            dash_water: 'నీరు',
            dash_steps: 'అడుగులు',
            dash_sleep: 'నిద్ర',

            // ── Workout Session Modal ──────────────────────────────────
            session_live: 'లైవ్ సెషన్',
            session_form_guide: '2D అథ్లెటిక్ ఫారమ్ గైడ్',
            session_controlled: 'నియంత్రిత డెమో',
            session_pause: 'ఆపండి',
            session_resume: 'కొనసాగించండి',
            session_form_fix: 'ఫారమ్ సరిదిద్దండి',
            session_next: 'తదుపరి',
            session_swap: 'మార్చండి',
            session_finish_early: 'ముందుగా ముగించండి',
            session_workout_done: 'వ్యాయామం పూర్తైంది!',
            session_how_feel: 'ఎలా అనిపించింది?',
            session_too_easy: 'చాలా తేలిక',
            session_comfortable: 'సౌకర్యంగా',
            session_challenging: 'సవాలుగా',
            session_too_hard: 'చాలా కష్టం',

            // ── Workouts View ──────────────────────────────────────────
            workouts_title: 'వ్యాయామ విధానం',

            // ── Nutrition View ─────────────────────────────────────────
            nutrition_title: 'పోషణ ఇంజిన్',
            nutrition_sub: 'మాక్రోలను స్వయంచాలకంగా లెక్కించడానికి ఆహారాన్ని స్కాన్ చేయండి.',
            nutrition_snap: 'భోజనాన్ని స్నాప్ చేయండి',
            nutrition_today: 'నేటి తీసుకున్న ఆహారం',
            nutrition_calories: 'కేలరీలు',
            nutrition_protein: 'ప్రోటీన్',
            nutrition_carbs: 'కార్బ్‌లు',
            nutrition_fats: 'కొవ్వులు',
            nutrition_fiber: 'ఫైబర్',

            // ── Community View ─────────────────────────────────────────
            community_title: 'సమాజ హబ్',
            community_sub: 'సర్టిఫైడ్ న్యూట్రిషనిస్ట్‌లు & కోచ్‌లను కనుగొనండి, లేదా మీ స్వంత కంటెంట్ పంచుకోండి.',
            community_browse: 'కోచ్‌లను చూడండి',
            community_feed: 'సమాజ ఫీడ్',
            community_mycoach: 'నా కోచ్ ప్రొఫైల్',
            community_new_post: 'కొత్త పోస్ట్',
            community_become_coach: 'సమాజ కోచ్ అవ్వండి',
            community_save_coach: 'కోచ్ ప్రొఫైల్ సేవ్ చేయండి',
            community_hire_requests: 'మీకు వచ్చిన నియామక అభ్యర్థనలు',
            community_hire_req: 'నియమించుకోవడానికి అభ్యర్థన',
            community_share: 'కంటెంట్ పంచుకోండి',
            community_publish: 'ప్రచురించండి',

            // ── Progress View ──────────────────────────────────────────
            progress_title: 'పురోగతి & విశ్లేషణ',

            // ── AI Coach View ──────────────────────────────────────────
            kang_placeholder: 'మీ ఫిట్‌నెస్ గురించి KANG ని ఏదైనా అడగండి...',
            kang_send: 'పంపండి',
            kang_clear: 'చరిత్ర క్లియర్ చేయండి',
            kang_new_chat: 'కొత్త చాట్',

            // ── Neuro View ─────────────────────────────────────────────
            neuro_title: 'న్యూరో-అథ్లెటిక్ సన్నద్ధత',

            // ── Settings View ──────────────────────────────────────────
            settings_title: 'సెట్టింగ్‌లు',
            settings_connect_device: 'పరికరం కనెక్ట్ చేయండి',
            settings_connect_device_sub: 'స్మార్ట్‌వాచ్‌లు, ఫిట్‌నెస్ బ్యాండ్‌లు, స్మార్ట్‌ఫోన్‌లు',
            settings_connect_btn: 'కనెక్ట్ చేయండి',
            settings_alarms: 'స్మార్ట్ అలారంలు',
            settings_alarms_sub: 'హైడ్రేషన్ రిమైండర్లు',
            settings_language: 'భాష',
            settings_language_sub: 'మీ ఇష్టమైన ప్రదర్శన భాషను ఎంచుకోండి',
            settings_shortcuts: 'కీబోర్డ్ షార్ట్‌కట్‌లు',
            settings_shortcuts_sub: 'EVOLV కోసం అన్ని అందుబాటులో ఉన్న కీబోర్డ్ షార్ట్‌కట్‌లు',
            settings_sign_out: 'సైన్ అవుట్',
            settings_reset: 'డేటా రీసెట్ చేయండి',

            // ── Shortcuts Modal ────────────────────────────────────────
            sc_title: 'కీబోర్డ్ షార్ట్‌కట్‌లు',
            sc_sub: 'EVOLV లో తక్షణమే నావిగేట్ చేయండి మరియు చర్యలు అమలు చేయండి',
            sc_nav: 'నావిగేషన్',
            sc_actions: 'శీఘ్ర చర్యలు',
            sc_session: 'యాక్టివ్ సెషన్ సమయంలో',
            sc_footer: 'ఫారమ్ ఇన్‌పుట్‌లలో టైప్ చేస్తున్నప్పుడు షార్ట్‌కట్‌లు ఆగిపోతాయి.',
            sc_close: 'మూసివేయండి',
            sc_dashboard: 'డాష్‌బోర్డ్',
            sc_kang: 'KANG AI కోచ్',
            sc_neuro: 'న్యూరో సన్నద్ధత',
            sc_workouts: 'వ్యాయామాలు',
            sc_nutrition: 'పోషణ',
            sc_community: 'సమాజం',
            sc_progress: 'పురోగతి',
            sc_vibe: 'ది వైబ్',
            sc_settings: 'సెట్టింగ్‌లు',
            sc_start_workout: 'వ్యాయామం ప్రారంభించండి',
            sc_reaction: 'CNS రియాక్షన్ టెస్ట్ ప్రారంభించండి',
            sc_sync: 'స్మార్ట్‌వాచ్ సమకాలీకరించండి',
            sc_show_shortcuts: 'షార్ట్‌కట్ చీట్ షీట్ చూపించండి',
            sc_close_modal: 'యాక్టివ్ మోడల్ మూసివేయండి',
            sc_tap_react: 'టాప్ / రియాక్ట్ (రియాక్షన్ టెస్ట్)',
            sc_pause_resume: 'వ్యాయామం ఆపు / కొనసాగించు',
            sc_next_ex: 'తదుపరి వ్యాయామం',
            sc_form_fix: 'ఫారమ్ ఫిక్స్ విశ్లేషణ',

            // ── Scanner Modal ──────────────────────────────────────────
            scanner_cancel: 'రద్దు చేయండి',
            scanner_capture: 'క్యాప్చర్ & విశ్లేషించండి',
            scanner_desc: 'ఆహారాన్ని ఫ్రేమ్ లోపల అమర్చండి.',

            // ── Wearable Modal ─────────────────────────────────────────
            wearable_title: 'మీ పరికరాన్ని కనెక్ట్ చేయండి',
            wearable_sub: 'అడుగులు, హృదయ స్పందన, నిద్ర మరియు మరిన్ని సమకాలీకరించడానికి ఏదైనా Bluetooth వేర్‌బుల్ లేదా స్మార్ట్‌ఫోన్‌ను జత చేయండి.',
            wearable_bluetooth: 'బ్లూటూత్',
            wearable_qr: 'QR జత కట్టడం',
            wearable_select: 'మోడల్ ఎంచుకోండి',
            wearable_scan_btn: 'స్కాన్ & పరికరం కనెక్ట్ చేయండి',
            wearable_regen_qr: 'QR కోడ్ పునరుత్పత్తి చేయండి',
            wearable_save: 'నేటి డేటా సేవ్ చేయండి',

            // ── Form Corrector ─────────────────────────────────────────
            fc_live: 'లైవ్ విశ్లేషణ',
            fc_exercise: 'వ్యాయామం',
            fc_stage: 'దశ',
            fc_posture: 'భంగిమ',
            fc_reps: 'రెప్స్',
            fc_good_posture: 'మంచి భంగిమ',
            fc_reset: 'రీసెట్',
            fc_ask_kang: 'KANG నుండి అభిప్రాయం అడగండి',
        }
    },

    /**
     * Get a translated string by key. Falls back to English if not found.
     */
    t(key) {
        const lang = this.translations[this.currentLang] || this.translations['en'];
        return lang[key] || this.translations['en'][key] || key;
    },

    /**
     * Set the active language and apply translations to the page.
     */
    setLang(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('evolv_lang', lang);
        this.applyTranslations();
        // Refresh dynamic nav text
        if (window.UI && typeof window.UI.updateNav === 'function') {
            window.UI.updateNav();
        }
        // Update language switcher button states
        this._updateLangButtons();
    },

    /**
     * Apply translations to all DOM elements with data-i18n attributes.
     */
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr');
            const translation = this.t(key);
            if (attr) {
                el.setAttribute(attr, translation);
            } else {
                el.textContent = translation;
            }
        });
        // Also update page title
        document.title = this.t('app_title');
    },

    /**
     * Update the active state of language picker buttons.
     */
    _updateLangButtons() {
        ['en', 'hi', 'te'].forEach(lang => {
            const btn = document.getElementById(`lang-btn-${lang}`);
            if (!btn) return;
            if (lang === this.currentLang) {
                btn.classList.add('bg-primary', 'text-dark');
                btn.classList.remove('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
            } else {
                btn.classList.remove('bg-primary', 'text-dark');
                btn.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
            }
        });
    },

    /**
     * Initialize i18n: load saved language and apply translations.
     */
    init() {
        const saved = localStorage.getItem('evolv_lang') || 'en';
        this.currentLang = saved;
        this.applyTranslations();
        this._updateLangButtons();
    }
};

window.I18n = I18n;
document.addEventListener('DOMContentLoaded', () => I18n.init());

