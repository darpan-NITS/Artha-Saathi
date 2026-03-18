# Artha-Saathi — AI Money Mentor

> ET GenAI Hackathon 2026 · Problem Statement 9

**Artha-Saathi** makes financial planning as accessible as checking WhatsApp.
95% of Indians have no financial plan. Financial advisors charge ₹25,000+/year
and serve only HNIs. Artha-Saathi delivers equivalent intelligence for free,
in a single conversation.

---

## What It Does

One conversation. Three powerful features.

| Feature | What it gives you |
|---|---|
| **Money Health Score** | Comprehensive financial wellness score across 6 dimensions with personalized nudges |
| **FIRE Path Planner** | Month-by-month retirement roadmap with live scenario modeling |
| **Tax Wizard** | Old vs new regime comparison, deduction optimizer, missed savings finder |

---

## Architecture
```
User → Orchestrator Agent
         ├── Profile Agent      (extracts financial data from conversation)
         ├── Calculator Agent   (SIP, FIRE, tax math — verified formulas)
         ├── Advisor Agent      (India-specific personalized recommendations)
         └── Guardrails Agent   (compliance check, SEBI disclaimer, audit trail)
```

Every agent decision is logged to SQLite and exposed via `/api/traces/{session_id}`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI (Python), SQLite |
| AI | Groq API — Llama 3.3 70B |
| Data | MFAPI.in (free Indian MF data) |
| Deploy | Vercel (frontend) + Render (backend) |

All tools are free or open source.

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at console.groq.com)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Add GROQ_API_KEY to backend/.env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/chat` | Main conversation endpoint |
| `GET /api/health-score/{session_id}` | Money Health Score |
| `GET /api/fire/{session_id}` | FIRE plan |
| `POST /api/fire/scenario` | Real-time FIRE scenario modeling |
| `GET /api/tax/{session_id}` | Tax analysis |
| `POST /api/tax/optimize` | Live deduction optimization |
| `GET /api/traces/{session_id}` | Agent audit trail |

---

## Impact Model

See [`docs/impact_model.md`](docs/impact_model.md)

---

## Team

Built for the ET GenAI Hackathon 2026 — PS-9: AI Money Mentor
