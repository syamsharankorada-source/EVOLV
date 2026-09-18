const app = {
    user: null,
    currentView: 'landing',
    onboardingStep: 1,

    async init() {
        try {
            const res = await APIService.getMe();
            if (res && res.success && res.data && res.data.name) {
                this.user = res.data;
                if (this.user.is_onboarded) {
                    UI.navigate('dashboard');
                } else {
                    this.startOnboarding();
                }
            } else {
                this.user = null;
                UI.navigate('landing');
            }
        } catch (e) {
            this.user = null;
            UI.navigate('landing');
        }
        UI.updateNav();
        this.restoreSettings();
        this.handleMobilePairRedirect();
    },

    /** Landed here from a QR "connect via phone" scan (see wellness/views.py
     * mobile_connect_view) — either open straight to Bluetooth pairing on
     * success, or surface why it didn't work. */
    handleMobilePairRedirect() {
        const params = new URLSearchParams(window.location.search);
        const openWearable = params.get('openWearable');
        const pairError = params.get('pairError');

        if (openWearable && this.user) {
            Wearable.openModal();
            Wearable.switchTab('bluetooth');
            UI.showToast(`Connected as ${this.user.name}. Scan for your watch below.`, 'success');
        } else if (pairError === 'expired') {
            UI.showToast('That pairing link expired (15 min limit) — generate a new QR code from the app.', 'info');
        } else if (pairError === 'invalid') {
            UI.showToast('That pairing link is invalid — generate a new QR code from the app.', 'info');
        }

        if (openWearable || pairError) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    startOnboarding() {
        this.onboardingStep = 1;
        this.updateOnboardingUI();
        UI.navigate('onboarding');
    },

    onboardingNext() {
        if (this.onboardingStep < 10) { 
            this.onboardingStep++; 
            this.updateOnboardingUI(); 
        }
    },

    onboardingPrev() {
        if (this.onboardingStep > 1) { 
            this.onboardingStep--; 
            this.updateOnboardingUI(); 
        }
    },

    updateOnboardingUI() {
        document.querySelectorAll('.ob-step').forEach(el => el.classList.add('hidden'));
        const currentStepEl = document.getElementById(`ob-step-${this.onboardingStep}`);
        if (currentStepEl) currentStepEl.classList.remove('hidden');
        
        const progressBar = document.getElementById('onboarding-progress-bar');
        const indicator = document.getElementById('onboarding-step-indicator');
        if (progressBar) progressBar.style.width = `${(this.onboardingStep / 10) * 100}%`;
        if (indicator) indicator.innerText = `Step ${this.onboardingStep} of 10`;

        const prevBtn = document.getElementById('ob-prev-btn');
        const nextBtn = document.getElementById('ob-next-btn');
        const submitBtn = document.getElementById('ob-submit-btn');

        if (prevBtn) prevBtn.classList.toggle('hidden', this.onboardingStep === 1);
        
        if (this.onboardingStep === 10) {
            if (nextBtn) nextBtn.classList.add('hidden');
            if (submitBtn) submitBtn.classList.remove('hidden');
        } else {
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async completeOnboarding() {
        const goalCheckboxes = Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(el => el.value);
        const equipCheckboxes = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(el => el.value);
        const notifCheckboxes = Array.from(document.querySelectorAll('input[name="notifications"]:checked')).map(el => el.value);
        
        const el = (id) => document.getElementById(id);
        const val = (id, fallback = '') => { const e = el(id); return e ? e.value : fallback; };

        // Parse age group to approximate age number if custom
        let ageVal = val('ob-age');
        const ageGroupVal = val('ob-age-group');
        if (!ageVal && ageGroupVal) {
            if (ageGroupVal === 'teen') ageVal = 18;
            else if (ageGroupVal === 'twenties') ageVal = 25;
            else if (ageGroupVal === 'thirties') ageVal = 35;
            else if (ageGroupVal === 'forties') ageVal = 45;
            else ageVal = 55;
        }

        const payload = {
            phone: val('ob-phone', '9999999999'),
            name: val('ob-name', 'Athlete'),
            age: ageVal || 25,
            age_group: ageGroupVal,
            gender: val('ob-gender', 'male'),
            height_cm: val('ob-height', 172),
            weight_kg: val('ob-weight', 70),
            fitness_level: val('ob-fitness-level', 'beginner'),
            activity_level: val('ob-activity-level', 'moderate'),
            available_equipment: equipCheckboxes.length ? equipCheckboxes : ['bodyweight'],
            preferred_duration_minutes: val('ob-duration') || 30,
            preferred_location: val('ob-location', 'home'),
            primary_goal: goalCheckboxes.length ? goalCheckboxes : ['general_fitness'],
            sleep_hours_avg: val('ob-sleep', '7_8'),
            sitting_time: val('ob-sitting-time', 'moderate'),
            water_target_ml: val('ob-water-target', 2500),
            diet_preference: val('ob-diet', 'non_vegetarian'),
            allergies: val('ob-allergies', ''),
            limitations: val('ob-limitations', 'none'),
            injuries: val('ob-injury', ''),
            workout_days_per_week: val('ob-workout-days', 3),
            target_weight_kg: val('ob-target-weight') || null,
            wearable_device: val('ob-wearable', 'none'),
            meals_per_day: val('ob-meals-per-day', 3),
            notifications: {
                training: notifCheckboxes.includes('training'),
                weight_in: notifCheckboxes.includes('weight_in'),
                watering: notifCheckboxes.includes('watering')
            }
        };

        try {
            await APIService.onboard(payload);
            this.user = this.user || {};
            this.user.is_onboarded = true;
            this.user.name = payload.name;
            this.user.is_guest = false;
            UI.showToast('Profile created successfully! Generating plans...', 'success');
            if(typeof confetti !== 'undefined') confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            UI.navigate('dashboard');
        } catch (e) {
            UI.showToast(e.message || 'Error saving profile', 'error');
        }
    },     
    /** Settings → Smart Alarms toggle. Persists the choice for this browser
     * so the switch comes back in the right position next visit. */
    toggleAlarms(enabled) {
        try { localStorage.setItem('evolv_alarms_enabled', enabled ? '1' : '0'); } catch (e) {}
        UI.showToast(enabled ? 'Smart alarms on — hydration reminders enabled' : 'Smart alarms off', enabled ? 'success' : 'info');
    },

    /** Puts the Settings toggles back into their saved state on page load. */
    restoreSettings() {
        const toggle = document.getElementById('alarm-toggle');
        if (!toggle) return;
        let saved = null;
        try { saved = localStorage.getItem('evolv_alarms_enabled'); } catch (e) {}
        toggle.checked = (saved === null) ? true : saved === '1';
    },

    /** Settings → Reset Data. Clears the EVOLV state stored in this browser
     * (paired wearable, saved toggles) and signs the user out. The display
     * language is deliberately kept — it's a preference, not data. */
    async resetAllData() {
        const ok = window.confirm("Reset EVOLV data stored on this device? This unpairs your wearable, clears saved settings, and signs you out. Your account itself isn't deleted.");
        if (!ok) return;

        try {
            if (typeof Wearable !== 'undefined' && Wearable.connectedDeviceName) Wearable.disconnect();
        } catch (e) { /* nothing paired — nothing to tear down */ }

        try {
            Object.keys(localStorage)
                .filter(k => k.indexOf('evolv_') === 0 && k !== 'evolv_lang')
                .forEach(k => localStorage.removeItem(k));
        } catch (e) { /* storage blocked — skip */ }

        UI.showToast('Local EVOLV data cleared', 'success');
        await Auth.logout();
    },

    // HTML Wrapper Mappings for easy access from inline onClick events
    openAuth: () => Auth.open(),
    closeAuth: () => Auth.close(),
    sendOTP: () => Auth.sendOTP(),
    verifyOTP: () => Auth.verifyOTP(),
    guestLogin: () => Auth.guestLogin(),
    logout: () => Auth.logout(),
    navigate: (view) => UI.navigate(view),
    toggleMobileMenu: () => UI.toggleMobileMenu(),
    openScanner: (type) => UI.openScanner(type),
    processScan: () => UI.processScan(),
    handleFoodPhotoUpload: (e) => UI.handleFoodPhotoUpload(e),
    openWearableModal: () => (typeof Wearable !== 'undefined' ? Wearable.openModal() : Wellness.syncSmartwatch()),
    closeWearableModal: () => (typeof Wearable !== 'undefined' && Wearable.closeModal()),
    scanBluetoothWearable: () => (typeof Wearable !== 'undefined' && Wearable.scanBluetooth()),
    saveManualWearableSync: () => (typeof Wearable !== 'undefined' && Wearable.saveManualSync()),
    confirmQRPairing: () => (typeof Wearable !== 'undefined' && Wearable.confirmQRPairing()),
    startActiveWorkout: () => Workouts.startActiveWorkout(),
    toggleWorkoutTimer: () => Workouts.toggleTimer(),
    nextExercise: () => Workouts.nextExercise(),
    replaceCurrentExercise: () => Workouts.replaceCurrentExercise(),
    finishWorkoutEarly: () => Workouts.finishEarly(),
    submitDifficultyFeedback: (f) => Workouts.submitFeedback(f),
    closeWorkoutSession: () => { clearInterval(Workouts.workoutTimer); document.getElementById('workout-session-modal').classList.add('hidden'); },
    openFormCorrector: () => {
        // Coming from an active workout session: pause its rest timer so it
        // doesn't keep ticking in the background while the camera is open,
        // and try to jump straight to the exercise the person is doing.
        if (typeof Workouts !== 'undefined' && Workouts.currentWorkoutPlan) {
            Workouts.pauseForFormCheck();
            const ex = Workouts.currentWorkoutPlan.exercises && Workouts.currentWorkoutPlan.exercises[Workouts.currentExerciseIndex];
            FormCorrector.open(ex ? ex.name : null);
        } else {
            FormCorrector.open();
        }
    },
    closeFormCorrector: () => FormCorrector.close(),
    syncSmartwatch: () => Wellness.syncSmartwatch(),
    adjustSleep: (a) => Wellness.adjustSleep(a),
    sendChatMessage: () => Kang.send(),
    sendQuickPrompt: (m) => Kang.quickPrompt(m),
    clearChatHistory: () => Kang.clearHistory(),
    newKangChat: () => Kang.newChat(),
    toggleKangSessions: () => Kang.toggleSessionsDropdown(),
    startVoiceRecognition: () => Kang.startVoice(),
    openKangFilePicker: () => Kang.openFilePicker(),
    handleKangFileAttach: (el) => Kang.handleFileAttach(el),
    setKangVoiceLang: (lang) => Kang.setVoiceLanguage(lang),
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());