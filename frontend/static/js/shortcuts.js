/**
 * EVOLV Keyboard Shortcuts System
 * Global and contextual keyboard navigation & control
 */
const Shortcuts = {
    isModalOpen: false,

    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    toggleModal(force) {
        const modal = document.getElementById('shortcuts-modal');
        if (!modal) return;
        // Determine desired open state:
        // - If force is explicitly passed (true/false), use it.
        // - Otherwise toggle: open if currently hidden, close if currently visible.
        if (force !== undefined) {
            this.isModalOpen = !!force;
        } else {
            this.isModalOpen = modal.classList.contains('hidden'); // hidden → open
        }
        if (this.isModalOpen) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    },

    handleKeyDown(e) {
        const key = e.key;
        const code = e.code;
        const activeEl = document.activeElement;
        const isInput = activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.isContentEditable
        );

        // 1. ESCAPE: always closes any open modal, even if focused inside an input
        if (key === 'Escape') {
            if (isInput) activeEl.blur();
            this.closeAllModals();
            return;
        }

        // 2. CONTEXTUAL: Inside Reaction Test Modal
        const reactionModal = document.getElementById('neuro-reaction-modal');
        if (reactionModal && !reactionModal.classList.contains('hidden')) {
            if (key === ' ' || code === 'Space' || key === 'Enter') {
                e.preventDefault();
                if (window.ReactionTest && typeof window.ReactionTest.triggerReaction === 'function') {
                    window.ReactionTest.triggerReaction();
                }
                return;
            }
        }

        // 3. CONTEXTUAL: Inside Active Workout Session Modal
        const workoutModal = document.getElementById('workout-session-modal');
        if (workoutModal && !workoutModal.classList.contains('hidden')) {
            if (key === ' ' || code === 'Space') {
                e.preventDefault();
                if (window.app && typeof window.app.toggleWorkoutTimer === 'function') {
                    window.app.toggleWorkoutTimer();
                }
                return;
            }
            if (key === 'Enter' || key === 'ArrowRight') {
                e.preventDefault();
                if (window.app && typeof window.app.nextExercise === 'function') {
                    window.app.nextExercise();
                }
                return;
            }
            if ((key === 'f' || key === 'F') && !isInput) {
                e.preventDefault();
                if (window.app && typeof window.app.openFormCorrector === 'function') {
                    window.app.openFormCorrector();
                }
                return;
            }
        }

        // 4. IGNORE single-character shortcuts if the user is typing in a form input
        if (isInput) return;

        // 5. Help Modal: '?' or Shift + '/'
        if (key === '?' || (e.shiftKey && key === '/')) {
            e.preventDefault();
            this.toggleModal();
            return;
        }

        // If shortcuts modal is open, ignore other single-key actions
        if (this.isModalOpen) return;

        // 6. Global Navigation & Action Shortcuts
        const lowerKey = key.toLowerCase();
        switch (lowerKey) {
            // Navigation
            case 'd':
            case '1':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('dashboard');
                }
                break;
            case 'k':
            case '2':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('ai-coach');
                }
                break;
            case 'n':
            case '3':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('neuro');
                }
                break;
            case 'w':
            case '4':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('workouts');
                }
                break;
            case 'u':
            case '5':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('nutrition');
                }
                break;
            case 'c':
            case '6':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('community');
                }
                break;
            case 'p':
            case '7':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('progress');
                }
                break;
            case 'v':
            case '9':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('vibe');
                }
                break;
            case 's':
            case '8':
                if (window.app && window.app.user && window.app.user.name) {
                    UI.navigate('settings');
                }
                break;

            // Global Quick Actions
            case 'x':
                if (window.app && window.app.user && window.app.user.name) {
                    if (typeof window.app.startActiveWorkout === 'function') {
                        window.app.startActiveWorkout();
                    }
                }
                break;
            case 'r':
                if (window.app && window.app.user && window.app.user.name) {
                    if (window.app.currentView !== 'neuro') {
                        UI.navigate('neuro');
                    }
                    if (window.ReactionTest && typeof window.ReactionTest.start === 'function') {
                        window.ReactionTest.start();
                    }
                }
                break;
            case 'y':
                if (window.app && window.app.user && window.app.user.name) {
                    if (typeof window.app.syncSmartwatch === 'function') {
                        window.app.syncSmartwatch();
                    }
                }
                break;
        }
    },

    closeAllModals() {
        this.toggleModal(false);

        const reactionModal = document.getElementById('neuro-reaction-modal');
        if (reactionModal && !reactionModal.classList.contains('hidden')) {
            if (window.ReactionTest && typeof window.ReactionTest.close === 'function') {
                window.ReactionTest.close();
            }
        }

        const authModal = document.getElementById('auth-modal');
        if (authModal && !authModal.classList.contains('hidden')) {
            if (window.app && typeof window.app.closeAuth === 'function') {
                window.app.closeAuth();
            }
        }

        const formModal = document.getElementById('form-corrector-modal');
        if (formModal && !formModal.classList.contains('hidden')) {
            if (window.app && typeof window.app.closeFormCorrector === 'function') {
                window.app.closeFormCorrector();
            }
        }

        const scannerModal = document.getElementById('scanner-modal');
        if (scannerModal && !scannerModal.classList.contains('hidden')) {
            if (window.UI && typeof window.UI.closeScanner === 'function') {
                window.UI.closeScanner();
            }
        }

        const workoutModal = document.getElementById('workout-session-modal');
        if (workoutModal && !workoutModal.classList.contains('hidden')) {
            if (window.app && typeof window.app.closeWorkoutSession === 'function') {
                window.app.closeWorkoutSession();
            }
        }

        const feedbackModal = document.getElementById('workout-feedback-modal');
        if (feedbackModal && !feedbackModal.classList.contains('hidden')) {
            feedbackModal.classList.add('hidden');
        }

        const wearableModal = document.getElementById('wearable-modal');
        if (wearableModal && !wearableModal.classList.contains('hidden')) {
            if (window.Wearable && typeof window.Wearable.closeModal === 'function') {
                window.Wearable.closeModal();
            }
        }
    }
};

window.Shortcuts = Shortcuts;
document.addEventListener('DOMContentLoaded', () => Shortcuts.init());

