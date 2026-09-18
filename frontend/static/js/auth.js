const Auth = {
    authPhone: '',
    
    open() {
        document.getElementById('auth-modal').classList.remove('hidden');
        document.getElementById('auth-step-1').classList.remove('hidden');
        document.getElementById('auth-step-2').classList.add('hidden');
    },
    
    close() { 
        document.getElementById('auth-modal').classList.add('hidden'); 
    },
    
    async sendOTP() {
        const phone = document.getElementById('auth-identifier').value;
        if (!phone) return UI.showToast('Enter phone number', 'error');
        try {
            const res = await APIService.requestOtp(phone);
            this.authPhone = phone;
            document.getElementById('auth-step-1').classList.add('hidden');
            document.getElementById('auth-step-2').classList.remove('hidden');
            UI.showToast(res.dev_otp ? `Dev OTP: ${res.dev_otp}` : 'OTP Sent', 'success');
        } catch (e) { 
            UI.showToast(e.message, 'error'); 
        }
    },
    
    async verifyOTP() {
        const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
        if (otp.length !== 4) return UI.showToast('Enter full OTP', 'error');
        try {
            const res = await APIService.verifyOtp(this.authPhone, otp);
            app.user = res.data;
            this.close();
            UI.showToast('Login Successful', 'success');
            if (app.user.is_onboarded) { 
                UI.navigate('dashboard'); 
            } else { 
                app.startOnboarding(); 
            }
            UI.updateNav();
        } catch (e) { 
            UI.showToast(e.message, 'error'); 
        }
    },

    async guestLogin() {
        try {
            const res = await APIService.guestLogin();
            if (!res || !res.success) {
                return UI.showToast('Could not start guest session', 'error');
            }
            app.user = res.data;
            this.close();
            UI.showToast("You're browsing as a guest — sign up anytime to save your progress", 'info');
            UI.navigate('dashboard');
            UI.updateNav();
        } catch (e) {
            UI.showToast('Could not start guest session', 'error');
        }
    },
    
    async logout() {
        try {
            await APIService.logout();
            app.user = null;
            UI.updateNav();
            UI.navigate('landing');
            UI.showToast('Logged out successfully', 'success');
        } catch (e) { 
            app.user = null;
            UI.updateNav();
            UI.navigate('landing');
            UI.showToast('Logged out', 'info'); 
        }
    }
};
window.Auth = Auth;