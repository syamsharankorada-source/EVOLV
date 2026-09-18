# EVOLV — Enterprise AI Fitness & Neuro-Athletic Platform

EVOLV is a production-grade fitness and wellness platform engineered around hyper-personalized training, physiological neuro-readiness scoring, real-time pose tracking, and AI-driven nutrition analysis.

---

## 1. Enterprise Architecture

The codebase is organized following the **Corporate Multi-Tier Monorepo** standard:

```text
fitainew/
├── backend/                  # Server-side Django applications, domain services, database
│   ├── Fit_AI/               # Configuration core, security modules, rate limiting
│   ├── users/                # Identity, authentication, cryptographic OTP service
│   ├── fitness/              # Workouts, nutrition engine, Groq vision meal scanner
│   ├── wellness/             # Smart band sync, habits, desktop-to-mobile QR pairing
│   ├── kang/                 # KANG conversational AI coach & pose analyzer
│   ├── neuro_readiness/      # CNS readiness & reaction time engine
│   ├── community/            # Coach marketplace & community posts
│   ├── data/                 # Exercise, food, and safety CSVs
│   ├── db.sqlite3            # SQLite database
│   └── manage.py             # Dedicated backend management CLI
│
├── frontend/                 # Presentation tier
│   ├── templates/            # HTML templates (fit.html)
│   └── static/               # Client assets (CSS, JS, images, audio, models)
│       ├── css/              # Swiss Noir design system & Tailwind styles
│       ├── js/               # SPA modules, hollow man procedural animator
│       └── images/           # Badges, icons, assets
│
├── docs/                     # Corporate documentation & API specifications
│   ├── ARCHITECTURE.md       # High-level architecture & layer boundaries
│   ├── DIRECTORY_STRUCTURE.md# Repository organization & developer guide
│   └── API_REFERENCE.md      # REST API contracts & rate limits
│
├── scripts/                  # Operational developer tooling
│   ├── run_dev.ps1           # Quick local development server launcher
│   └── test_all.ps1          # Automated test runner
│
├── logs/                     # Structured audit, security, and auth telemetry
│   ├── security.log
│   ├── auth.log
│   └── errors.log
│
├── .env                      # Local environment configuration (gitignored)
├── .env.example              # Production template
├── .gitignore                # Enterprise git ignore rules
├── manage.py                 # Root delegator script
└── requirements.txt          # Python dependencies
```

---

## 2. Quick Start

### 2.1 Prerequisites
- Python 3.10+
- Django 5.0+
- Pillow 12.0+

### 2.2 Installation & Setup
```powershell
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Update SECRET_KEY and GROQ_API_KEY in .env

# 3. Verify system
python manage.py check

# 4. Run automated tests
python manage.py test users neuro_readiness

# 5. Launch local server
python manage.py runserver
# Or using the script:
.\scripts\run_dev.ps1
```

Visit `http://127.0.0.1:8000/` in your browser.
