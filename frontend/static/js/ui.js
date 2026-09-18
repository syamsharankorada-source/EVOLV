const UI = {
    // Views that require the user to have logged in, created an account, or
    // continued as a guest first — direct navigation to these is blocked.
    PROTECTED_VIEWS: ['dashboard', 'ai-coach', 'workouts', 'nutrition', 'community', 'progress', 'neuro', 'settings', 'comparison', 'vibe'],


    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const colors = { success: 'bg-emerald-500/90 border-emerald-400', error: 'bg-red-500/90 border-red-400', info: 'bg-secondary/90 border-blue-400' };
        toast.className = `${colors[type]} text-white px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-xl border font-bold text-sm transform transition-all duration-300 translate-x-full opacity-0 flex items-center gap-3`;
        let icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        toast.innerHTML = `<i class="fas ${icon} text-lg"></i> ${message}`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-x-full', 'opacity-0'));
        setTimeout(() => { toast.classList.add('translate-x-full', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
    },

    navigate(viewId) {
        if (this.PROTECTED_VIEWS.includes(viewId) && (!app.user || !app.user.name)) {
            this.showToast('Please sign in or continue as guest to access EVOLV', 'info');
            Auth.open();
            
            // Force landing view and prevent showing protected content
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
            const landingView = document.getElementById('view-landing');
            if (landingView) landingView.classList.remove('hidden');
            app.currentView = 'landing';
            this.updateNav();
            return;
        }

        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const targetView = document.getElementById(`view-${viewId}`);
        if(targetView) targetView.classList.remove('hidden');
        app.currentView = viewId;
        this.updateNav();
        window.scrollTo(0, 0);

        if (viewId === 'dashboard') Dashboard.load();
        if (viewId === 'ai-coach') {
            Kang.loadHistory();
            if (window.KangAnimationController) {
                setTimeout(() => KangAnimationController._resize(), 60);
            }
        }
        if (viewId === 'workouts') {
            Workouts.load();
            if (window.HollowMan) setTimeout(() => HollowMan.init(), 200);
        }
        if (viewId === 'nutrition') Nutrition.load();
        if (viewId === 'community' && window.Community) Community.load();
        if (viewId === 'progress') Progress.load();
        if (viewId === 'neuro' && window.NeuroReadiness) NeuroReadiness.load();
        if (viewId === 'vibe' && window.Vibe) Vibe.load();

        setTimeout(() => {
            if (window.FontAwesome && window.FontAwesome.dom && window.FontAwesome.dom.i2svg) {
                window.FontAwesome.dom.i2svg();
            }
        }, 50);
    },

    updateNav() {
        const desktopMenu = document.getElementById('nav-desktop-menu');
        const mobileMenu  = document.getElementById('mobile-menu');

        /* ── Unauthenticated state ── */
        if (!app.user || !app.user.name) {
            if (desktopMenu) {
                desktopMenu.innerHTML = `
                    <button onclick="app.openAuth()" class="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white border border-white/15 rounded-xl transition-all">
                        ${window.I18n ? I18n.t('nav_sign_in') : 'Sign In'}
                    </button>
                    <button onclick="app.startOnboarding()" class="px-4 py-2 text-xs font-bold text-dark bg-primary hover:bg-primary-dark rounded-xl ml-2 transition-all shadow-md">
                        ${window.I18n ? I18n.t('nav_get_started') : 'Get Started'}
                    </button>
                `;
            }
            if (mobileMenu) {
                mobileMenu.innerHTML = `
                    <button onclick="app.openAuth(); UI.toggleMobileMenu()" class="w-full text-left px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-white/5 transition-all">
                        ${window.I18n ? I18n.t('nav_sign_in') : 'Sign In'}
                    </button>
                    <button onclick="app.startOnboarding(); UI.toggleMobileMenu()" class="w-full text-left px-4 py-3 rounded-xl font-bold text-primary hover:bg-white/5 transition-all">
                        ${window.I18n ? I18n.t('nav_get_started') : 'Get Started'}
                    </button>
                `;
            }
            return;
        }

        /* ── Link definitions (No keyboard shortcut hints) ── */
        const links = [
            { id: 'dashboard', icon: 'fa-home',        tip: 'nav_dashboard' },
            { id: 'ai-coach',  icon: 'fa-robot',       tip: 'nav_ai_coach' },
            { id: 'vibe',      icon: 'fa-headphones',  tip: 'nav_vibe' },
            { id: 'neuro',     icon: 'fa-brain',       tip: 'nav_neuro' },
            { id: 'workouts',  icon: 'fa-dumbbell',    tip: 'nav_workouts' },
            { id: 'nutrition', icon: 'fa-utensils',    tip: 'nav_nutrition' },
            { id: 'community', icon: 'fa-users',       tip: 'nav_community' },
            { id: 'progress',  icon: 'fa-chart-line',  tip: 'nav_progress' },
            { id: 'settings',  icon: 'fa-cog',         tip: 'nav_settings' },
        ];

        const label = (link) => window.I18n ? I18n.t(link.tip) : link.tip;

        let desktopHtml = '', mobileHtml = '';
        links.forEach(link => {
            const text = label(link);
            const active = app.currentView === link.id;
            const activeClass = active ? 'text-primary border-b-2 border-primary font-black' : 'text-gray-300 hover:text-white';
            const mobileActiveClass = active ? 'bg-white/10 text-primary font-black' : 'text-gray-300 hover:bg-white/5';

            desktopHtml += `
                <button onclick="UI.navigate('${link.id}')" class="px-3.5 py-2 text-sm font-bold transition-all ${activeClass}">
                    <i class="fas ${link.icon} mr-1.5 text-xs"></i> ${text}
                </button>`;
            mobileHtml += `
                <button onclick="UI.navigate('${link.id}'); UI.toggleMobileMenu()" class="w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${mobileActiveClass}">
                    <i class="fas ${link.icon} mr-2"></i> ${text}
                </button>`;
        });

        if (desktopMenu) desktopMenu.innerHTML = desktopHtml;
        if (mobileMenu) mobileMenu.innerHTML = mobileHtml;

        if (window.FontAwesome && window.FontAwesome.dom && window.FontAwesome.dom.i2svg) {
            window.FontAwesome.dom.i2svg();
        }
    },

    toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    openScanner(type) {
        this.scannerType = type;
        document.getElementById('scanner-modal').classList.remove('hidden');
        document.getElementById('scanner-title').innerText = type === 'body' ? 'Body Scanner' : type === 'food' ? 'Snap Your Meal' : 'Document Scanner';
        document.getElementById('scanner-desc').innerText = type === 'food' ? 'Point your camera at your meal or upload a photo to calculate exact calories and macros.' : 'Align within the frame.';
        document.getElementById('scanner-result').classList.add('hidden');
        document.getElementById('scanner-error').classList.add('hidden');

        if (type === 'food') {
            this.startScannerCamera();
        } else {
            document.getElementById('scanner-video').classList.add('hidden');
            document.getElementById('scanner-placeholder-icon').classList.remove('hidden');
        }
    },

    async startScannerCamera() {
        const video = document.getElementById('scanner-video');
        const icon = document.getElementById('scanner-placeholder-icon');
        const errEl = document.getElementById('scanner-error');
        try {
            this.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            video.srcObject = this.scannerStream;
            await video.play();
            video.classList.remove('hidden');
            icon.classList.add('hidden');
            if (errEl) errEl.classList.add('hidden');
        } catch (e) {
            video.classList.add('hidden');
            icon.classList.remove('hidden');
            if (errEl) {
                errEl.classList.remove('hidden');
                errEl.innerHTML = '<span class="text-xs">Camera unavailable. You can use the <strong>Upload Food Photo</strong> button below.</span>';
            }
        }
    },

    closeScanner() {
        if (this.scannerStream) {
            this.scannerStream.getTracks().forEach(t => t.stop());
            this.scannerStream = null;
        }
        document.getElementById('scanner-modal').classList.add('hidden');
    },

    async processScan(customDataUrl = null) {
        if (this.scannerType !== 'food') {
            this.showToast('This scanner is coming soon', 'info');
            return;
        }

        let dataUrl = customDataUrl;
        if (!dataUrl) {
            const video = document.getElementById('scanner-video');
            const canvas = document.getElementById('scanner-canvas');
            if (!video.videoWidth) {
                this.showToast('Camera not ready — try uploading a photo instead', 'error');
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        const btn = document.getElementById('scanner-capture-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Analyzing Nutrition...';
        }

        try {
            const res = await APIService.scanMeal(dataUrl);

            if (!res || !res.success) {
                // Genuine failure (not food, or the photo couldn't be read) —
                // show the real reason instead of logging made-up numbers.
                this.showToast((res && res.message) || 'Could not analyze photo — please try again', 'error');
                return;
            }

            const d = res.data || {};

            const resultName = document.getElementById('scanner-result-name');
            const resultMacros = document.getElementById('scanner-result-macros');
            if (resultName) resultName.innerText = d.meal_name || 'Meal Logged';
            if (resultMacros) {
                resultMacros.innerHTML = `
                    ${d.portion_estimate ? `<p class="text-[11px] text-slate-400 mb-2">${d.portion_estimate}</p>` : ''}
                    <div class="mt-2 flex flex-wrap justify-center gap-2 text-xs font-bold">
                        <span class="bg-primary/30 text-blue-300 px-2.5 py-1 rounded-lg border border-primary/40">${d.calories || 0} kcal</span>
                        <span class="bg-blue-900/40 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-700/40">${d.protein_g || 0}g Protein</span>
                        <span class="bg-amber-900/40 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-700/40">${d.carbs_g || 0}g Carbs</span>
                        <span class="bg-emerald-900/40 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-700/40">${d.fats_g || 0}g Fats</span>
                        <span class="bg-purple-900/40 text-purple-400 px-2.5 py-1 rounded-lg border border-purple-700/40">${d.fiber_g || 0}g Fiber</span>
                    </div>
                `;
            }
            
            document.getElementById('scanner-result').classList.remove('hidden');
            this.showToast(`Logged ${d.meal_name || 'Meal'} (${d.calories || 0} kcal) to Nutrition Dashboard!`, 'success');

            setTimeout(() => {
                this.closeScanner();
                this.navigate('nutrition');
                if (window.Nutrition) Nutrition.load();
            }, 1800);
        } catch (e) {
            this.showToast('Could not analyze photo — please try again', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-expand mr-2"></i> Capture & Analyze';
            }
        }
    },

    handleFoodPhotoUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.processScan(dataUrl);
        };
        reader.readAsDataURL(file);
    }
};
window.UI = UI;