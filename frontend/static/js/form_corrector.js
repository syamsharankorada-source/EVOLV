/*
 * Live AI Form Corrector — client-side pose tracking via MediaPipe Tasks Vision
 * (PoseLandmarker), running entirely in the browser off the webcam. No API key,
 * no per-frame cost. Counts reps from joint angles and flags posture issues,
 * the same technique commercial "AI rep counter" tools use under the hood.
 *
 * A snapshot + the tracker's own readout can optionally be sent to KANG (Groq
 * vision model) for a one-off qualitative coaching note — that part does use
 * the Groq key, but only when the user taps "Ask KANG", not per-frame.
 */
const FormCorrector = {
    landmarker: null,
    stream: null,
    running: false,
    rafId: null,
    reps: 0,
    stage: null, // 'extended' | 'contracted'
    exercise: 'pushup',
    lastAngle: null,
    smoothedAngle: null,    // EMA-smoothed angle, used for stage detection so a single
                             // noisy frame can't flip the count but a fast real rep still registers
    lastPosture: 'Good Posture',
    lastLandmarks: null,
    repHadBadForm: false,   // was posture bad at any point during the current rep?
    pendingStage: null,     // debounce: candidate stage waiting to be confirmed
    pendingFrames: 0,
    CONFIRM_FRAMES: 2,      // consecutive frames needed before a stage change counts
    SMOOTHING_ALPHA: 0.45,  // EMA weight for the newest reading (higher = more responsive)
    VISIBILITY_MIN: 0.4,

    EXERCISES: {
        pushup: {
            label: 'Push-up',
            angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
            postureJoints: ['left_shoulder', 'left_hip', 'left_knee'],
            contractedBelow: 100,   // elbow bent = down position
            extendedAbove: 155,     // elbow straight = up position
            postureMin: 150,        // hips should stay roughly in line with shoulders/knees
            postureLabel: 'Hips sagging — brace your core',
        },
        squat: {
            label: 'Squat',
            angleJoints: ['left_hip', 'left_knee', 'left_ankle'],
            postureJoints: ['left_shoulder', 'left_hip', 'left_knee'],
            contractedBelow: 100,
            extendedAbove: 160,
            postureMin: 130,
            postureLabel: 'Leaning too far forward — keep chest up',
        },
        bicep_curl: {
            label: 'Bicep Curl',
            angleJoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
            postureJoints: null,
            contractedBelow: 60,   // curled up
            extendedAbove: 150,    // arm extended
            postureMin: null,
            postureLabel: null,
        },
        lunge: {
            label: 'Lunge',
            angleJoints: ['left_hip', 'left_knee', 'left_ankle'],
            postureJoints: ['left_shoulder', 'left_hip', 'left_knee'],
            contractedBelow: 110,   // front knee bent = down position
            extendedAbove: 160,     // standing tall
            postureMin: 150,
            postureLabel: 'Leaning too far forward — keep chest up',
        },
        shoulder_press: {
            label: 'Shoulder Press',
            angleJoints: ['left_hip', 'left_shoulder', 'left_elbow'],
            postureJoints: null,
            contractedBelow: 95,    // elbows down near shoulder level
            extendedAbove: 160,     // arms pressed overhead
            postureMin: null,
            postureLabel: null,
        },
        situp: {
            label: 'Sit-up',
            angleJoints: ['left_shoulder', 'left_hip', 'left_knee'],
            postureJoints: null,
            contractedBelow: 90,    // curled up towards knees
            extendedAbove: 150,     // lying back flat
            postureMin: null,
            postureLabel: null,
        },
    },

    LANDMARK_NAMES: {
        left_shoulder: 11, right_shoulder: 12,
        left_elbow: 13, right_elbow: 14,
        left_wrist: 15, right_wrist: 16,
        left_hip: 23, right_hip: 24,
        left_knee: 25, right_knee: 26,
        left_ankle: 27, right_ankle: 28,
    },

    CONNECTIONS: [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
    ],

    // Best-effort match from a workout plan's exercise name (e.g. "Barbell Lunges",
    // "Overhead Shoulder Press") to one of our tracked exercise keys.
    matchExerciseFromName(name) {
        if (!name) return null;
        const n = name.toLowerCase();
        if (n.includes('push')) return 'pushup';
        if (n.includes('squat')) return 'squat';
        if (n.includes('curl')) return 'bicep_curl';
        if (n.includes('lunge')) return 'lunge';
        if (n.includes('press') && n.includes('should')) return 'shoulder_press';
        if (n.includes('press') && (n.includes('overhead') || n.includes('military'))) return 'shoulder_press';
        if (n.includes('sit-up') || n.includes('situp') || n.includes('crunch')) return 'situp';
        return null;
    },

    async open(exerciseNameHint = null) {
        const modal = document.getElementById('form-corrector-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.reps = 0;
        this.stage = null;

        const select = document.getElementById('fc-exercise-select');
        const matched = this.matchExerciseFromName(exerciseNameHint);
        if (matched && select) select.value = matched;

        this.updateExercise(select?.value || matched || 'pushup');
        this.updateHudDom();

        try {
            await this.initLandmarker();
            await this.startCamera();
            this.running = true;
            this.loop();
        } catch (e) {
            console.error('Form Corrector init error:', e);
            const errEl = document.getElementById('fc-error');
            if (errEl) {
                errEl.classList.remove('hidden');
                errEl.innerText = e.name === 'NotAllowedError'
                    ? 'Camera permission was denied. Please allow camera access and try again.'
                    : 'Could not start the form corrector. Please try again.';
            }
        }
    },

    close() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        const modal = document.getElementById('form-corrector-modal');
        if (modal) modal.classList.add('hidden');
        const errEl = document.getElementById('fc-error');
        if (errEl) errEl.classList.add('hidden');
    },

    updateExercise(key) {
        this.exercise = this.EXERCISES[key] ? key : 'pushup';
        this.reps = 0;
        this.stage = null;
        this.smoothedAngle = null;
        this.repHadBadForm = false;
        this.pendingStage = null;
        this.pendingFrames = 0;
        this.updateHudDom();
    },

    async initLandmarker() {
        if (this.landmarker) return;
        const { PoseLandmarker, FilesetResolver } = await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
        );
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
        });
    },

    async startCamera() {
        const video = document.getElementById('fc-video');
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.srcObject = this.stream;
        await video.play();

        const canvas = document.getElementById('fc-canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
    },

    angleBetween(a, b, c) {
        const ab = { x: a.x - b.x, y: a.y - b.y };
        const cb = { x: c.x - b.x, y: c.y - b.y };
        const dot = ab.x * cb.x + ab.y * cb.y;
        const magAB = Math.hypot(ab.x, ab.y);
        const magCB = Math.hypot(cb.x, cb.y);
        if (magAB === 0 || magCB === 0) return 0;
        const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
        return Math.acos(cos) * (180 / Math.PI);
    },

    loop() {
        if (!this.running) return;
        const video = document.getElementById('fc-video');
        const canvas = document.getElementById('fc-canvas');
        const ctx = canvas.getContext('2d');

        if (video.readyState >= 2 && this.landmarker) {
            const result = this.landmarker.detectForVideo(video, performance.now());
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (result.landmarks && result.landmarks.length > 0) {
                const lm = result.landmarks[0];
                this.lastLandmarks = lm;
                this.processPose(lm);
                this.drawSkeleton(ctx, lm, canvas.width, canvas.height);
            }
        }

        this.rafId = requestAnimationFrame(() => this.loop());
    },

    // Reads a joint by name, falling back to the mirrored (right/left) side if the
    // requested side isn't visible enough — e.g. the person is angled so their
    // left side is partially hidden from camera but their right side is clear.
    getVisibleJoint(lm, name) {
        const P = this.LANDMARK_NAMES;
        const primary = lm[P[name]];
        if (primary && (typeof primary.visibility !== 'number' || primary.visibility >= this.VISIBILITY_MIN)) {
            return primary;
        }
        const mirrorName = name.startsWith('left_') ? name.replace('left_', 'right_') : name.replace('right_', 'left_');
        const mirrored = lm[P[mirrorName]];
        if (mirrored && (typeof mirrored.visibility !== 'number' || mirrored.visibility >= this.VISIBILITY_MIN)) {
            return mirrored;
        }
        return primary; // return whatever we have; caller checks visibility again
    },

    processPose(lm) {
        const cfg = this.EXERCISES[this.exercise];
        const get = (name) => this.getVisibleJoint(lm, name);

        const [aName, bName, cName] = cfg.angleJoints;
        const jointsForAngle = [get(aName), get(bName), get(cName)];

        // Skip frames where neither side of the body gives us confident joints —
        // this (plus the debounce below) is what was causing the rep count to
        // shoot up wildly, or freeze entirely, on noisy/dark video or off-angle framing.
        const lowConfidence = jointsForAngle.some(p => !p || (typeof p.visibility === 'number' && p.visibility < this.VISIBILITY_MIN));
        if (lowConfidence) return;

        const rawAngle = this.angleBetween(...jointsForAngle);
        this.lastAngle = Math.round(rawAngle * 10) / 10;

        // Smooth the angle with an exponential moving average so a single jittery
        // frame can't cross a threshold on its own, while still reacting fast
        // enough to catch quick reps (unlike relying on many raw-frame confirms).
        this.smoothedAngle = this.smoothedAngle === null
            ? rawAngle
            : (this.SMOOTHING_ALPHA * rawAngle) + ((1 - this.SMOOTHING_ALPHA) * this.smoothedAngle);
        const angle = this.smoothedAngle;

        // Posture check (only for exercises with a defined posture track)
        if (cfg.postureJoints) {
            const [pa, pb, pc] = cfg.postureJoints;
            const postureJoints = [get(pa), get(pb), get(pc)];
            if (postureJoints.every(Boolean)) {
                const postureAngle = this.angleBetween(...postureJoints);
                this.lastPosture = postureAngle >= cfg.postureMin ? 'Good Posture' : cfg.postureLabel;
            }
        } else {
            this.lastPosture = 'Good Posture';
        }
        if (this.lastPosture !== 'Good Posture') this.repHadBadForm = true;

        // What state does the CURRENT (smoothed) frame suggest?
        let candidateStage = this.stage;
        if (angle > cfg.extendedAbove) candidateStage = 'extended';
        else if (angle < cfg.contractedBelow) candidateStage = 'contracted';

        if (this.stage === null) {
            this.stage = candidateStage;
            this.pendingStage = null;
            this.pendingFrames = 0;
            this.updateHudDom();
            return;
        }

        if (candidateStage === this.stage) {
            // Steady state — clear any half-confirmed transition
            this.pendingStage = null;
            this.pendingFrames = 0;
            this.updateHudDom();
            return;
        }

        // Require several consecutive frames agreeing on the new stage before
        // it's accepted — a single noisy frame can no longer flip the count.
        if (candidateStage === this.pendingStage) {
            this.pendingFrames += 1;
        } else {
            this.pendingStage = candidateStage;
            this.pendingFrames = 1;
        }

        if (this.pendingFrames >= this.CONFIRM_FRAMES) {
            const wasContracted = this.stage === 'contracted';
            this.stage = this.pendingStage;
            this.pendingStage = null;
            this.pendingFrames = 0;

            if (wasContracted && this.stage === 'extended') {
                // Rep completed — only count it if form stayed good the whole way down and up
                if (!this.repHadBadForm) {
                    this.reps += 1;
                }
                this.repHadBadForm = false;
            }
        }

        this.updateHudDom();
    },

    drawSkeleton(ctx, lm, w, h) {
        ctx.strokeStyle = 'rgba(249,115,22,0.9)';
        ctx.lineWidth = 3;
        this.CONNECTIONS.forEach(([i, j]) => {
            const a = lm[i], b = lm[j];
            if (!a || !b) return;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
        });
        ctx.fillStyle = '#f97316';
        Object.values(this.LANDMARK_NAMES).forEach(idx => {
            const p = lm[idx];
            if (!p) return;
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    },

    updateHudDom() {
        const cfg = this.EXERCISES[this.exercise];
        const repsEl = document.getElementById('fc-dom-reps');
        const exEl = document.getElementById('fc-dom-exercise');
        const stageEl = document.getElementById('fc-dom-stage');
        const postureEl = document.getElementById('fc-dom-posture');

        if (repsEl) repsEl.innerText = this.reps;
        if (exEl) exEl.innerText = cfg.label;
        if (stageEl) stageEl.innerText = (this.stage || '—').toUpperCase();

        if (postureEl) {
            if (cfg.postureJoints) {
                const good = this.lastPosture === 'Good Posture';
                postureEl.innerText = this.lastPosture;
                postureEl.className = `text-sm font-black ${good ? 'text-emerald-400' : 'text-red-400'}`;
                postureEl.parentElement.classList.remove('hidden');
            } else {
                postureEl.parentElement.classList.add('hidden');
            }
        }
    },

    async askKang() {
        const canvas = document.getElementById('fc-canvas');
        const video = document.getElementById('fc-video');
        if (!canvas || !video) return;

        // Compose a snapshot: current video frame + skeleton/HUD overlay already on canvas
        const snap = document.createElement('canvas');
        snap.width = canvas.width;
        snap.height = canvas.height;
        const sctx = snap.getContext('2d');
        sctx.drawImage(video, 0, 0, snap.width, snap.height);
        sctx.drawImage(canvas, 0, 0);
        const dataUrl = snap.toDataURL('image/jpeg', 0.7);

        const btn = document.getElementById('fc-ask-kang-btn');
        if (btn) { btn.disabled = true; btn.innerText = 'Asking KANG...'; }

        try {
            const cfg = this.EXERCISES[this.exercise];
            const res = await APIService.analyzeForm(dataUrl, cfg.label, this.reps, this.lastPosture, window.Kang ? Kang.currentSessionId : null);
            if (res && res.session_id && window.Kang) Kang.currentSessionId = res.session_id;
            if (window.UI) UI.showToast("KANG left you feedback in the chat", 'success');
            if (window.Kang) {
                Kang.appendMessage('user', `[Live Form Check] ${this.EXERCISES[this.exercise].label} — ${this.reps} reps, posture: ${this.lastPosture}`);
                Kang.appendMessage('kang', (res && res.reply) || "Nice work — keep it up!");
            }
        } catch (e) {
            if (window.UI) UI.showToast('Could not reach KANG right now', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Ask KANG for Feedback'; }
        }
    },

    resetReps() {
        this.reps = 0;
        this.stage = null;
        this.smoothedAngle = null;
        this.repHadBadForm = false;
        this.pendingStage = null;
        this.pendingFrames = 0;
        this.updateHudDom();
    },
};

window.FormCorrector = FormCorrector;
