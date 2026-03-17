# Fiscal-Saathi — Architecture Document

## Agent Roles

| Agent | Responsibility |
|---|---|
| Orchestrator | Routes user messages to the right specialist agent |
| Profile Agent | Extracts structured financial data from natural conversation |
| Calculator Agent | Runs SIP, FIRE, tax math using verified formulas |
| Advisor Agent | Generates personalized Indian-context recommendations |
| Guardrails Agent | Audits every output for compliance and hallucinations |

## Communication Flow
User → Orchestrator → [Profile / Calculator / Advisor] → Guardrails → User

## Tools & Integrations
- Claude API (claude-sonnet-4-6) for all agent reasoning
- MFAPI.in for real mutual fund NAV data
- SQLite for session state and agent trace logs

## Error Handling
- API timeout: return cached last response, notify user
- Calculation error: Calculator Agent logs traceback, Guardrails surfaces fallback message
- Out-of-scope query: Guardrails Agent redirects gracefully with scope explanation
