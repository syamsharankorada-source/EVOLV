/**
 * Neuro-Athletic Readiness System
 * Client-side module for NeuroReadiness dashboard, history, and Reaction Test.
 */

// Helper functions for stats
const Stats = {
    mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
    median: (arr) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    stdDev: (arr) => {
        if (arr.length < 2) return 0;
        const m = Stats.mean(arr);
        const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1); // Sample std dev
        return Math.sqrt(variance);
    }
};

const NeuroReadiness = {
    currentData: null,
    historyChart: null,
    componentChart: null,
    recentReactionData: null,

    load: async function() {
        console.log("NeuroReadiness module loaded");
        try {
            // Check today's readiness
            const res = await APIService.request('/api/neuro/today/');
            if (res.success && res.data && Object.keys(res.data).length > 0) {
                this.currentData = res.data;
                this.renderDashboard(res.data);
            } else {
                this.renderCheckInForm();
            }
            this.loadHistory(14);
        } catch (error) {
            console.error("Error loading neuro readiness:", error);
            UI.showToast("Failed to load readiness data", "error");
            this.renderCheckInForm();
        }
    },

    renderDashboard: function(data) {
        const container = document.getElementById('neuro-dashboard-content');
        if (!container) return;

        let colorClass = 'text-white';
        let circleBorderClass = 'border-gray-800';
        let badgeBgClass = 'bg-gray-800 text-white';
        switch (data.category) {
            case 'PERFORMANCE': 
                colorClass = 'text-emerald-400'; 
                circleBorderClass = 'border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.15)]';
                badgeBgClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                break;
            case 'HIGH': 
                colorClass = 'text-sky-400'; 
                circleBorderClass = 'border-sky-500/40 shadow-[0_0_25px_rgba(56,189,248,0.15)]';
                badgeBgClass = 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
                break;
            case 'MODERATE': 
                colorClass = 'text-amber-400'; 
                circleBorderClass = 'border-amber-500/40 shadow-[0_0_25px_rgba(251,191,36,0.15)]';
                badgeBgClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                break;
            case 'REDUCED': 
                colorClass = 'text-orange-400'; 
                circleBorderClass = 'border-orange-500/40 shadow-[0_0_25px_rgba(251,146,60,0.15)]';
                badgeBgClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
                break;
            case 'RECOVERY': 
                colorClass = 'text-rose-400'; 
                circleBorderClass = 'border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]';
                badgeBgClass = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                break;
        }

        const componentTips = {
            'Sleep': 'Quality & duration score. Restores neuromuscular coordination and hormonal balance.',
            'HRV': 'Heart Rate Variability. High score means autonomic nervous system is fresh and parasympathetic-dominant.',
            'Resting HR': 'Resting pulse. Lower/stable pulse scores high; elevated pulse indicates systemic fatigue.',
            'Reaction': 'Visual reaction test score. Directly reflects central nervous system processing speed and consistency.',
            'Subjective': 'Self-reported energy, focus, and muscle soreness ratings combined.',
            'Training Load': 'Acute workout volume and intensity over recent days compared to your personal baseline.'
        };

        const compHTML = data.components ? Object.entries(data.components).map(([key, val]) => {
            const scoreVal = Math.round(val || 0);
            let barColor = 'bg-emerald-400';
            if (scoreVal < 60) barColor = 'bg-rose-400';
            else if (scoreVal < 75) barColor = 'bg-amber-400';
            else if (scoreVal < 85) barColor = 'bg-sky-400';

            return `
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>${key}</span>
                <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-gray-400 border border-gray-700 cursor-pointer" data-tip="${componentTips[key] || 'Component score out of 100'}">i</span>
              </span>
              <span class="text-sm font-black text-white">${scoreVal}<span class="text-[10px] text-gray-500 font-normal">/100</span></span>
            </div>
            <div class="w-full bg-gray-900 rounded-full h-2.5 mb-4 border border-gray-800 overflow-hidden">
              <div class="h-full rounded-full ${barColor}" style="width: ${Math.max(0, Math.min(100, scoreVal))}%;"></div>
            </div>
            `;
        }).join('') : '';

        const limitingHTML = (data.limiting_factors && data.limiting_factors.length > 0) ? `
            <div class="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Limiting Factors</span>
                    <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-rose-300 border border-rose-800 cursor-pointer" data-tip="Metrics scoring below 70 that pulled today's readiness down.">i</span>
                </h4>
                <ul class="text-xs text-gray-200 space-y-1 list-disc pl-4">
                    ${data.limiting_factors.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        const positiveHTML = (data.positive_factors && data.positive_factors.length > 0) ? `
            <div class="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Positive Factors</span>
                    <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-emerald-300 border border-emerald-800 cursor-pointer" data-tip="Metrics scoring 85 or above indicating high recovery.">i</span>
                </h4>
                <ul class="text-xs text-gray-200 space-y-1 list-disc pl-4">
                    ${data.positive_factors.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="bg-surface border border-gray-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl">
                <div class="text-center mb-8 border-b border-gray-800/80 pb-6">
                    <div class="inline-flex items-center justify-center w-36 h-36 rounded-full border-4 ${circleBorderClass} mb-4 relative bg-dark/70" data-tip="Daily Neuro-Athletic Readiness score from 0 to 100.">
                        <span class="text-6xl font-black ${colorClass}">${Math.round(data.score)}</span>
                        <span class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer">i</span>
                    </div>
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <span class="text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${badgeBgClass}">${data.category}</span>
                        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700 cursor-pointer" data-tip="Performance category dictates your training volume and intensity recommendation for the day.">i</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                        <span>Confidence: <strong class="text-white">${data.baseline_confidence || (Math.round(data.confidence * 100) + '%')}</strong></span>
                        <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-gray-400 border border-gray-700 cursor-pointer" data-tip="Confidence is based on how many days of personal baseline data we have. More days logged = higher confidence.">i</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="font-black text-white mb-4 uppercase tracking-wider text-sm flex items-center gap-1.5">
                            <span>Component Breakdown</span>
                            <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-gray-400 border border-gray-700 cursor-pointer" data-tip="Every component is scored against your personal historical baseline.">i</span>
                        </h3>
                        ${compHTML}
                    </div>
                    <div>
                        <h3 class="font-black text-white mb-4 uppercase tracking-wider text-sm">Readiness Analysis</h3>
                        ${limitingHTML}
                        ${positiveHTML}
                        
                        <div class="bg-dark/70 p-5 rounded-2xl mt-4 border border-gray-800">
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>Today's Recommendation</span>
                                <span class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold bg-dark text-gray-400 border border-gray-700 cursor-pointer" data-tip="Actionable athletic training advice based on your current physical & neurological readiness score.">i</span>
                            </h4>
                            <p class="text-xs sm:text-sm text-white font-medium leading-relaxed">${data.recommendation || 'Proceed with normal training.'}</p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center border-t border-gray-800/80 pt-6">
                    <button onclick="NeuroReadiness.renderCheckInForm()" class="px-6 py-3.5 bg-gray-900 border border-gray-700 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2">
                        <i class="fas fa-redo text-gray-400"></i> New Check-in
                    </button>
                    <button onclick="ReactionTest.start()" class="px-6 py-3.5 bg-primary text-dark font-black rounded-xl text-xs sm:text-sm hover:bg-primary-dark transition flex items-center justify-center gap-2">
                        <i class="fas fa-bolt"></i> Start Reaction Test
                    </button>
                </div>
            </div>
        `;
    },

    renderCheckInForm: function() {
        const container = document.getElementById('neuro-dashboard-content');
        if (!container) return;

        this.recentReactionData = null; // Reset any previous reaction data

        container.innerHTML = `
            <div class="bg-surface border border-gray-800 rounded-3xl p-6 mb-6 shadow-xl">
                <div class="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                    <h2 class="font-black text-white text-xl uppercase tracking-widest flex items-center gap-2">
                        Daily Readiness Check-in
                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/40 cursor-pointer" data-tip="A daily assessment measuring your physical recovery, nervous system readiness, and training tolerance.">i</span>
                    </h2>
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Estimated in ~60s</span>
                </div>
                <form id="neuro-checkin-form" onsubmit="NeuroReadiness.submitCheckIn(event)">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- Sleep -->
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>Sleep Hours</span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer" data-tip="Total duration of sleep last night. 7-9 hours is ideal for neuromuscular and cellular recovery.">i</span>
                            </label>
                            <input type="number" id="nr-sleep-hours" step="0.5" min="0" max="24" required class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition">
                        </div>
                        
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>Sleep Quality (1-5)</span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer" data-tip="How restful was your sleep? Accounts for awakenings, deep sleep, and feeling refreshed on waking.">i</span>
                            </label>
                            <select id="nr-sleep-quality" required class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition appearance-none">
                                <option value="5">5 - Excellent (Deep, uninterrupted)</option>
                                <option value="4">4 - Good</option>
                                <option value="3" selected>3 - Fair (Average)</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible (Restless, waking up often)</option>
                            </select>
                        </div>

                        <!-- Physiology -->
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>HRV (ms) <span class="text-xs font-normal text-gray-500 normal-case">(Optional)</span></span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer" data-tip="Heart Rate Variability in milliseconds. Higher values typically signal parasympathetic recovery, while sudden drops indicate physiological stress.">i</span>
                            </label>
                            <input type="number" id="nr-hrv" placeholder="Leave blank if unknown" class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition">
                        </div>
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>Resting HR (bpm) <span class="text-xs font-normal text-gray-500 normal-case">(Optional)</span></span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer" data-tip="Resting Heart Rate in beats per minute. An elevated resting pulse (+5-10 bpm above baseline) indicates incomplete cardiovascular or systemic recovery.">i</span>
                            </label>
                            <input type="number" id="nr-rhr" placeholder="Leave blank if unknown" class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition">
                        </div>
                    </div>

                    <!-- Subjective Sliders -->
                    <div class="mb-8 space-y-6 bg-dark/30 p-5 rounded-2xl border border-gray-800/50">
                        <div>
                            <label class="flex justify-between items-center text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                                <span class="flex items-center gap-1.5">
                                    <span>Energy Level (1-10)</span>
                                    <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="Subjective vitality and physical drive. 10 is fully energized, 1 is completely drained.">i</span>
                                </span>
                                <span id="nr-energy-val" class="text-white font-black bg-gray-800 px-2 py-0.5 rounded">5</span>
                            </label>
                            <input type="range" id="nr-energy" min="1" max="10" value="5" oninput="document.getElementById('nr-energy-val').innerText=this.value" class="w-full accent-primary">
                        </div>
                        <div>
                            <label class="flex justify-between items-center text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                                <span class="flex items-center gap-1.5">
                                    <span>Mental Focus (1-10)</span>
                                    <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="Cognitive alertness, sharpness, and concentration. High mental focus indicates CNS responsiveness.">i</span>
                                </span>
                                <span id="nr-focus-val" class="text-white font-black bg-gray-800 px-2 py-0.5 rounded">5</span>
                            </label>
                            <input type="range" id="nr-focus" min="1" max="10" value="5" oninput="document.getElementById('nr-focus-val').innerText=this.value" class="w-full accent-primary">
                        </div>
                        <div>
                            <label class="flex justify-between items-center text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
                                <span class="flex items-center gap-1.5">
                                    <span>Muscle Fatigue (1=Exhausted, 10=Fresh)</span>
                                    <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="Perceived soreness or muscular stiffness. 1 means sore and heavy, 10 means light, springy, and fully rested.">i</span>
                                </span>
                                <span id="nr-fatigue-val" class="text-white font-black bg-gray-800 px-2 py-0.5 rounded">5</span>
                            </label>
                            <input type="range" id="nr-fatigue" min="1" max="10" value="5" oninput="document.getElementById('nr-fatigue-val').innerText=this.value" class="w-full accent-primary">
                        </div>
                    </div>

                    <!-- Recent Workout -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>Recent Workout Duration (min) <span class="text-xs font-normal text-gray-500 normal-case">(Optional)</span></span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="Time spent training in your last workout session. Used with RPE to calculate acute training load.">i</span>
                            </label>
                            <input type="number" id="nr-workout-dur" class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition">
                        </div>
                        <div>
                            <label class="flex items-center gap-1.5 text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                                <span>Recent Workout RPE (1-10) <span class="text-xs font-normal text-gray-500 normal-case">(Optional)</span></span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="Rate of Perceived Exertion for your last session (1=Very easy, 10=Maximal all-out effort). Multiplied by duration for workout load.">i</span>
                            </label>
                            <input type="number" id="nr-workout-rpe" min="1" max="10" class="w-full bg-dark/80 border border-blue-900/40 text-white rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition">
                        </div>
                    </div>

                    <!-- Reaction Test Note -->
                    <div id="nr-reaction-status" class="bg-dark/60 p-5 rounded-2xl border border-gray-700 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <div class="text-sm font-bold text-white mb-1 uppercase tracking-wide flex items-center gap-1.5">
                                <span>CNS Reaction Test</span>
                                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer normal-case" data-tip="A 30-second simple visual reaction test measuring neuromuscular processing speed and consistency in milliseconds.">i</span>
                            </div>
                            <div class="text-sm text-gray-400">Status: <span class="font-bold text-orange-400">Not completed</span></div>
                        </div>
                        <button type="button" onclick="ReactionTest.start()" class="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-xl text-sm font-bold transition whitespace-nowrap">
                            Take 30s Test
                        </button>
                    </div>

                    <div class="flex justify-end pt-4 border-t border-gray-800">
                        <button type="submit" class="px-8 py-4 bg-primary text-dark font-black rounded-xl text-lg hover:opacity-90 transition shadow-lg shadow-primary/20 w-full sm:w-auto flex items-center justify-center gap-2">
                            <span>Calculate Readiness</span>
                            <span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black bg-dark text-primary cursor-pointer" data-tip="Combines your sleep, HRV, reaction, training load, and subjective state against your personal historical baseline.">i</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    submitCheckIn: async function(e) {
        if (e) e.preventDefault();
        
        const payload = {
            sleep_hours: parseFloat(document.getElementById('nr-sleep-hours').value),
            sleep_quality: parseInt(document.getElementById('nr-sleep-quality').value),
            energy_level: parseInt(document.getElementById('nr-energy').value),
            mental_focus: parseInt(document.getElementById('nr-focus').value),
            muscle_fatigue: parseInt(document.getElementById('nr-fatigue').value),
        };

        const hrv = document.getElementById('nr-hrv').value;
        if (hrv) payload.hrv = parseFloat(hrv);

        const rhr = document.getElementById('nr-rhr').value;
        if (rhr) payload.resting_hr = parseInt(rhr);

        const dur = document.getElementById('nr-workout-dur').value;
        if (dur) payload.recent_workout_duration = parseInt(dur);

        const rpe = document.getElementById('nr-workout-rpe').value;
        if (rpe) payload.recent_workout_rpe = parseInt(rpe);

        if (this.recentReactionData) {
            payload.reaction_time = this.recentReactionData.median;
            payload.reaction_variability = this.recentReactionData.stdDev;
        }

        try {
            const res = await APIService.request('/api/neuro/check-in/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.success) {
                UI.showToast("Readiness calculated!", "success");
                this.currentData = res.data;
                this.renderDashboard(res.data);
                this.loadHistory();
            } else {
                UI.showToast(res.message || "Error submitting check-in", "error");
            }
        } catch (error) {
            console.error("Check-in error:", error);
            UI.showToast("Failed to submit check-in", "error");
        }
    },

    loadHistory: async function(days = 14) {
        const container = document.getElementById('neuro-history-chart');
        if (!container) return; 

        try {
            const res = await APIService.request(`/api/neuro/history/?days=${days}`);
            if (res.success && res.data) {
                this.renderHistoryChart(res.data, days);
            }
        } catch (error) {
            console.error("Failed to load neuro history:", error);
        }
    },

    renderHistoryChart: function(data, days) {
        const canvas = document.getElementById('neuro-history-chart');
        if (!canvas) return;

        if (this.historyChart) {
            this.historyChart.destroy();
        }

        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        });
        const scores = data.map(d => d.score);
        
        const ctx = canvas.getContext('2d');
        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Readiness Score',
                    data: scores,
                    borderColor: '#E2F04F', // primary
                    backgroundColor: 'rgba(226, 240, 79, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#E2F04F',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9CA3AF' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    },
    
    renderAnalytics: async function() {
        // Implementation for analytics view if needed
    }
};

