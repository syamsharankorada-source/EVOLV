const Workouts = {
    currentWorkoutPlan: null,
    currentExerciseIndex: 0,
    workoutTimer: null,
    workoutSeconds: 0,
    isTimerRunning: false,

    async load() {
        try {
            const res = await APIService.getWorkoutPlan();
            if (!res.success || !res.data) {
                console.error("Workout plan fetch failed");
                return;
            }
            this.currentWorkoutPlan = res.data;
            
            const container = document.getElementById('full-workout-list');
            if (!container) return;

            let html = '';
            const weekly = this.currentWorkoutPlan.weekly_plan || [];
            
            weekly.forEach(dayPlan => {
                // "Today" gets the inverted treatment (white card, dark text) so it
                // pops against the black cards used for every other day — opposite
                // color combination, not just a faint tint that blends into the page.
                const bgClass = dayPlan.is_today ? 'bg-primary border-primary' : 'bg-surface border-gray-800';
                const dayTitleClass = dayPlan.is_today ? 'text-dark' : 'text-white';
                const textClass = dayPlan.is_today ? 'text-dark/60' : 'text-gray-400';
                const badge = dayPlan.is_today ? '<span class="ml-2 text-[10px] bg-dark text-primary px-2.5 py-1 rounded-full uppercase tracking-wider font-black">Today\'s Active Workout</span>' : '';

                html += `
                    <div class="p-6 sm:p-8 rounded-3xl border ${bgClass} mb-6">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                            <div>
                                <h3 class="font-black text-2xl ${dayTitleClass} flex items-center flex-wrap">${dayPlan.day} ${badge}</h3>
                                <p class="text-xs font-bold ${textClass} uppercase tracking-widest mt-1">Focus: ${dayPlan.focus}</p>
                            </div>
                            ${dayPlan.is_today ? '<button onclick="Workouts.startActiveWorkout()" class="px-5 py-2.5 bg-dark hover:bg-black text-primary font-black text-xs rounded-xl"><i class="fas fa-play mr-1.5"></i> Launch Today\'s Session</button>' : ''}
                        </div>
                `;
                
                if(!dayPlan.exercises || dayPlan.exercises.length === 0) {
                    html += `<div class="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-center"><p class="text-gray-400 italic font-medium"><i class="fas fa-bed text-primary mr-2"></i> Rest & Recovery Day - Let your muscles rebuild.</p></div>`;
                } else {
                    html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">`;
                    dayPlan.exercises.forEach(ex => {
                        html += `
                            <div class="evolv-card bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-inner flex flex-col justify-between" data-tip="${ex.sets || 3} sets × ${ex.reps || '10'}, ${ex.rest_seconds || 60}s rest">
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-[10px] font-black px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-primary uppercase tracking-wider">${ex.target_muscle || 'Full Body'}</span>
                                        <span class="text-[10px] text-gray-400 uppercase font-bold"><i class="fas fa-dumbbell mr-1"></i>${ex.equipment || 'Bodyweight'}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-3 my-2">
                                        <div class="flex-1 min-w-0 pr-1">
                                            <h4 class="font-black text-lg text-white leading-snug">${ex.name}</h4>
                                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1"><i class="fas fa-play text-[8px] text-primary mr-1"></i>Reference Form</p>
                                        </div>
                                        <div class="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl border border-gray-600/30 overflow-hidden flex-shrink-0 relative flex items-center justify-center p-1 shadow-lg" title="${ex.name} Animated Form Guide">
                                            <canvas class="hollowman-canvas" width="180" height="180" style="width:100%; height:100%; display:block;" data-exercise="${ex.name}"></canvas>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center text-xs font-bold text-gray-300">
                                    <span><i class="fas fa-redo text-primary mr-1"></i>${ex.sets || 3} Sets × ${ex.reps || '10'}</span>
                                    <span><i class="fas fa-stopwatch text-secondary mr-1"></i>${ex.rest_seconds || 60}s Rest</span>
                                </div>
                            </div>`;
                    });
                    html += `</div>`;
                }
                html += `</div>`;
            });
            container.innerHTML = html;
            if (window.HollowMan) {
                HollowMan.init();
                setTimeout(() => HollowMan.init(), 100);
            }
        } catch (e) {
            console.error("Failed to load workouts:", e);
        }
    },
    
    startActiveWorkout() {
        if(!this.currentWorkoutPlan || !this.currentWorkoutPlan.exercises || !this.currentWorkoutPlan.exercises.length) {
            UI.showToast('Today is a rest day or no active routine found!', 'info');
            return;
        }
        this.currentExerciseIndex = 0;
        document.getElementById('workout-session-modal').classList.remove('hidden');
        document.getElementById('session-workout-title').innerText = this.currentWorkoutPlan.title;
        this.updateSessionUI();
        if (window.HollowMan) {
            setTimeout(() => {
                const ex = this.currentWorkoutPlan.exercises[this.currentExerciseIndex];
                if (ex) HollowMan.updateSessionExercise('session-hollowman-canvas', ex.name);
            }, 100);
        }
    },
    
    updateSessionUI() {
        const ex = this.currentWorkoutPlan.exercises[this.currentExerciseIndex];
        const total = this.currentWorkoutPlan.exercises.length;
        document.getElementById('session-exercise-num').innerText = `Movement ${this.currentExerciseIndex + 1} of ${total}`;
        document.getElementById('session-ex-name').innerText = ex.name;
        document.getElementById('session-ex-target').innerText = `Target: ${ex.target_muscle} • Equipment: ${ex.equipment}`;
        document.getElementById('session-ex-reps').innerText = `${ex.sets} Sets of ${ex.reps} (${ex.rest_seconds}s Rest)`;
        document.getElementById('session-progress-bar').style.width = `${((this.currentExerciseIndex) / total) * 100}%`;
        if (window.HollowMan) HollowMan.updateSessionExercise('session-hollowman-canvas', ex.name);
        
        this.workoutSeconds = 0;
        this.isTimerRunning = true;
        clearInterval(this.workoutTimer);
        this.workoutTimer = setInterval(() => {
            if(this.isTimerRunning) {
                this.workoutSeconds++;
                const m = Math.floor(this.workoutSeconds / 60).toString().padStart(2, '0');
                const s = (this.workoutSeconds % 60).toString().padStart(2, '0');
                const timerEl = document.getElementById('session-timer-display');
                if(timerEl) timerEl.innerText = `${m}:${s}`;
            }
        }, 1000);
    },
    
    toggleTimer() {
        this.isTimerRunning = !this.isTimerRunning;
        const btn = document.getElementById('session-timer-toggle-btn');
        if(btn) btn.innerHTML = this.isTimerRunning ? `<i class="fas fa-pause mr-1"></i> Pause` : `<i class="fas fa-play mr-1"></i> Resume`;
    },

    // Called when the person jumps into the Live Form Check camera from mid-workout,
    // so the rest/exercise timer doesn't keep counting behind their back.
    pauseForFormCheck() {
        this.isTimerRunning = false;
        const btn = document.getElementById('session-timer-toggle-btn');
        if(btn) btn.innerHTML = `<i class="fas fa-play mr-1"></i> Resume`;
    },
    
    nextExercise() {
        if(!this.currentWorkoutPlan) return;
        this.currentExerciseIndex++;
        if(this.currentExerciseIndex >= this.currentWorkoutPlan.exercises.length) {
            this.finishEarly();
        } else {
            this.updateSessionUI();
        }
    },
    
    replaceCurrentExercise() {
        UI.showToast('AI swapped exercise for a safe alternative.', 'info');
    },
    
    finishEarly() {
        clearInterval(this.workoutTimer);
        document.getElementById('workout-session-modal').classList.add('hidden');
        document.getElementById('workout-feedback-modal').classList.remove('hidden');
    },
    
    async submitFeedback(feedback) {
        document.getElementById('workout-feedback-modal').classList.add('hidden');
        try {
            await APIService.logWorkout({ title: this.currentWorkoutPlan.title, duration_minutes: 30, feedback: feedback });
            if(typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            UI.showToast('Workout Logged + XP Earned!', 'success');
            Dashboard.load();
        } catch (e) { 
            UI.showToast('Failed to log workout', 'error'); 
        }
    }
};
window.Workouts = Workouts;