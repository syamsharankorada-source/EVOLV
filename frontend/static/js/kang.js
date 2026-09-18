const Kang = {
    isSending: false,
    isListening: false,
    recognition: null,
    voiceLang: 'en-IN',
    currentSessionId: null,
    _pendingFile: null,   // { name, type, dataURL, text }
    
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    setVoiceLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
        this._updateLiveLangButtons();
        const names = { 'te-IN': 'తెలుగు (Telugu)', 'hi-IN': 'हिन्दी (Hindi)', 'en-IN': 'English (India)' };
        if (window.UI) {
            UI.showToast(`KANG voice set to ${names[lang] || lang}`, 'success');
        }
    },

    _updateLiveLangButtons() {
        const btns = document.querySelectorAll('.kang-lang-btn');
        btns.forEach(b => {
            const l = b.getAttribute('data-lang');
            if (l === this.voiceLang) {
                b.className = 'kang-lang-btn px-3 py-1 rounded-lg text-xs font-black bg-primary text-dark border border-primary';
            } else {
                b.className = 'kang-lang-btn px-3 py-1 rounded-lg text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700 hover:text-white';
            }
        });
    },

    async send(text) {
        const input = document.getElementById('chat-user-input');
        const msg = (text !== undefined ? text : input ? input.value.trim() : '');
        if (!msg && !this._pendingFile) return;
        if (this.isSending) return;

        if (text === undefined && input) input.value = '';

        // Build display message (include file info if attached)
        let displayMsg = msg || '';
        let apiMsg = msg || '';

        if (this._pendingFile) {
            const f = this._pendingFile;
            // Show file bubble in chat
            this._appendFileBubble('user', f);
            // For text/PDF files, append content to API message
            if (f.text) {
                apiMsg += `\n\n[Attached file: ${f.name}]\n${f.text.slice(0, 1500)}`;
            } else if (f.dataURL && f.type.startsWith('image/')) {
                apiMsg += `\n\n[Attached image: ${f.name}]`;
            }
            // Clear pending file
            this._pendingFile = null;
            this._clearFilePreview();
        }

        if (displayMsg) this.appendMessage('user', displayMsg);

        this.isSending = true;
        this.setTyping(true);
        this.showTypingBubble();

        try {
            const res = await APIService.sendKangMsg(apiMsg, this.currentSessionId);

            let replyText = "Let's stay consistent with your goals!";
            let emotion = 'focused';
            if (res) {
                if (res.reply) replyText = res.reply;
                else if (res.data && res.data.reply) replyText = res.data.reply;
                else if (typeof res === 'string') replyText = res;
                if (res.emotion) emotion = res.emotion;
                else if (res.data && res.data.emotion) emotion = res.data.emotion;
                if (res.session_id) this.currentSessionId = res.session_id;
            }

            this.hideTypingBubble();
            this.appendMessage('kang', replyText);

            if (window.KangAnimationController) {
                KangAnimationController.setEmotion(emotion);
            }
        } catch (e) {
            console.error('KANG chat error:', e);
            this.hideTypingBubble();
            this.appendMessage('kang', "Grrr! Network glitch. Let's crush our workout anyway!");
        } finally {
            this.isSending = false;
            this.setTyping(false);
        }
    },

    // Alias so quick-prompt buttons work the same way
    quickPrompt(message) { this.send(message); },



    // --- Loading / "KANG is thinking" bubble shown inline in the chat ---
    showTypingBubble() {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;
        this.hideTypingBubble(); // avoid duplicates

        const bubble = document.createElement('div');
        bubble.id = 'kang-typing-bubble';
        bubble.className = 'flex justify-start mb-4';
        bubble.innerHTML = `
            <div class="max-w-[80%] rounded-2xl px-5 py-3.5 shadow-lg bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-none">
                <span class="text-[10px] font-black text-primary uppercase block mb-1">KANG</span>
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <span>Thinking</span>
                    <span class="flex gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style="animation-delay:0ms"></span>
                        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style="animation-delay:150ms"></span>
                        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style="animation-delay:300ms"></span>
                    </span>
                </div>
            </div>`;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    },

    hideTypingBubble() {
        const bubble = document.getElementById('kang-typing-bubble');
        if (bubble) bubble.remove();
    },

    // --- Chat sessions: New Chat / Previous Chats ---
    newChat() {
        const container = document.getElementById('chat-messages-container');
        if (container) container.innerHTML = '';
        this.currentSessionId = null; // next message will create a fresh session
        this.hideSessionsDropdown();
        if (window.UI) UI.showToast('Started a new chat', 'info');
    },

    async toggleSessionsDropdown() {
        const dropdown = document.getElementById('kang-sessions-dropdown');
        if (!dropdown) return;
        const opening = dropdown.classList.contains('hidden');
        if (!opening) {
            dropdown.classList.add('hidden');
            return;
        }
        dropdown.classList.remove('hidden');
        dropdown.innerHTML = '<p class="text-xs text-gray-500 p-3">Loading…</p>';

        try {
            const res = await APIService.getKangSessions();
            const sessions = (res && res.sessions) || [];
            if (!sessions.length) {
                dropdown.innerHTML = '<p class="text-xs text-gray-500 p-3">No previous chats yet</p>';
                return;
            }
            dropdown.innerHTML = sessions.map(s => `
                <button onclick="Kang.loadSession(${s.id})" class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-all">
                    <p class="text-sm text-white font-bold truncate">${this.escapeHtml(s.title)}</p>
                    <p class="text-[10px] text-gray-500">${new Date(s.updated_at).toLocaleString()}</p>
                </button>
            `).join('');
        } catch (e) {
            dropdown.innerHTML = '<p class="text-xs text-red-400 p-3">Could not load chats</p>';
        }
    },

    hideSessionsDropdown() {
        const dropdown = document.getElementById('kang-sessions-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    },

    async loadSession(sessionId) {
        const container = document.getElementById('chat-messages-container');
        this.hideSessionsDropdown();
        try {
            const res = await APIService.getKangSessionMessages(sessionId);
            if (!res || !res.success) {
                if (window.UI) UI.showToast('Could not load that chat', 'error');
                return;
            }
            if (container) container.innerHTML = '';
            (res.messages || []).forEach(m => {
                this.appendMessage('user', m.user_message);
                this.appendMessage('kang', m.kang_reply);
            });
            this.currentSessionId = sessionId;
        } catch (e) {
            if (window.UI) UI.showToast('Could not load that chat', 'error');
        }
    },

    async clearHistory() {
        const container = document.getElementById('chat-messages-container');
        try {
            await APIService.clearChat();
        } catch (e) {
            console.error('KANG clear history error:', e);
        }
        if (container) container.innerHTML = '';
        this.currentSessionId = null;
    },

    // --- Voice Input (Speech-to-Text) System ---
    setListeningState(isListening) {
        this.isListening = isListening;
        const btn    = document.getElementById('kang-mic-btn');
        const icon   = document.getElementById('kang-mic-icon');
        const pulse  = document.getElementById('kang-mic-pulse');
        const status = document.getElementById('kang-mic-status');

        if (isListening) {
            if (btn) {
                btn.classList.remove('bg-gray-800', 'hover:bg-gray-700', 'border-gray-700', 'text-white');
                btn.classList.add('bg-red-500', 'hover:bg-red-600', 'border-red-400', 'text-white', 'shadow-[0_0_15px_rgba(239,68,68,0.5)]');
                btn.setAttribute('title', 'Listening... Click to cancel');
            }
            if (pulse) pulse.classList.remove('hidden');
            if (status) status.classList.remove('hidden');
            this.setTyping(true, 'Listening...');
            if (window.KangAnimationController) KangAnimationController.setListening(true);
        } else {
            if (btn) {
                btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'border-red-400', 'shadow-[0_0_15px_rgba(239,68,68,0.5)]');
                btn.classList.add('bg-gray-800', 'hover:bg-gray-700', 'border-gray-700', 'text-white');
                btn.setAttribute('title', 'Click to speak');
            }
            if (pulse) pulse.classList.add('hidden');
            if (status) status.classList.add('hidden');
            this.setTyping(false);
            if (window.KangAnimationController) KangAnimationController.setListening(false);
        }
    },

    stopVoice() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('Speech recognition stop error:', e);
            }
        }
        this.setListeningState(false);
    },

    startVoice() {
        // If already listening, clicking again stops listening gracefully
        if (this.isListening) {
            this.stopVoice();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const msg = "Voice input isn't supported in this browser. Try Chrome or Edge.";
            if (window.UI && UI.showToast) {
                UI.showToast(msg, 'error');
            } else {
                alert(msg);
            }
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            this.recognition = recognition;
            recognition.lang = this.voiceLang || 'en-IN';
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            let finalTranscript = '';
            const input = document.getElementById('chat-user-input');

            recognition.onstart = () => {
                this.setListeningState(true);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPiece;
                    } else {
                        interimTranscript += transcriptPiece;
                    }
                }

                const currentText = finalTranscript || interimTranscript;

                // Display live speech text in the standard KANG input field
                if (input) {
                    input.value = currentText;
                }
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition event error:', event.error);
                this.setListeningState(false);

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    if (window.UI && UI.showToast) {
                        UI.showToast('Microphone permission is required for voice input.', 'error');
                    }
                } else if (event.error === 'no-speech') {
                    // Graceful stop with no speech detected
                } else if (event.error === 'network') {
                    if (window.UI && UI.showToast) {
                        UI.showToast('Speech recognition network error. Please try again.', 'error');
                    }
                } else if (event.error !== 'aborted') {
                    if (window.UI && UI.showToast) {
                        UI.showToast(`Voice input error: ${event.error}`, 'info');
                    }
                }
            };

            recognition.onend = () => {
                this.setListeningState(false);
                const textToSend = finalTranscript.trim() || (input ? input.value.trim() : '');
                if (textToSend) {
                    // Automatically submit recognized voice message through existing KANG chat flow
                    this.send(textToSend);
                }
            };

            recognition.start();
        } catch (err) {
            console.error('Failed to initialize speech recognition:', err);
            this.setListeningState(false);
            if (window.UI && UI.showToast) {
                UI.showToast('Could not start voice recognition. Please try again.', 'error');
            }
        }
    },

    /* ─────────────────────────────────────────────────────────────
     *  FILE ATTACHMENT
     * ───────────────────────────────────────────────────────────── */
    openFilePicker() {
        const el = document.getElementById('kang-file-input');
        if (el) el.click();
    },

    handleFileAttach(inputEl) {
        const file = inputEl.files && inputEl.files[0];
        inputEl.value = '';   // reset so same file can be re-picked
        if (!file) return;

        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB cap
        if (file.size > MAX_SIZE) {
            if (window.UI) UI.showToast('File too large (max 10 MB)', 'error');
            return;
        }

        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        const isText  = file.type.startsWith('text/') || /\.(txt|md|csv|json|js|py|html|css)$/i.test(file.name);

        reader.onload = (e) => {
            const dataURL = e.target.result;
            const pending = { name: file.name, type: file.type, dataURL };
            if (isText) {
                // Decode text for API context
                pending.text = typeof dataURL === 'string' ? dataURL : new TextDecoder().decode(e.target.result);
            }
            this._pendingFile = pending;
            this._showFilePreview(pending, isImage);
        };

        if (isImage) {
            reader.readAsDataURL(file);
        } else if (isText) {
            reader.readAsText(file);
        } else {
            // Binary (PDF etc.) — just show name
            this._pendingFile = { name: file.name, type: file.type, dataURL: null };
            this._showFilePreview(this._pendingFile, false);
        }
    },

    _showFilePreview(f, isImage) {
        const zone = document.getElementById('kang-file-preview');
        if (!zone) return;
        zone.classList.remove('hidden');
        if (isImage) {
            zone.innerHTML = `
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl max-w-xs">
                    <img src="${f.dataURL}" class="w-10 h-10 rounded-lg object-cover border border-gray-600" alt="${this.escapeHtml(f.name)}">
                    <span class="text-xs text-gray-300 font-medium truncate flex-1">${this.escapeHtml(f.name)}</span>
                    <button onclick="Kang._clearFilePreview()" class="text-gray-500 hover:text-red-400 transition-colors ml-1"><i class="fas fa-times"></i></button>
                </div>`;
        } else {
            zone.innerHTML = `
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl max-w-xs">
                    <i class="fas fa-paperclip text-primary"></i>
                    <span class="text-xs text-gray-300 font-medium truncate flex-1">${this.escapeHtml(f.name)}</span>
                    <button onclick="Kang._clearFilePreview()" class="text-gray-500 hover:text-red-400 transition-colors ml-1"><i class="fas fa-times"></i></button>
                </div>`;
        }
    },

    _clearFilePreview() {
        this._pendingFile = null;
        const zone = document.getElementById('kang-file-preview');
        if (zone) { zone.innerHTML = ''; zone.classList.add('hidden'); }
    },

    _appendFileBubble(sender, f) {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;
        const isImage = f.type && f.type.startsWith('image/');
        const bubble  = document.createElement('div');
        bubble.className = 'flex justify-end mb-1';
        if (isImage && f.dataURL) {
            bubble.innerHTML = `
                <div class="max-w-[60%] rounded-2xl overflow-hidden border border-primary/30 shadow-lg">
                    <img src="${f.dataURL}" class="w-full object-cover" alt="${this.escapeHtml(f.name)}">
                    <p class="text-[10px] text-dark/60 text-right px-3 py-1 bg-primary">${this.escapeHtml(f.name)}</p>
                </div>`;
        } else {
            bubble.innerHTML = `
                <div class="flex items-center gap-2 px-4 py-3 bg-primary text-dark rounded-2xl rounded-br-none shadow-lg">
                    <i class="fas fa-paperclip"></i>
                    <span class="text-sm font-bold">${this.escapeHtml(f.name)}</span>
                </div>`;
        }
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    },

    appendMessage(sender, text) {
        const container = document.getElementById('chat-messages-container');
        if (!container) return;

        const isUser = sender === 'user';
        const bubble = document.createElement('div');
        bubble.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;

        // Preserve real line breaks from the backend (pre-line) and escape user-provided text
        bubble.innerHTML = `
            <div class="max-w-[80%] rounded-2xl px-5 py-3.5 shadow-lg ${isUser ? 'bg-primary text-dark rounded-br-none' : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-none'}">
                ${!isUser ? '<span class="text-[10px] font-black text-primary uppercase block mb-1">KANG</span>' : ''}
                <p class="text-sm leading-relaxed" style="white-space: pre-line;">${this.escapeHtml(text)}</p>
            </div>`;

        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    },

    setTyping(isTyping, label) {
        const statusEl = document.getElementById('kang-status');
        if (statusEl) {
            statusEl.innerText = isTyping ? (label || 'Thinking...') : 'Ready';
        }
        if (window.KangAnimationController) {
            KangAnimationController.setEmotion(isTyping ? 'thinking' : 'idle');
        }
    },

    // Called when the AI Coach view opens. Deliberately does NOT auto-load the
    // last conversation into view — item #10 wants a fresh chat every visit,
    // with old chats reachable only via "Previous Chats".
    async loadHistory() {
        const container = document.getElementById('chat-messages-container');
        if (container && !container.dataset.kangInit) {
            container.innerHTML = '';
            container.dataset.kangInit = '1';
        }
    }
};

window.Kang = Kang;
