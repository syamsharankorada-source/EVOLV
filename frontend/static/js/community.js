const Community = {
    activeTab: 'coaches',
    activeSpecialty: '',
    specialties: [],
    categories: [],
    isCoach: false,

    async load() {
        this.switchTab(this.activeTab);
    },

    switchTab(tab) {
        this.activeTab = tab;
        ['coaches', 'feed', 'mycoach'].forEach(t => {
            document.getElementById(`community-tab-${t}`).classList.toggle('hidden', t !== tab);
            const btn = document.getElementById(`community-tab-btn-${t}`);
            if (btn) {
                btn.classList.toggle('bg-primary', t === tab);
                btn.classList.toggle('text-dark', t === tab);
                btn.classList.toggle('text-gray-400', t !== tab);
            }
        });

        if (tab === 'coaches') this.loadCoaches();
        if (tab === 'feed') this.loadFeed();
        if (tab === 'mycoach') this.loadMyCoachProfile();
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },

    async loadCoaches() {
        const grid = document.getElementById('coaches-grid');
        if (!grid) return;
        try {
            const res = await APIService.getCoaches(this.activeSpecialty);
            const d = (res && res.data) || { coaches: [], specialties: [] };
            this.specialties = d.specialties || [];
            this.renderSpecialtyChips();

            if (!d.coaches.length) {
                grid.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center py-10">No coaches yet in this specialty — be the first from "My Coach Profile".</p>';
                return;
            }

            grid.innerHTML = d.coaches.map(c => `
                <div class="bg-surface rounded-3xl p-6 border border-gray-800">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-black text-white text-lg">${this.escapeHtml(c.name)}</h4>
                            <span class="text-[10px] font-bold uppercase text-primary tracking-widest">${this.escapeHtml(c.specialty_label)}</span>
                        </div>
                        <span class="text-xs text-gray-500">${c.years_experience}+ yrs</span>
                    </div>
                    <p class="text-sm text-gray-400 mb-3 min-h-[40px]">${this.escapeHtml(c.bio) || 'No bio added yet.'}</p>
                    ${c.certification_name ? `<p class="text-[11px] text-gray-500 mb-4"><i class="fas fa-certificate mr-1 text-yellow-500"></i> ${this.escapeHtml(c.certification_name)} <span class="text-gray-600">(self-reported)</span></p>` : ''}
                    <div class="flex justify-between items-center border-t border-gray-800 pt-3">
                        <span class="text-xs text-gray-500">${c.post_count} post${c.post_count === 1 ? '' : 's'}</span>
                        ${c.is_you
                            ? '<span class="text-xs text-gray-600 font-bold">This is you</span>'
                            : `<button onclick="Community.openHire(${c.user_id}, '${this.escapeHtml(c.name)}')" class="px-4 py-2 bg-primary text-dark text-xs font-bold rounded-lg hover:bg-primary-dark transition-all">Request to Hire</button>`}
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Load coaches error:', e);
        }
    },

    renderSpecialtyChips() {
        const container = document.querySelector('#community-tab-coaches .flex.gap-2.overflow-x-auto');
        if (!container) return;
        const chips = [['', 'All'], ...this.specialties];
        container.innerHTML = chips.map(([value, label]) => `
            <button onclick="Community.filterCoaches('${value}')" class="community-specialty-chip px-4 py-2 rounded-lg font-bold ${this.activeSpecialty === value ? 'bg-primary text-dark' : 'bg-gray-800 text-gray-400 hover:text-dark'}">${label}</button>
        `).join('');
    },

    filterCoaches(specialty) {
        this.activeSpecialty = specialty;
        this.loadCoaches();
    },

    async loadFeed() {
        const feed = document.getElementById('posts-feed');
        const newPostBtn = document.getElementById('new-post-btn');
        if (!feed) return;
        try {
            const [postsRes, coachRes] = await Promise.all([
                APIService.getCommunityPosts(),
                APIService.getMyCoachProfile(),
            ]);
            this.isCoach = !!(coachRes && coachRes.data);
            if (newPostBtn) newPostBtn.classList.toggle('hidden', !this.isCoach);

            const d = (postsRes && postsRes.data) || { posts: [], categories: [] };
            this.categories = d.categories || [];

            if (!d.posts.length) {
                feed.innerHTML = '<p class="text-sm text-gray-500 text-center py-10">No posts yet — coaches can share content here.</p>';
                return;
            }

            feed.innerHTML = d.posts.map(p => `
                <div class="bg-surface rounded-2xl p-6 border border-gray-800">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-bold uppercase text-primary tracking-widest">${this.escapeHtml(p.category_label)}</span>
                        <span class="text-[10px] text-gray-500">${new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 class="font-black text-white text-lg mb-2">${this.escapeHtml(p.title)}</h4>
                    <p class="text-sm text-gray-300 leading-relaxed mb-3" style="white-space: pre-line;">${this.escapeHtml(p.content)}</p>
                    <p class="text-xs text-gray-500">By ${this.escapeHtml(p.author_name)}${p.author_specialty ? ' • ' + this.escapeHtml(p.author_specialty) : ''}</p>
                </div>
            `).join('');
        } catch (e) {
            console.error('Load feed error:', e);
        }
    },

    async loadMyCoachProfile() {
        const specialtySelect = document.getElementById('coach-specialty');
        if (specialtySelect && !specialtySelect.dataset.filled) {
            const res = await APIService.getCoaches('');
            const specialties = (res && res.data && res.data.specialties) || [];
            specialtySelect.innerHTML = specialties.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
            specialtySelect.dataset.filled = '1';
        }

        try {
            const res = await APIService.getMyCoachProfile();
            const profile = res && res.data;
            if (profile) {
                document.getElementById('coach-specialty').value = profile.specialty;
                document.getElementById('coach-bio').value = profile.bio;
                document.getElementById('coach-experience').value = profile.years_experience;
                document.getElementById('coach-certification').value = profile.certification_name;
            }
        } catch (e) {
            console.error('Load my coach profile error:', e);
        }

        this.loadMyHireRequests();
    },

    async saveCoachProfile(e) {
        e.preventDefault();
        const payload = {
            specialty: document.getElementById('coach-specialty').value,
            bio: document.getElementById('coach-bio').value,
            years_experience: document.getElementById('coach-experience').value || 0,
            certification_name: document.getElementById('coach-certification').value,
        };
        try {
            await APIService.becomeCoach(payload);
            UI.showToast('Coach profile saved', 'success');
            this.loadMyHireRequests();
        } catch (e) {
            UI.showToast('Could not save coach profile', 'error');
        }
    },

    async loadMyHireRequests() {
        const container = document.getElementById('my-hire-requests');
        if (!container) return;
        try {
            const res = await APIService.getMyHireRequests();
            const requests = (res && res.data && res.data.requests) || [];
            container.innerHTML = requests.length
                ? requests.map(r => `
                    <div class="bg-dark p-4 rounded-xl border border-gray-800">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-bold text-white">${this.escapeHtml(r.requester_name)}</span>
                            <span class="text-[10px] text-gray-500">${new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p class="text-xs text-gray-400 mb-1">${this.escapeHtml(r.message)}</p>
                        <p class="text-[10px] text-gray-600">Prefers: ${r.contact_preference.replace('_', ' ')}</p>
                    </div>
                `).join('')
                : '<p class="text-xs text-gray-500 text-center py-4">No hire requests yet.</p>';
        } catch (e) {
            console.error('Load hire requests error:', e);
        }
    },

    openHire(coachUserId, coachName) {
        document.getElementById('hire-modal-title').innerText = `Request to Hire ${coachName}`;
        document.getElementById('hire-modal').dataset.coachId = coachUserId;
        document.getElementById('hire-message').value = '';
        document.getElementById('hire-modal').classList.remove('hidden');
    },

    async submitHireRequest(e) {
        e.preventDefault();
        const coachUserId = document.getElementById('hire-modal').dataset.coachId;
        const payload = {
            coach_user_id: parseInt(coachUserId, 10),
            message: document.getElementById('hire-message').value,
            contact_preference: document.getElementById('hire-contact-pref').value,
        };
        try {
            await APIService.sendHireRequest(payload);
            document.getElementById('hire-modal').classList.add('hidden');
            UI.showToast('Request sent!', 'success');
        } catch (e) {
            UI.showToast('Could not send request', 'error');
        }
    },

    openNewPost() {
        const categorySelect = document.getElementById('post-category');
        if (categorySelect && !categorySelect.dataset.filled) {
            categorySelect.innerHTML = this.categories.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
            categorySelect.dataset.filled = '1';
        }
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('new-post-modal').classList.remove('hidden');
    },

    async submitNewPost(e) {
        e.preventDefault();
        const payload = {
            category: document.getElementById('post-category').value,
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-content').value,
        };
        try {
            await APIService.createCommunityPost(payload);
            document.getElementById('new-post-modal').classList.add('hidden');
            UI.showToast('Posted!', 'success');
            this.loadFeed();
        } catch (e) {
            UI.showToast('Could not publish post', 'error');
        }
    },
};
window.Community = Community;
