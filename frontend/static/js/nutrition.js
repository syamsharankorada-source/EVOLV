const Nutrition = {
    donutCharts: {},

    async load() {
        this.loadToday();
        try {
            const res = await APIService.getNutritionPlan();
            if(!res.success || !res.data) return;

            const disclaimerBox = document.getElementById('nutrition-disclaimer-box');
            if(disclaimerBox) {
                disclaimerBox.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <h4 style="font-weight: 900; color: #F2F2F2; font-size: 1.1rem; margin-bottom: 4px;">Daily Nutritional Targets (${res.data.diet_type.replace('_',' ').toUpperCase()})</h4>
                            <p style="font-size: 0.8rem; color: #8A8A8A;">${res.data.safety_disclaimer}</p>
                        </div>
                        <div style="display: flex; gap: 15px; background: #161616; padding: 12px 20px; border-radius: 14px; border: 1px solid #2a2a2a;">
                            <div><span style="font-size: 9px; color: #8A8A8A; display: block; font-weight: bold; text-transform: uppercase;">Calories</span><span style="font-weight: 900; color: #F2F2F2; font-size: 0.95rem;">${res.data.targets.target_calories} kcal</span></div>
                            <div style="border-left: 1px solid #2a2a2a; padding-left: 12px;"><span style="font-size: 9px; color: #8A8A8A; display: block; font-weight: bold; text-transform: uppercase;">Protein</span><span style="font-weight: 900; color: #F2F2F2; font-size: 0.95rem;">${res.data.targets.target_protein_g}g</span></div>
                            <div style="border-left: 1px solid #2a2a2a; padding-left: 12px;"><span style="font-size: 9px; color: #8A8A8A; display: block; font-weight: bold; text-transform: uppercase;">Carbs</span><span style="font-weight: 900; color: #F2F2F2; font-size: 0.95rem;">${res.data.targets.target_carbs_g}g</span></div>
                            <div style="border-left: 1px solid #2a2a2a; padding-left: 12px;"><span style="font-size: 9px; color: #8A8A8A; display: block; font-weight: bold; text-transform: uppercase;">Fats</span><span style="font-weight: 900; color: #F2F2F2; font-size: 0.95rem;">${res.data.targets.target_fats_g}g</span></div>
                        </div>
                    </div>`;
            }

            const container = document.getElementById('full-nutrition-list');
            if(!container) return;

            let html = '';
            const weekly = res.data.weekly_plan || [];

            html += `<div style="display: flex; flex-direction: column; gap: 24px; width: 100%;">`;

            weekly.forEach(dayPlan => {
                const borderColor = dayPlan.is_today ? '#F2F2F2' : '#242424';
                const bgSurface = dayPlan.is_today ? '#1A1A1A' : '#161616';
                const badge = dayPlan.is_today ? '<span style="font-size: 10px; background: #F2F2F2; color: #0E0E0E; padding: 4px 10px; border-radius: 20px; font-weight: 900; text-transform: uppercase; margin-left: 10px;">Today\'s Plan</span>' : '';
                
                html += `
                    <div style="background: ${bgSurface}; border: 1px solid ${borderColor}; border-radius: 20px; padding: 24px; width: 100%; box-sizing: border-box;">
                        <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #2a2a2a; padding-bottom: 12px;">
                            <h3 style="font-weight: 900; font-size: 1.4rem; color: #F2F2F2; margin: 0;">${dayPlan.day}</h3>
                            ${badge}
                        </div>
                        <!-- ABSOLUTE HORIZONTAL FLEX CONTAINER (AVOIDS GRID BREAKS) -->
                        <div style="display: flex; flex-direction: row; gap: 16px; width: 100%; overflow-x: auto;">`;
                
                dayPlan.meals.forEach(m => {
                    const escapedDish = m.recommendation.replace(/'/g, "\\'");
                    html += `
                        <div style="flex: 1; background: #0E0E0E; border: 1px solid #2a2a2a; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; min-height: 160px; min-width: 200px; box-sizing: border-box;">
                            <div>
                                <span style="font-size: 10px; font-weight: 900; color: #8A8A8A; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">${m.meal}</span>
                                <h4 style="font-weight: bold; font-size: 0.9rem; color: #F2F2F2; line-height: 1.4; margin: 0 0 12px 0;">${m.recommendation}</h4>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #242424; padding-top: 10px; font-size: 11px; font-weight: bold; margin-bottom: 10px;">
                                    <span style="color: #d4d4d4;"><i class="fas fa-fire" style="margin-right: 4px;"></i>${m.calories} kcal</span>
                                    <span style="color: #d4d4d4;"><i class="fas fa-fish" style="margin-right: 4px;"></i>${m.protein_g}g Pro</span>
                                </div>
                                <button onclick="Nutrition.showRecipe('${escapedDish}')" style="width: 100%; background: #161616; border: 1px solid #2a2a2a; color: #F2F2F2; font-size: 11px; font-weight: bold; padding: 8px; border-radius: 8px; cursor: pointer;">
                                    <i class="fas fa-utensils" style="margin-right: 4px;"></i> Recipe
                                </button>
                            </div>
                        </div>`;
                });
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
            container.innerHTML = html;
        } catch (e) {
            console.error("Failed to load nutrition:", e);
        }
    },

    async loadToday() {
        try {
            const res = await APIService.getNutritionToday();
            const d = (res && res.data) || {};
            const totals = d.totals || { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0 };
            const targets = d.targets || { target_calories: 2000, target_protein_g: 100, target_carbs_g: 250, target_fats_g: 65, target_fiber_g: 30 };

            this.renderDonut('donut-calories', totals.calories, targets.target_calories, '#F2F2F2', `${totals.calories}`);
            this.renderDonut('donut-protein', totals.protein_g, targets.target_protein_g, '#F2F2F2', `${totals.protein_g}g`);
            this.renderDonut('donut-carbs', totals.carbs_g, targets.target_carbs_g, '#F2F2F2', `${totals.carbs_g}g`);
            this.renderDonut('donut-fats', totals.fats_g, targets.target_fats_g, '#F2F2F2', `${totals.fats_g}g`);
            this.renderDonut('donut-fiber', totals.fiber_g, targets.target_fiber_g || 30, '#F2F2F2', `${totals.fiber_g}g`);

            const listEl = document.getElementById('today-meals-list');
            if (listEl) {
                const meals = d.meals || [];
                listEl.innerHTML = meals.length
                    ? meals.map(m => `
                        <div class="flex justify-between items-center bg-dark px-4 py-2.5 rounded-xl border border-gray-800 text-sm">
                            <span class="text-white font-bold">${m.meal_name}</span>
                            <span class="text-gray-400 text-xs">${m.calories} kcal • P ${m.protein_g}g • C ${m.carbs_g}g • F ${m.fats_g}g</span>
                        </div>`).join('')
                    : '<p class="text-xs text-gray-500 text-center py-4">No meals logged yet today — tap "Snap Meal" to log your first one.</p>';
            }
        } catch (e) {
            console.error('Nutrition today load error:', e);
        }
    },

    renderDonut(canvasId, value, target, color, centerLabel) {
        const canvas = document.getElementById(canvasId);
        const labelEl = document.getElementById(`${canvasId}-label`);
        if (!canvas || typeof Chart === 'undefined') return;
        if (labelEl) labelEl.innerText = centerLabel;

        const remaining = Math.max(target - value, 0);
        const over = value > target;

        if (this.donutCharts[canvasId]) this.donutCharts[canvasId].destroy();
        this.donutCharts[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: over ? [target, 0] : [value, remaining],
                    backgroundColor: [color, 'rgba(255,255,255,0.08)'],
                    borderWidth: 0,
                }]
            },
            options: {
                cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 400 },
            }
        });
    },

    async showRecipe(dishName) {
        const modal = document.getElementById('recipe-modal');
        const loading = document.getElementById('recipe-loading');
        const content = document.getElementById('recipe-content');
        const nameEl = document.getElementById('recipe-dish-name');

        nameEl.innerText = dishName;
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        modal.classList.remove('hidden');

        try {
            const res = await APIService.getRecipe(dishName);
            const recipe = (res && res.data && res.data.recipe) || "Couldn't fetch the recipe right now.";
            content.innerText = recipe;
        } catch (e) {
            content.innerText = "Couldn't fetch the recipe right now — please try again.";
        } finally {
            loading.classList.add('hidden');
            content.classList.remove('hidden');
        }
    }
};
window.Nutrition = Nutrition;
