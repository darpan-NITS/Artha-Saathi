# Artha-Saathi — Architecture Document

## System Overview

Artha-Saathi is a multi-agent financial advisory system. A single user
message triggers a coordinated pipeline of 5 specialized agents,
each with a clearly defined role and audit-logged decisions.

## Agent Roles

| Agent | Input | Output | Model |
|---|---|---|---|
| **Orchestrator** | User message + session state | Intent + routing decision | Llama 3.3 70B |
| **Profile Agent** | User message + existing profile | Updated structured profile (JSON) | Llama 3.3 70B |
| **Calculator Agent** | Profile JSON | SIP / FIRE / Tax / Health Score results | Pure Python (no LLM) |
| **Advisor Agent** | Profile + calculations + history | Personalized Indian-context advice | Llama 3.3 70B |
| **Guardrails Agent** | Draft response + user message | Compliance-checked final response | Llama 3.3 70B |

## Communication Flow
```
HTTP POST /api/chat
        │
        ▼
  Orchestrator Agent
  (decides intent + feature)
        │
        ├──► Profile Agent
        │    (extracts/merges financial data)
        │
        ├──► Calculator Agent
        │    (runs deterministic math)
        │
        ├──► Advisor Agent
        │    (generates advice)
        │
        └──► Guardrails Agent
             (compliance check)
                  │
                  ▼
           Final Response
           + agent_trace log
```

## Data Flow
```
SQLite DB
├── user_sessions
│   ├── session_id (UUID)
│   ├── profile_data (JSON)
│   └── conversation_history (JSON array)
│
└── agent_traces
    ├── session_id
    ├── agent_name
    ├── input_summary
    ├── output_summary
    ├── reasoning
    └── timestamp
```

## Tool Integrations

| Tool | Purpose | Cost |
|---|---|---|
| Groq API (Llama 3.3 70B) | All LLM inference | Free tier |
| MFAPI.in | Real Indian MF NAV data | Free, no auth |
| SQLite | Session + audit storage | Free, local |
| Recharts | Frontend charting | Open source |

## Error Handling

| Failure | Behaviour |
|---|---|
| LLM API timeout | Guardrails catches exception, appends disclaimer, returns partial response |
| Profile extraction fails | Returns existing profile unchanged, logs error to trace |
| Calculator error | Returns error in `calculations.errors` array, advisor uses text-only fallback |
| Out-of-scope query | Guardrails keyword match blocks before LLM call, returns redirect message |
| Missing profile data | Orchestrator detects missing fields, advisor asks for them naturally |

## Compliance Guardrails

Every response passes through the Guardrails Agent which checks for:
- Hallucinated fund names (AMC whitelist: HDFC, Mirae, Axis, SBI, ICICI, Nippon, Kotak, Parag Parikh)
- Specific stock recommendations (blocked)
- Guaranteed return claims (blocked)
- Out-of-scope topics: crypto, F&O, forex (keyword-blocked before LLM)
- Missing SEBI disclaimer (auto-appended if absent)

All checks are logged to `agent_traces` with timestamp and reasoning.
