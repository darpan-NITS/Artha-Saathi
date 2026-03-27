# Artha-Saathi — AI that predicts your financial future and tells you what to fix

> **ET GenAI Hackathon 2026 · Problem Statement 9 · AI Money Mentor**

95% of Indians have no financial plan. Financial advisors charge ₹25,000+/year
and serve only HNIs. **Artha-Saathi delivers equivalent intelligence in under
60 seconds — for free — in English, Hindi, and on WhatsApp.**

---

## Live Demo

| | |
|---|---|
| **Web App** | https://artha-saathi.vercel.app |
| **Backend API** | https://artha-saathi.onrender.com/health |
| **WhatsApp** | Save +1 415 523 8886 → Send `join <elephant-home>` |
| **Demo Video** | [Watch 3-minute walkthrough](#) |

---

## Why This Stands Out

- **Future Shock Engine** — shows the exact ₹ cost of doing nothing over 5 years, in 8 seconds
- **5-agent audit trail** — every AI decision is logged and auditable, not a black box
- **Deterministic math** — SIP, FIRE, and tax calculations use verified Indian formulas, not LLM guesses
- **WhatsApp-native** — same intelligence available via WhatsApp with shortcut commands

---

## What It Does

One conversation. Four powerful features.

| Feature | What it gives you |
|---|---|
| **Future Shock** | 5-year dual timeline — cost of doing nothing vs following the plan |
| **Money Health Score** | Financial wellness across 6 dimensions with radar chart |
| **FIRE Path Planner** | Retirement corpus timeline with live scenario modeling |
| **Tax Wizard** | Old vs new regime comparison with deduction optimizer |

---

## Architecture
```
User Message (Web / WhatsApp / Voice)
        │
        ▼
  Orchestrator Agent  ──────────────────────────────────┐
  (intent + routing)                                     │
        │                                                │
        ├──► Profile Agent                               │
        │    (extracts structured financial data)        │
        │                                                │
        ├──► Calculator Agent                            │
        │    (deterministic SIP / FIRE / tax math)       │
        │                                                │
        ├──► Advisor Agent                               │
        │    (India-specific recommendations)            │
        │                                                │
        └──► Guardrails Agent ──► Final Response         │
             (compliance check,                          │
              SEBI disclaimer,                           │
              audit log to SQLite) ◄────────────────────┘
```

Every agent decision logged → `/api/traces/{session_id}`

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Recharts | Free |
| Backend | FastAPI, Python 3.11, SQLite | Free |
| AI (agents) | Groq API — Llama 3.3 70B | Free tier |
| Voice STT | Groq Whisper Large v3 | Free tier |
| WhatsApp | Twilio Sandbox | Free |
| MF Data | MFAPI.in | Free, no auth |
| Deploy | Vercel + Render | Free tier |

**Total infrastructure cost: ₹0**

---

## Setup (3 commands)
```bash
# Backend
cd backend && pip install -r requirements.txt
echo "GROQ_API_KEY=your_key" > .env
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

**Required API keys (all free):**
- `GROQ_API_KEY` — console.groq.com
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_WHATSAPP_NUMBER` — twilio.com

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | Main conversation endpoint |
| `/api/future-shock/{session_id}` | GET | 5-year dual projection |
| `/api/health-score/{session_id}` | GET | Money Health Score |
| `/api/fire/{session_id}` | GET | FIRE retirement plan |
| `/api/fire/scenario` | POST | Live scenario modeling |
| `/api/tax/{session_id}` | GET | Tax analysis |
| `/api/tax/optimize` | POST | Live deduction optimizer |
| `/api/voice-to-text` | POST | Groq Whisper STT |
| `/api/whatsapp` | POST | Twilio webhook |
| `/api/traces/{session_id}` | GET | Agent audit trail |

---

## WhatsApp Commands

Save **+1 415 523 8886** and send `join <your-code>` to connect.

| Command | Action |
|---|---|
| `score` | Money Health Score |
| `retire` | FIRE retirement summary |
| `tax` | Tax regime recommendation |
| `shock` | 5-year financial projection |
| `help` | Show all commands |

Or just chat naturally in English or Hindi.

---

## Impact Model

See [`docs/impact_model.md`](docs/impact_model.md) for full calculations.

| Metric | Value |
|---|---|
| Target users | 14 crore+ demat account holders |
| Traditional advisor cost | ₹25,000+/year |
| Artha-Saathi cost | ₹0 |
| Time saved vs traditional | 97% (7 min vs 4–6 hours) |
| Avg tax saving per user | ₹42,000/year |
| TAM | ₹2.74 lakh crore |

---

## Submission

**Team:** Darpan Goswami · NIT Silchar · EIE 2nd Year
**GitHub:** github.com/darpan-NITS/Artha-Saathi
**Problem Statement:** PS-9 — AI Money Mentor
