<div align="center">

<img src="https://img.shields.io/badge/DigiWarden-Media%20Forensics%20Platform-FF6B1A?style=for-the-badge&logo=shield&logoColor=white" alt="DigiWarden" />

<h1>DigiWarden</h1>
<p><strong>AI-powered media forensics for creators. Register, track, and legally protect your digital assets — in seconds.</strong></p>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![Google Gemini](https://img.shields.io/badge/Gemini-Vision%20API-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ What is DigiWarden?

DigiWarden is a **full-stack media forensics platform** that gives creators, photographers, athletes, and media companies the tools to:

- **Cryptographically register** original images with a SHA-256 + perceptual hash fingerprint
- **Automatically scan the web** for unauthorized copies using Google Gemini Vision + Custom Search
- **Score similarity** of every candidate using a 3-layer AI engine (pHash · ORB · Semantic)
- **Classify mutations** — exact copies, crops, recolors, blurs, and watermark overlays
- **Generate DMCA takedown notices** with forensic evidence pre-filled, in one click
- **Protect images** with invisible steganographic watermarks for active defense


---

## 🖼️ Screenshots

| Landing Page | Results Dashboard | My Vault |
|---|---|---|
| Live LightRay WebGL animation | Integrity gauge, copy tree, DMCA | All registered assets with thumbnails |

---

## 🚀 Features at a Glance

| Feature | Details |
|---|---|
| 🔐 **Secure Auth** | JWT-based login/register, bcrypt password hashing, 1-week tokens |
| 🧬 **Fingerprinting** | SHA-256 (exact copy) + pHash (perceptual) + ORB (structural) + MobileNetV2 (semantic) |
| 🌐 **Web Scraping** | Gemini Vision extracts keywords → Google Custom Search fetches candidates |
| 📊 **Similarity Scoring** | Weighted 3-layer score with per-dimension breakdown |
| 🌳 **Propagation Tree** | Interactive DAG showing how the image spread across the web |
| ⚖️ **DMCA Generation** | Gemini-drafted legal notices with fingerprint evidence attached |
| 💧 **Steganographic Watermark** | Invisible watermark embedded using `invisible-watermark` library |
| 🗄️ **Personal Vault** | Secure per-user asset management with delete, view analysis, and account controls |
| 🎭 **Demo Variants** | Auto-generated crop/rotate/recolor/blur/watermark variants for hackathon demos |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│   LandingPage · UploadPage · DashboardPage · VaultPage           │
│   AuthContext · useApi.js (JWT injection, polling, workflow)     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / REST
┌────────────────────────────▼────────────────────────────────────┐
│                      FastAPI Backend                             │
│  /api/auth    → Register, Login (bcrypt + JWT)                   │
│  /api/upload  → SHA-256 dedup, pHash anti-piracy guard           │
│  /api/analyze → Background job: scrape + fingerprint + score     │
│  /api/similarity · /api/tree · /api/fingerprint                  │
│  /api/dmca    → Gemini DMCA draft generation                     │
│  /api/protect → Steganographic watermark embedding               │
│  /api/users/me/vault → CRUD for personal asset vault             │
│  /assets      → Static file serving for uploaded images          │
└────────────────┬──────────────────────┬─────────────────────────┘
                 │                      │
    ┌────────────▼──────────┐  ┌────────▼────────────────────────┐
    │     DigiWarden Engine  │  │        External APIs             │
    │  fingerprint.py        │  │  Google Gemini Vision (keywords) │
    │  similarity.py         │  │  Google Custom Search (scraping) │
    │  tree_builder.py       │  │  Gemini Flash (DMCA drafting)    │
    │  watermark.py          │  └─────────────────────────────────┘
    │  demo_mutations.py     │
    └────────────────────────┘
                 │
    ┌────────────▼──────────┐
    │   SQLite Database      │
    │  users · images        │
    │  analysis_jobs         │
    │  dmca_drafts           │
    └────────────────────────┘
```

---

## ⚙️ Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google AI Studio API key (free) → [Get one here](https://aistudio.google.com/app/apikey)
- A Google Custom Search API key + CSE ID (free) → [Setup guide](https://developers.google.com/custom-search/v1/introduction)

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/digiwarden.git
cd digiwarden
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_key_here
GOOGLE_CSE_API_KEY=your_cse_key_here
GOOGLE_CSE_ID=your_cse_id_here
ENABLE_DEMO_VARIANTS=true
```

### 2. Backend Setup

```bash
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload
```

Backend runs at → `http://localhost:8000`  
API docs at → `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 📁 Project Structure

```
digiwarden/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app, middleware, static mounts
│       ├── models.py            # SQLAlchemy ORM models
│       ├── schemas.py           # Pydantic request/response schemas
│       ├── db.py                # Database setup and session management
│       ├── settings.py          # Env config (auto-loads .env)
│       ├── routers/
│       │   ├── auth.py          # JWT register/login
│       │   ├── upload.py        # Image upload + SHA-256 dedup
│       │   ├── analyze.py       # Analysis job trigger + polling
│       │   ├── images.py        # Image metadata endpoints
│       │   ├── variants.py      # Candidate copy management
│       │   ├── users.py         # Vault CRUD + account deletion
│       │   ├── protect.py       # Steganographic watermark
│       │   ├── tree.py          # Propagation tree
│       │   ├── dmca.py          # DMCA notice generation
│       │   └── explain.py       # Gemini forensic explanations
│       └── services/
│           ├── analysis_service.py   # Core analysis pipeline
│           ├── scraper_service.py    # Gemini Vision + Google CSE
│           ├── gemini_service.py     # Gemini API wrapper
│           ├── storage_service.py    # File I/O utilities
│           └── demo_mutations.py     # Demo variant generation (PIL)
│
├── engine/                      # Standalone CV library
│   ├── fingerprint.py           # pHash + ORB + MobileNetV2 embeddings
│   ├── similarity.py            # Weighted multi-modal scoring
│   ├── tree_builder.py          # DAG propagation tree builder
│   └── watermark.py             # Invisible watermark embed/extract
│
├── frontend/
│   └── src/
│       ├── App.jsx              # SPA router + session storage
│       ├── contexts/
│       │   └── AuthContext.jsx  # JWT auth state, login/logout
│       ├── hooks/
│       │   └── useApi.js        # API client, auto JWT injection, polling
│       └── pages/
│           ├── LandingPage.jsx  # Hero with WebGL LightRays
│           ├── UploadPage.jsx   # Upload wizard with pipeline steps
│           ├── DashboardPage.jsx # Analysis results, DMCA, tree nav
│           ├── VaultPage.jsx    # Asset vault with delete controls
│           ├── LoginPage.jsx    # Sign in
│           └── RegisterPage.jsx # Sign up
│
├── tests/                       # Pytest integration tests
├── .env.example                 # Environment variable template
├── docker-compose.yml           # One-command deployment
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio key for Vision + DMCA drafting |
| `GOOGLE_CSE_API_KEY` | ✅ | Google Custom Search API key |
| `GOOGLE_CSE_ID` | ✅ | Your Custom Search Engine ID |
| `ENABLE_DEMO_VARIANTS` | Optional | Set `true` to auto-generate demo copies for testing |
| `STORAGE_PATH` | Optional | Override default `backend/data` storage path |
| `DB_URL` | Optional | Override default SQLite path |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins for production |

---

## 🧠 How the Analysis Pipeline Works

```
1. UPLOAD
   └─ User uploads original image
   └─ SHA-256 hash computed → exact duplicate check
   └─ pHash computed → perceptual duplicate check (>90% similarity blocked)
   └─ Image saved to vault, registered to user account

2. WEB SCRAPING
   └─ Gemini Vision analyzes image → extracts semantic keywords
   └─ Google Custom Search fetches up to 10 matching image URLs
   └─ Each image downloaded, saved as a candidate variant

3. DEMO VARIANTS (when ENABLE_DEMO_VARIANTS=true)
   └─ If no user/web candidates exist, 5 mutations are auto-generated:
      Crop · Rotate · Recolor · Watermark · Blur

4. FINGERPRINTING (per candidate)
   └─ pHash → Hamming distance
   └─ ORB keypoints → descriptor matching ratio
   └─ MobileNetV2 ONNX → cosine similarity of embeddings

5. SCORING & CLASSIFICATION
   └─ Weighted combined score (0–100%)
   └─ Labels: Original · Likely Infringing · Modified · No Match

6. PROPAGATION TREE
   └─ DAG built from root image + all scored candidates
   └─ Rendered as interactive force graph in the browser

7. DMCA GENERATION (on demand)
   └─ Gemini Flash drafts a legally-structured takedown notice
   └─ Pre-filled with asset ID, fingerprint hash, similarity score
```

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

This starts:
- `backend` — FastAPI on port 8000
- `frontend` — Vite dev server on port 5173

---

## 🧪 Running Tests

```bash
pytest tests/ -v
```

---

## 🛡️ Security Notes

- Passwords hashed with `bcrypt` (cost factor 12)
- JWTs signed with HS256, expire after 7 days
- Image ownership enforced at the database level (all protected routes require `Authorization: Bearer` header)
- SHA-256 + pHash dual guard prevents re-registration of existing assets
- DMCA endpoint requires authenticated ownership of the root image

---

## 🤝 Contributing

PRs and feedback welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: your feature'`
4. Push and open a PR

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p><strong>DigiWarden</strong> — Register once. Protect everywhere.</p>
</div>
