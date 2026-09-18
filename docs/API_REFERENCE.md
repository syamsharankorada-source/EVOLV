# EVOLV Platform — REST API Reference

All protected endpoints enforce session-based authentication. CSRF tokens are required for all state-modifying requests (POST, PUT, DELETE) and must be supplied via the `X-CSRFToken` HTTP header.

---

## 1. Authentication & Profile (`/api/auth/`, `/api/profile/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/request-otp/` | POST | 5 / 5 min | None | Request 6-digit cryptographic SMS OTP |
| `/api/auth/verify-otp/` | POST | 5 / 5 min | None | Verify OTP, cycle session key, login |
| `/api/auth/guest-login/` | POST | 10 / 1 hr | None | Instantiate ephemeral guest session |
| `/api/auth/logout/` | POST | - | Session | Invalidate session |
| `/api/profile/onboarding/` | POST | - | Session | Submit initial fitness profile & biometrics |

---

## 2. Fitness & Nutrition (`/api/fitness/`, `/api/nutrition/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/fitness/workout-plan/` | GET | - | Session | Retrieve personalized weekly workout plan |
| `/api/fitness/log-workout/` | POST | 30 / min | Session | Record completed workout session |
| `/api/fitness/progress/` | GET | - | Session | Fetch user XP, streaks, and progress stats |
| `/api/fitness/badges/` | GET | - | Session | List earned user achievement badges |
| `/api/fitness/leaderboard/` | GET | - | Session | Fetch community leaderboard rankings |
| `/api/fitness/meal-scan/` | POST | 10 / min | Session | Analyze food photo via Groq Vision API |
| `/api/fitness/recipe/` | POST | 20 / min | Session | Fetch personalized recipe instructions |
| `/api/nutrition/plan/` | GET | - | Session | Fetch personalized daily nutrition plan |
| `/api/nutrition/today/` | GET | - | Session | Fetch today intake calories & macronutrients |

---

## 3. KANG AI Assistant (`/api/kang/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/kang/chat/` | POST | 20 / min | Session | Send chat prompt to KANG AI assistant |
| `/api/kang/analyze-form/` | POST | 10 / min | Session | Live exercise pose verification |
| `/api/kang/sessions/` | GET | - | Session | List user active chat sessions |
| `/api/kang/new-session/` | POST | - | Session | Create a new isolated chat thread |
| `/api/kang/sessions/<id>/` | GET, DELETE | - | Session | Retrieve or delete specific chat thread |

---

## 4. Neuro-Athletic Readiness (`/api/neuro/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/neuro/check-in/` | POST | - | Session | Submit daily readiness check-in |
| `/api/neuro/reaction-test/` | POST | - | Session | Submit browser CNS reaction test trials |
| `/api/neuro/today/` | GET | - | Session | Fetch today readiness score & breakdown |
| `/api/neuro/history/` | GET | - | Session | Fetch historical readiness trajectory |
| `/api/neuro/baseline/` | GET | - | Session | Fetch rolling 28-day physiological baselines |
| `/api/neuro/recommendation/` | GET | - | Session | Fetch today training intensity guidance |
| `/api/neuro/workout-outcome/`| POST | - | Session | Log post-workout outcome & correlation |

---

## 5. Wellness & Wearables (`/api/wellness/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/wellness/today/` | GET | - | Session | Get today wearable metrics (steps, sleep, water) |
| `/api/wellness/sync-band/` | POST | 30 / min | Session | Sync wearable band metrics |
| `/api/wellness/history/` | GET | - | Session | Fetch 14-day wearable trend history |
| `/api/wellness/assessment/` | GET | - | Session | Fetch rule-based wellness lifestyle verdict |
| `/api/wellness/pair-token/` | POST | 10 / 10m | Session | Generate 15-min QR mobile pairing token |
| `/mobile-connect/<token>/` | GET | 20 / 10m | None | Mobile QR connection handler |

---

## 6. Community & Coaches Marketplace (`/api/community/`)

| Endpoint | Method | Rate Limit | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/community/coaches/` | GET | - | Session | List verified fitness coaches |
| `/api/community/coaches/my-profile/` | GET | - | Session | Fetch current user coach profile |
| `/api/community/coaches/become/` | POST | 10 / min | Session | Register or update coach profile |
| `/api/community/posts/` | GET | - | Session | List community tips and articles |
| `/api/community/posts/create/` | POST | 10 / min | Session | Publish a new coach article |
| `/api/community/hire/` | POST | 10 / min | Session | Submit a coaching hire inquiry |
| `/api/community/hire/requests/` | GET | - | Session | Coach view of incoming hire requests |
