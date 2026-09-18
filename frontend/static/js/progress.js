const Progress = {
    async load() {
        const res = await APIService.getProgress();
        const data = res.data;

        document.getElementById('prog-total-workouts').innerText = data.total_workouts;
        document.getElementById('prog-streak-days').innerText = data.streak;
        document.getElementById('prog-activity-mins').innerText = data.total_workouts * 30;
        document.getElementById('prog-total-xp').innerText = data.total_xp;

        Wellness.loadAssessment();
        this.loadBadges();
        this.loadLeaderboard();
    },

    async loadBadges() {
        const container = document.getElementById('achievements-container');
        const summaryEl = document.getElementById('badges-summary');
        if (!container) return;

        try {
            const res = await APIService.getBadges();
            const d = (res && res.data) || { badges: [], total: 0, unlocked: 0 };

            if (summaryEl) {
                summaryEl.innerText = `${d.unlocked} / ${d.total} unlocked`;
            }

            let bHtml = '';
            d.badges.forEach(b => {
                const stateClasses = b.unlocked
                    ? 'bg-black/30 border-white/10'
                    : 'bg-black/10 border-white/5 opacity-35 grayscale';
                const iconColor = b.unlocked ? b.color : 'text-gray-600';

                bHtml += `
                    <div class="${stateClasses} p-4 rounded-2xl text-center border relative transition-all" title="${b.desc}">
                        ${b.unlocked ? '<i class="fas fa-check-circle text-emerald-400 text-xs absolute top-2 right-2"></i>' : '<i class="fas fa-lock text-gray-500 text-xs absolute top-2 right-2"></i>'}
                        <i class="fas ${b.icon} ${iconColor} text-3xl mb-2"></i>
                        <p class="text-[10px] font-bold text-white uppercase tracking-wider">${b.title}</p>
                        <p class="text-[9px] text-gray-500 mt-1">${b.desc}</p>
                    </div>`;
            });
            container.innerHTML = bHtml;
        } catch (e) {
            console.error('Badges load error:', e);
        }
    },

    async loadLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;

        try {
            const res = await APIService.getLeaderboard();
            const rows = (res && res.data && res.data.leaderboard) || [];

            if (!rows.length) {
                container.innerHTML = '<p class="text-sm text-gray-500 text-center py-6">No ranked athletes yet — complete a workout to join the leaderboard.</p>';
                return;
            }

            container.innerHTML = rows.map(r => `
                <div class="flex items-center justify-between p-3.5 rounded-xl ${r.is_you ? 'bg-primary/10 border border-primary/30' : 'bg-dark border border-gray-800'}">
                    <div class="flex items-center gap-3">
                        <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${r.rank <= 3 ? 'bg-primary text-dark' : 'bg-gray-800 text-gray-400'}">${r.rank}</span>
                        <span class="text-sm font-bold text-white">${r.name}${r.is_you ? ' (You)' : ''}</span>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-black text-primary">${r.xp.toLocaleString()} XP</p>
                        <p class="text-[10px] text-gray-500">${r.workouts} workouts</p>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Leaderboard load error:', e);
        }
    }
};

window.Progress = Progress;
