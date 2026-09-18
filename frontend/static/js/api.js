const APIService = {
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCookie('csrftoken') || '',
            ...options.headers
        };

        try {
            const response = await fetch(endpoint, { 
                ...options, 
                headers,
                credentials: 'same-origin'
            });
            
            const text = await response.text();
            let data = null;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (!response.ok) {
                    return { success: false, message: `Server error (${response.status})`, data: null };
                }
                return { success: true, data: {} };
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    return { success: false, message: 'Not authenticated', data: null };
                }
                return data && typeof data === 'object' ? data : { success: false, message: `Request failed with status ${response.status}`, data: null };
            }
            return data;
            
        } catch (err) {
            console.error('API Request Error:', err);
            return { success: false, message: 'Network or server error', data: null };
        }
    },

    requestOtp: (phone) => APIService.request('/api/auth/request-otp/', { method: 'POST', body: JSON.stringify({ phone }) }),
    verifyOtp: (phone, otp, name) => APIService.request('/api/auth/verify-otp/', { method: 'POST', body: JSON.stringify({ phone, otp, name }) }),
    guestLogin: () => APIService.request('/api/auth/guest/', { method: 'POST' }),
    logout: () => APIService.request('/api/auth/logout/', { method: 'POST' }),
    getMe: () => APIService.request('/api/auth/me/', { method: 'GET' }),
    getProfile: () => APIService.request('/api/profile/', { method: 'GET' }),
    updateProfile: (data) => APIService.request('/api/profile/', { method: 'PUT', body: JSON.stringify(data) }),
    onboard: (data) => APIService.request('/api/profile/onboarding/', { method: 'POST', body: JSON.stringify(data) }),
    sendKangMsg: (message, sessionId) => APIService.request('/api/kang/chat/', { method: 'POST', body: JSON.stringify({ message, session_id: sessionId || null }) }),
    analyzeForm: (image, exercise, reps, posture, sessionId) => APIService.request('/api/kang/analyze-form/', { method: 'POST', body: JSON.stringify({ image, exercise, reps, posture, session_id: sessionId || null }) }),
    getChatHistory: () => APIService.request('/api/kang/history/', { method: 'GET' }),
    clearChat: () => APIService.request('/api/kang/history/', { method: 'DELETE' }),
    getKangSessions: () => APIService.request('/api/kang/sessions/', { method: 'GET' }),

    getCoaches: (specialty) => APIService.request(`/api/community/coaches/${specialty ? '?specialty=' + encodeURIComponent(specialty) : ''}`, { method: 'GET' }),
    getMyCoachProfile: () => APIService.request('/api/community/coaches/me/', { method: 'GET' }),
    becomeCoach: (payload) => APIService.request('/api/community/coaches/become/', { method: 'POST', body: JSON.stringify(payload) }),
    getCommunityPosts: (category) => APIService.request(`/api/community/posts/${category ? '?category=' + encodeURIComponent(category) : ''}`, { method: 'GET' }),
    createCommunityPost: (payload) => APIService.request('/api/community/posts/create/', { method: 'POST', body: JSON.stringify(payload) }),
    sendHireRequest: (payload) => APIService.request('/api/community/hire/', { method: 'POST', body: JSON.stringify(payload) }),
    getMyHireRequests: () => APIService.request('/api/community/hire/mine/', { method: 'GET' }),
    newKangSession: () => APIService.request('/api/kang/sessions/new/', { method: 'POST' }),
    getKangSessionMessages: (sessionId) => APIService.request(`/api/kang/sessions/${sessionId}/`, { method: 'GET' }),
    deleteKangSession: (sessionId) => APIService.request(`/api/kang/sessions/${sessionId}/`, { method: 'DELETE' }),
    getWorkoutPlan: () => APIService.request('/api/fitness/workout-plan/', { method: 'GET' }),
    logWorkout: (data) => APIService.request('/api/fitness/workouts/', { method: 'POST', body: JSON.stringify(data) }),
    getNutritionPlan: () => APIService.request('/api/nutrition/plan/', { method: 'GET' }),
    scanMeal: (image) => APIService.request('/api/nutrition/scan-meal/', { method: 'POST', body: JSON.stringify({ image }) }),
    getNutritionToday: () => APIService.request('/api/nutrition/today/', { method: 'GET' }),
    getRecipe: (dishName) => APIService.request('/api/nutrition/recipe/', { method: 'POST', body: JSON.stringify({ dish_name: dishName }) }),
    getProgress: () => APIService.request('/api/fitness/progress/', { method: 'GET' }),
    getBadges: () => APIService.request('/api/fitness/badges/', { method: 'GET' }),
    getLeaderboard: () => APIService.request('/api/fitness/leaderboard/', { method: 'GET' }),
    getWellness: () => APIService.request('/api/wellness/today/', { method: 'GET' }),
    syncBand: (data) => APIService.request('/api/wellness/sync/', { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
    getWellnessHistory: () => APIService.request('/api/wellness/history/', { method: 'GET' }),
    getWellnessAssessment: () => APIService.request('/api/wellness/assessment/', { method: 'GET' }),
    neuroCheckIn: (data) => APIService.request('/api/neuro/check-in/', { method: 'POST', body: JSON.stringify(data) }),
    neuroSubmitReaction: (data) => APIService.request('/api/neuro/reaction-test/', { method: 'POST', body: JSON.stringify(data) }),
    neuroToday: () => APIService.request('/api/neuro/today/', { method: 'GET' }),
    neuroHistory: (days) => APIService.request(`/api/neuro/history/?days=${days || 14}`, { method: 'GET' }),
    neuroBaseline: () => APIService.request('/api/neuro/baseline/', { method: 'GET' }),
    neuroRecommendation: () => APIService.request('/api/neuro/recommendation/', { method: 'GET' }),
    neuroLogOutcome: (data) => APIService.request('/api/neuro/workout-outcome/', { method: 'POST', body: JSON.stringify(data) }),
    neuroAnalytics: () => APIService.request('/api/neuro/analytics/', { method: 'GET' }),
};

window.APIService = APIService;
