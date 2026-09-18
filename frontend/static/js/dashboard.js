const Dashboard = {
    async load() {
        try {
            document.getElementById('dash-greeting').innerText = `Hello, ${app.user.name || 'Athlete'}`;
            const [wellness, progress, plan, profile] = await Promise.all([
                APIService.getWellness(), APIService.getProgress(), APIService.getWorkoutPlan(), APIService.getProfile()
            ]);
            document.getElementById('dash-age-badge').innerText = `${profile.data.age} YRS • ${profile.data.goal.toUpperCase()}`;
            document.getElementById('dash-water-text').innerText = `${wellness.data.water_ml} ml`;
            document.getElementById('dash-water-bar').style.width = `${Math.min((wellness.data.water_ml / 3000) * 100, 100)}%`;
            document.getElementById('dash-steps-text').innerText = `${wellness.data.steps} / 10000`;
            document.getElementById('dash-steps-bar').style.width = `${Math.min((wellness.data.steps / 10000) * 100, 100)}%`;
            document.getElementById('dash-sleep-text').innerText = `${wellness.data.sleep_hours} hrs`;
            Dashboard.lastWellness = wellness.data;
            document.getElementById('dash-streak-count').innerText = progress.data.streak;
            document.getElementById('dash-total-workouts').innerText = progress.data.total_workouts;
            document.getElementById('dash-total-xp').innerText = progress.data.total_xp;
            
            Workouts.currentWorkoutPlan = plan.data;
            const firstEx = (plan.data.exercises && plan.data.exercises[0]) ? plan.data.exercises[0].name : 'Push-up';
            document.getElementById('dash-workout-preview').innerHTML = `
                <div class="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-inner flex items-center justify-between gap-4">
                    <div>
                        <h4 class="font-black text-white text-xl">${plan.data.title}</h4>
                        <p class="text-sm font-bold text-primary mt-2 uppercase tracking-widest">${plan.data.duration_minutes} Mins • ${plan.data.difficulty}</p>
                    </div>
                    <div class="w-20 h-20 bg-white rounded-2xl border border-gray-600/30 overflow-hidden flex-shrink-0 relative flex items-center justify-center p-1 shadow-lg">
                        <canvas class="hollowman-canvas" width="180" height="180" style="width:100%; height:100%; display:block;" data-exercise="${firstEx}"></canvas>
                    </div>
                </div>`;
            if (window.HollowMan) setTimeout(() => HollowMan.init(), 100);
                
            const nutrition = await APIService.getNutritionPlan();
            document.getElementById('dash-nutrition-preview').innerHTML = `
                <div class="bg-black/40 p-4 rounded-2xl border border-white/10 text-center"><p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Calories</p><p class="text-2xl font-black text-white">${nutrition.data.targets.target_calories}</p></div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/10 text-center"><p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Protein</p><p class="text-2xl font-black text-primary">${nutrition.data.targets.target_protein_g}g</p></div>
                <div class="bg-black/40 p-4 rounded-2xl border border-white/10 text-center"><p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Carbs</p><p class="text-2xl font-black text-secondary">${nutrition.data.targets.target_carbs_g}g</p></div>
            `;
        } catch (e) { 
            console.error(e); 
        }
    }
};
window.Dashboard = Dashboard;