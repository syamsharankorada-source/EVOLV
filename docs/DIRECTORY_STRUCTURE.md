# EVOLV Platform — Directory Structure & Standards

## 1. Monorepo Layout

```
fitainew/
│
├── backend/                            # Server Domain Logic (Django)
│   ├── Fit_AI/                         # Core Project Configuration
│   │   ├── __init__.py
│   │   ├── asgi.py                     # ASGI entrypoint (with sys.path bootstrap)
│   │   ├── rate_limiter.py             # Cache-backed sliding window rate limiter
│   │   ├── security.py                 # Input sanitization, validation, Pillow inspection
│   │   ├── settings.py                 # Multi-tier settings (PROJECT_ROOT & BASE_DIR)
│   │   ├── urls.py                     # Root URL routing
│   │   └── wsgi.py                     # WSGI entrypoint (with sys.path bootstrap)
│   │
│   ├── users/                          # Identity & Authentication App
│   ├── fitness/                        # Workout & Nutrition Services App
│   ├── wellness/                       # Device Sync & Daily Habit Tracking App
│   ├── kang/                           # AI Coach, Form Corrector & Chat App
│   ├── neuro_readiness/                # CNS Readiness & Reaction Test App
│   ├── community/                      # Coaches Marketplace & Social App
│   │
│   ├── data/                           # Exercise, Nutrition, & Guideline Datasets
│   │   ├── exercises.csv
│   │   ├── foods.csv
│   │   ├── safety_rules.csv
│   │   ├── health_food.csv
│   │   └── age_guidelines.csv
│   │
│   ├── db.sqlite3                      # SQLite Database (Local Development)
│   └── manage.py                       # Backend Django CLI Utility
│
├── frontend/                           # Presentation Layer
│   ├── templates/                      # HTML Shells & Components
│   │   └── fit.html                    # Single-Page Application (SPA) Master Template
│   │
│   └── static/                         # Browser Assets
│       ├── css/                        # Global & Component Stylesheets
│       │   └── fit.css
│       ├── js/                         # Modular Frontend Engines
│       │   ├── app.js                  # SPA View Lifecycle & Route Controller
│       │   ├── api.js                  # API Client & CSRF Handler
│       │   ├── hollowman.js            # 2D Canvas Procedural Skeletal Animator
│       │   ├── kang.js                 # AI Conversational UI Handler
│       │   ├── neuro.js                # CNS Test Controller & Readiness Visualizer
│       │   ├── dashboard.js            # Home Metrics & Tracker Sync
│       │   ├── fitness.js              # Workout & Meal Logging Controllers
│       │   ├── wellness.js             # Wearable & Sleep Visualization
│       │   └── ui.js                   # Toast Notifications, Modals, Theme Utilities
│       ├── images/                     # Graphics, Icons, & Badges
│       ├── audio/                      # Sound Effects & Cues
│       └── models/                     # Vision / Pose Assets
│
├── docs/                               # Corporate Technical Documentation
│   ├── ARCHITECTURE.md                 # System Architecture & Layer Boundaries
│   ├── DIRECTORY_STRUCTURE.md          # This Document
│   └── API_REFERENCE.md                # Comprehensive Endpoint Catalog
│
├── scripts/                            # Operational & Developer Tooling
│   ├── run_dev.ps1                     # Local Development Server Launcher
│   └── test_all.ps1                    # Monorepo Test Suite Executor
│
├── logs/                               # Operational & Security Telemetry
│   ├── security.log                    # Attack Payloads & Rejected Requests
│   ├── auth.log                        # OTP, Authentication, & Lockout Events
│   └── errors.log                      # Unhandled Exceptions & Server Failures
│
├── .env                                # Local Environment Configuration (gitignored)
├── .env.example                        # Production Template (Committed)
├── .gitignore                          # Enterprise Git Ignore Rules
├── manage.py                           # Root Delegator Script (For Root CLI Execution)
├── requirements.txt                    # Pinned Python Dependencies
└── README.md                           # Repository Overview & Quick Start
```

---

## 2. File Placement Guidelines for Developers

1. **New Backend Domain Logic**:
   - Create models, views, and services inside their respective app within `backend/<app_name>/`.
   - Never place backend business logic in the root directory.

2. **New Frontend Assets**:
   - JavaScript modules belong in `frontend/static/js/`.
   - CSS styles belong in `frontend/static/css/`.
   - HTML templates belong in `frontend/templates/`.

3. **Running Commands**:
   - You can execute Django commands from the repository root:
     ```powershell
     python manage.py runserver
     python manage.py test users neuro_readiness
     ```
   - Or from inside `backend/`:
     ```powershell
     cd backend
     python manage.py runserver
     ```
