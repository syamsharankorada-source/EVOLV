/**
 * KANG Voice Controller (Simplified)
 * - Deep rugged bass voice engine with Telugu, Hindi & English support
 * - Speech synthesis (TTS) for KANG responses
 * - Status badge emotion updates
 * - No canvas animation, no lip-sync, no sub-bass rumble
 */
const KangAnimationController = {
    currentEmotion: 'idle',
    isSpeaking: false,
    isListening: false,
    isThinking: false,
    autoSpeak: true,

    // Voice Engine
    voicePitch: 0.58,   // Deep rugged masculine bass
    voiceRate: 0.88,    // Commanding, deliberate coach pacing

    /* ── Initialize ─────────────────────────────────────────── */
    init() {
        const saved = localStorage.getItem('kang_autospeak');
        this.autoSpeak = saved === null ? true : saved === 'true';
        this._updateAutoSpeakBtn();

        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        this.setEmotion('idle');
    },

    /* ── Voice Selection (Telugu / Hindi / English) ──────────── */
    _selectVoice(text) {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || !voices.length) return null;

        // 1. Detect Telugu script
        const isTelugu = /[\u0C00-\u0C7F]/.test(text) || (window.I18n && window.I18n.currentLang === 'te');
        if (isTelugu) {
            const teVoice = voices.find(v => v.lang === 'te-IN' || v.lang.startsWith('te') || /telugu/i.test(v.name));
            if (teVoice) return { voice: teVoice, lang: 'te-IN' };
        }

        // 2. Detect Hindi script
        const isHindi = /[\u0900-\u097F]/.test(text) || (window.I18n && window.I18n.currentLang === 'hi');
        if (isHindi) {
            const hiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi') || /hindi/i.test(v.name));
            if (hiVoice) return { voice: hiVoice, lang: 'hi-IN' };
        }

        // 3. English: Seek Indian male or deep male voice
        const enInMale = voices.find(v => (/en-IN/i.test(v.lang) || /india/i.test(v.name)) && /male|rishi|ravi|hemant/i.test(v.name));
        if (enInMale) return { voice: enInMale, lang: 'en-IN' };

        const enIn = voices.find(v => /en-IN/i.test(v.lang));
        if (enIn) return { voice: enIn, lang: 'en-IN' };

        const deepMale = voices.find(v => /male|george|david|daniel/i.test(v.name) && v.lang.startsWith('en'));
        if (deepMale) return { voice: deepMale, lang: 'en-US' };

        return { voice: voices[0], lang: 'en-IN' };
    },

    /* ── Speak text aloud in KANG's deep voice ──────────────── */
    speak(text, onEnd) {
        if (!text) return;
        this.isSpeaking = true;
        this.isThinking = false;
        this.setEmotion('speaking');

        const durationMs = Math.max(1600, text.length * 55);

        if (!this.autoSpeak || !('speechSynthesis' in window)) {
            setTimeout(() => {
                this.stopSpeaking();
                if (onEnd) onEnd();
            }, durationMs);
            return;
        }

        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        const match = this._selectVoice(text);
        if (match && match.voice) {
            utter.voice = match.voice;
            utter.lang = match.lang;
        }

        utter.pitch = this.voicePitch;
        utter.rate = this.voiceRate;
        utter.volume = 1.0;

        utter.onend = () => {
            this.stopSpeaking();
            if (onEnd) onEnd();
        };
        utter.onerror = () => {
            this.stopSpeaking();
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utter);

        // Fallback safety timeout
        setTimeout(() => {
            if (this.isSpeaking && !window.speechSynthesis.speaking) {
                this.stopSpeaking();
                if (onEnd) onEnd();
            }
        }, durationMs + 2000);
    },

    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.setEmotion('idle');
    },

    /* ── State & Emotion Management ──────────────────────────── */
    setEmotion(emotion) {
        this.currentEmotion = emotion;
        this.isThinking = (emotion === 'thinking');

        const badges = document.querySelectorAll('.kang-status-badge');
        const labels = {
            idle: '● KANG READY',
            listening: '🎙 LISTENING TO YOU…',
            thinking: '⚡ ANALYZING FITNESS QUERY…',
            speaking: '🔊 KANG SPEAKING…',
            motivating: '🔥 PUSH YOUR LIMITS!',
            flex: '💪 BEAST MODE ON',
            happy: '✓ EXCELLENT WORK',
            concerned: '⚠ FORM CHECK NEEDED'
        };

        badges.forEach(b => {
            b.textContent = labels[emotion] || `● ${emotion.toUpperCase()}`;
            if (emotion === 'listening') {
                b.className = 'kang-status-badge text-xs font-black tracking-widest text-red-400 animate-pulse';
            } else if (emotion === 'thinking') {
                b.className = 'kang-status-badge text-xs font-black tracking-widest text-cyan-400 animate-pulse';
            } else if (emotion === 'speaking') {
                b.className = 'kang-status-badge text-xs font-black tracking-widest text-amber-400';
            } else {
                b.className = 'kang-status-badge text-xs font-black tracking-widest text-emerald-400';
            }
        });
    },

    setListening(state) {
        this.isListening = state;
        this.setEmotion(state ? 'listening' : 'idle');
    },

    toggleAutoSpeak() {
        this.autoSpeak = !this.autoSpeak;
        localStorage.setItem('kang_autospeak', String(this.autoSpeak));
        this._updateAutoSpeakBtn();
        if (window.UI) {
            UI.showToast(this.autoSpeak ? '🔊 KANG Voice ON' : '🔇 KANG Voice Muted', 'info');
        }
    },

    _updateAutoSpeakBtn() {
        const btns = document.querySelectorAll('.kang-autospeak-toggle');
        btns.forEach(btn => {
            if (this.autoSpeak) {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
                btn.className = 'kang-autospeak-toggle w-10 h-10 rounded-xl bg-gray-800 border border-primary/50 text-primary flex items-center justify-center transition-all hover:scale-105';
                btn.title = 'KANG Voice ON — click to mute';
            } else {
                btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                btn.className = 'kang-autospeak-toggle w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-500 flex items-center justify-center transition-all hover:scale-105';
                btn.title = 'KANG Voice MUTED — click to enable';
            }
        });
    },

    // No-op stubs for backward compatibility
    playSubBassRumble() {},
    triggerVoiceSpeech(text) { this.speak(text); }
};

window.KangAnimationController = KangAnimationController;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => KangAnimationController.init(), 300);
});