const ReactionTest = {
    trials: [],
    currentTrial: 0,
    totalTrials: 6, // 1 practice + 5 real
    sessionId: null,
    state: 'idle', // idle, waiting, ready, result, complete
    waitTimer: null,
    startTime: 0,
    isPractice: true,

    start: function() {
        let modal = document.getElementById('neuro-reaction-modal');
        if (!modal) {
            this.createModal();
            modal = document.getElementById('neuro-reaction-modal');
        }
        
        this.trials = [];
        this.currentTrial = 0;
        this.sessionId = crypto.randomUUID();
        this.state = 'idle';
        this.isPractice = true;
        
        modal.classList.remove('hidden');
        this.renderState();
    },

    createModal: function() {
        const modal = document.createElement('div');
        modal.id = 'neuro-reaction-modal';
        modal.className = 'fixed inset-0 z-[100] hidden flex flex-col items-center justify-center bg-black text-white cursor-pointer select-none touch-none';
        modal.onclick = (e) => this.handleClick(e);
        
        modal.innerHTML = `
            <div id="nr-test-content" class="text-center p-8 pointer-events-none flex flex-col items-center justify-center w-full h-full">
            </div>
            <button id="nr-test-close" class="absolute top-6 right-6 text-gray-500 hover:text-white p-2 z-50 hidden" onclick="ReactionTest.close(event)">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        document.body.appendChild(modal);
    },

    renderState: function() {
        const content = document.getElementById('nr-test-content');
        const modal = document.getElementById('neuro-reaction-modal');
        const closeBtn = document.getElementById('nr-test-close');
        
        if (!content || !modal) return;

        // Reset colors
        modal.style.backgroundColor = '#000000';
        closeBtn.classList.remove('hidden');

        switch (this.state) {
            case 'idle':
                content.innerHTML = `
                    <h2 class="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest text-white">Reaction Test</h2>
                    <p class="text-xl text-gray-400 mb-12 max-w-md mx-auto leading-relaxed">Tap/click anywhere on the screen when it turns <span class="text-green-500 font-bold">GREEN</span>. Don't tap early!</p>
                    <div class="px-10 py-5 bg-primary text-dark font-black rounded-full text-2xl pointer-events-auto cursor-pointer hover:scale-105 transition-transform" onclick="ReactionTest.runTrial(event)">
                        Begin Test
                    </div>
                `;
                break;
            case 'waiting':
                modal.style.backgroundColor = '#3f0000'; // Dark red/brown
                closeBtn.classList.add('hidden');
                content.innerHTML = `
                    <div class="text-5xl md:text-7xl font-black text-red-500/80 uppercase tracking-widest">Wait...</div>
                `;
                break;
            case 'ready':
                modal.style.backgroundColor = '#22c55e'; // Green
                closeBtn.classList.add('hidden');
                content.innerHTML = `
                    <div class="text-6xl md:text-8xl font-black text-dark uppercase tracking-widest">TAP NOW!</div>
                `;
                break;
            case 'result':
                const lastTrial = this.trials[this.trials.length - 1];
                let msg = lastTrial.reaction_ms ? `${Math.round(lastTrial.reaction_ms)} ms` : "Too early!";
                let msgColor = lastTrial.is_valid ? "text-white" : "text-red-500";
                if (!lastTrial.reaction_ms) msgColor = "text-orange-500";
                
                content.innerHTML = `
                    <div class="text-7xl md:text-8xl font-black ${msgColor} mb-6 tracking-tight">${msg}</div>
                    <div class="text-xl text-gray-400 uppercase font-bold tracking-widest">${lastTrial.is_practice ? 'Practice Trial' : `Trial ${this.currentTrial}/${this.totalTrials - 1}`}</div>
                `;
                break;
            case 'complete':
                const validTrials = this.trials.filter(t => !t.is_practice && t.is_valid);
                if (validTrials.length === 0) {
                    content.innerHTML = `
                        <h2 class="text-4xl font-black mb-4 text-red-500 uppercase tracking-widest">Test Failed</h2>
                        <p class="text-xl text-gray-400 mb-12">Not enough valid trials.</p>
                        <div class="px-10 py-5 bg-gray-800 text-white font-black rounded-full text-xl pointer-events-auto cursor-pointer hover:bg-gray-700 transition" onclick="ReactionTest.start()">
                            Retry Test
                        </div>
                    `;
                    return;
                }
                
                const times = validTrials.map(t => t.reaction_ms);
                const median = Stats.median(times);
                const mean = Stats.mean(times);
                const stdDev = Stats.stdDev(times);
                
                // Save to NeuroReadiness
                NeuroReadiness.recentReactionData = { median, mean, stdDev };
                
                // Update UI in check-in form if present
                const statusEl = document.getElementById('nr-reaction-status');
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div>
                            <div class="text-sm font-bold text-white mb-1 uppercase tracking-wide">CNS Reaction Test</div>
                            <div class="text-sm text-gray-400">Result: <span class="font-bold text-emerald-400">${Math.round(median)} ms</span> <span class="text-gray-500">(var: ${Math.round(stdDev)}ms)</span></div>
                        </div>
                        <div class="px-3 py-1.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-900/50 text-xs font-bold uppercase tracking-wider">Completed</div>
                    `;
                }

                content.innerHTML = `
                    <h2 class="text-4xl md:text-5xl font-black mb-10 uppercase tracking-widest text-primary">Test Complete</h2>
                    <div class="grid grid-cols-2 gap-8 md:gap-16 mb-16">
                        <div class="bg-dark/50 p-6 rounded-3xl border border-gray-800">
                            <div class="text-gray-400 text-sm md:text-base font-bold uppercase tracking-widest mb-2">Median Time</div>
                            <div class="text-5xl md:text-6xl font-black text-white">${Math.round(median)}<span class="text-2xl text-gray-500 ml-2">ms</span></div>
                        </div>
                        <div class="bg-dark/50 p-6 rounded-3xl border border-gray-800">
                            <div class="text-gray-400 text-sm md:text-base font-bold uppercase tracking-widest mb-2">Variability</div>
                            <div class="text-5xl md:text-6xl font-black text-white">${Math.round(stdDev)}<span class="text-2xl text-gray-500 ml-2">ms</span></div>
                        </div>
                    </div>
                    <div class="px-12 py-5 bg-primary text-dark font-black rounded-full text-2xl pointer-events-auto cursor-pointer hover:scale-105 transition-transform" onclick="ReactionTest.finish()">
                        Done
                    </div>
                `;
                break;
        }
    },

    handleClick: function(e) {
        // Prevent if clicking on specific buttons that have their own handlers
        if (e.target.closest('.pointer-events-auto')) return;
        if (e.target.closest('#nr-test-close')) return;

        if (this.state === 'waiting') {
            // Clicked too early
            clearTimeout(this.waitTimer);
            this.recordTrial(null, false);
            this.state = 'result';
            this.renderState();
            setTimeout(() => this.nextStep(), 1500);
        } else if (this.state === 'ready') {
            // Good click
            const reactionTime = performance.now() - this.startTime;
            const isValid = reactionTime >= 150 && reactionTime <= 1500;
            this.recordTrial(reactionTime, isValid);
            this.state = 'result';
            this.renderState();
            setTimeout(() => this.nextStep(), 1500);
        }
    },

    triggerReaction: function() {
        if (this.state === 'idle') {
            this.runTrial();
        } else if (this.state === 'waiting') {
            clearTimeout(this.waitTimer);
            this.recordTrial(null, false);
            this.state = 'result';
            this.renderState();
            setTimeout(() => this.nextStep(), 1500);
        } else if (this.state === 'ready') {
            const reactionTime = performance.now() - this.startTime;
            const isValid = reactionTime >= 150 && reactionTime <= 1500;
            this.recordTrial(reactionTime, isValid);
            this.state = 'result';
            this.renderState();
            setTimeout(() => this.nextStep(), 1500);
        } else if (this.state === 'complete') {
            this.finish();
        }
    },

    runTrial: function(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.state = 'waiting';
        this.renderState();
        
        // Random timeout between 2000 and 5000ms
        const delay = Math.random() * 3000 + 2000;
        
        this.waitTimer = setTimeout(() => {
            this.state = 'ready';
            this.startTime = performance.now();
            this.renderState();
        }, delay);
    },
    
    recordTrial: function(reaction_ms, is_valid) {
        this.trials.push({
            trial_num: this.trials.length + 1,
            reaction_ms: reaction_ms,
            is_practice: this.isPractice,
            is_valid: is_valid
        });
    },
    
    nextStep: function() {
        if (this.isPractice) {
            this.isPractice = false; // completed practice
            this.currentTrial = 1;
            this.runTrial();
        } else {
            // Check if last trial failed (null reaction or too early/late)
            const lastTrial = this.trials[this.trials.length - 1];
            if (!lastTrial.is_valid) {
                // Retry same trial num
                this.runTrial();
            } else {
                if (this.currentTrial < this.totalTrials - 1) {
                    this.currentTrial++;
                    this.runTrial();
                } else {
                    this.state = 'complete';
                    this.renderState();
                }
            }
        }
    },

    finish: async function() {
        this.close();
        
        // Send data to server
        const validTrials = this.trials.filter(t => !t.is_practice && t.is_valid);
        if (validTrials.length === 0) return;
        
        try {
            await APIService.request('/api/neuro/reaction-test/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    trials: this.trials
                })
            });
        } catch (error) {
            console.error("Failed to save reaction test data", error);
        }
    },

    close: function(e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        clearTimeout(this.waitTimer);
        const modal = document.getElementById('neuro-reaction-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

window.NeuroReadiness = NeuroReadiness;
window.ReactionTest = ReactionTest;
