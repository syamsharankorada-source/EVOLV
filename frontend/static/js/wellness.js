const Wellness = {
    trendChart: null,

    async syncSmartwatch() {
        if (typeof Wearable !== 'undefined' && Wearable.openModal) {
            Wearable.openModal();
            return;
        }
        UI.showToast('Syncing with wearable...', 'info');
        try {
            await APIService.syncBand();
            UI.showToast('Sync complete', 'success');
            if (typeof Dashboard !== 'undefined' && Dashboard.load) Dashboard.load();
            if (app.currentView === 'progress') this.loadAssessment();
        } catch (e) { 
            UI.showToast('Sync failed', 'error'); 
        }
    },
    
    async adjustSleep(amount) {
        // This used to just pop a toast without saving anything — the buttons
        // looked real but never touched your actual sleep log. Now it reads
        // the last-loaded total, applies the change, and actually saves it.
        const current = (typeof Dashboard !== 'undefined' && Dashboard.lastWellness)
            ? parseFloat(Dashboard.lastWellness.sleep_hours) || 0
            : 0;
        const updated = Math.max(0, Math.min(16, Math.round((current + amount) * 10) / 10));

        try {
            const res = await APIService.request('/api/wellness/sync/', {
                method: 'POST',
                body: JSON.stringify({ sleep_hours: updated })
            });
            if (res && res.success) {
                if (typeof Dashboard !== 'undefined' && Dashboard.load) Dashboard.load();
                UI.showToast(`Sleep set to ${updated}h`, 'success');
            } else {
                UI.showToast('Could not save sleep update', 'error');
            }
        } catch (e) {
            UI.showToast('Could not save sleep update', 'error');
        }
    },

    verdictColor(verdict) {
        return {
            fit: 'text-emerald-400',
            needs_improvement: 'text-yellow-400',
            at_risk: 'text-red-400',
            no_data: 'text-gray-400',
        }[verdict] || 'text-primary';
    },

    async loadAssessment() {
        try {
            const [assessRes, historyRes] = await Promise.all([
                APIService.getWellnessAssessment(),
                APIService.getWellnessHistory(),
            ]);

            const a = (assessRes && assessRes.data) || {};
            const headlineEl = document.getElementById('assess-headline');
            const scoreEl = document.getElementById('assess-score');
            if (headlineEl) headlineEl.innerText = a.headline || 'No data yet';
            if (scoreEl) {
                scoreEl.innerText = a.days_with_data ? `${a.overall_score}%` : '--';
                scoreEl.className = `text-4xl font-black mb-4 ${this.verdictColor(a.verdict)}`;
            }

            const list = document.getElementById('assess-suggestions');
            if (list) {
                list.innerHTML = (a.suggestions || []).map(s => `<li class="flex gap-2"><i class="fas fa-circle-dot text-primary text-[6px] mt-1.5"></i><span>${s}</span></li>`).join('');
            }

            const stepsEl = document.getElementById('assess-avg-steps');
            const sleepEl = document.getElementById('assess-avg-sleep');
            const waterEl = document.getElementById('assess-avg-water');
            const hrEl = document.getElementById('assess-avg-hr');

            if (stepsEl) stepsEl.innerText = (a.avg_steps || 0).toLocaleString();
            if (sleepEl) sleepEl.innerText = `${a.avg_sleep_hours || 0}h`;
            if (waterEl) waterEl.innerText = `${(a.avg_water_ml || 0).toLocaleString()}ml`;
            if (hrEl) hrEl.innerText = `${a.avg_heart_rate || 72} bpm`;

            const days = (historyRes && historyRes.data && historyRes.data.days) || [];
            this.renderTrendChart(days);
        } catch (e) {
            console.error('Wellness assessment load error:', e);
        }
    },

    renderTrendChart(days) {
        const canvas = document.getElementById('wellness-trend-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = days.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const steps = days.map(d => d.steps || 0);
        const sleep = days.map(d => d.sleep_hours || 0);

        if (this.trendChart) this.trendChart.destroy();
        this.trendChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Steps / Day',
                        data: steps,
                        borderColor: '#F2F2F2',
                        backgroundColor: 'rgba(242, 242, 242, 0.08)',
                        yAxisID: 'y',
                        tension: 0,
                        fill: true,
                    },
                    {
                        label: 'Sleep (hrs)',
                        data: sleep,
                        borderColor: '#8A8A8A',
                        backgroundColor: 'rgba(138, 138, 138, 0.08)',
                        yAxisID: 'y1',
                        tension: 0,
                        fill: false,
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { weight: 'bold', size: 11 }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        position: 'left',
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        title: { display: true, text: 'Steps', color: '#64748b' }
                    },
                    y1: {
                        position: 'right',
                        ticks: { color: '#64748b' },
                        grid: { display: false },
                        min: 0,
                        max: 12,
                        title: { display: true, text: 'Sleep (hrs)', color: '#64748b' }
                    },
                }
            }
        });
    }
};
window.Wellness = Wellness;