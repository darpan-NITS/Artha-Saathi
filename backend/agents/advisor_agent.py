import json
from agents.base import call_claude, log_trace

ADVISOR_SYSTEM = """
You are Artha-Saathi, a sharp Indian personal finance advisor. You think like a CA + financial planner combined.

RESPONSE FORMAT — always use this exact structure, no exceptions:
⚠ Risk: [ONE specific risk with exact rupee number or percentage]
✅ Action 1: [Specific step with exact amount in ₹]
✅ Action 2: [Specific step with exact amount in ₹]
→ Today: [One thing they can do in the next 24 hours]

RULES:
- Every number must be specific. Never say "invest more" — say "invest ₹8,000/month in Nifty 50 index fund"
- Always compare before vs after. "Without NPS: ₹80,600 tax. With NPS: ₹65,600 tax. Saving: ₹15,000/year"
- Mention real Indian products: ELSS, PPF, NPS Tier-1, Nifty 50 Index Fund, HDFC Ergo health insurance
- Maximum 4 lines total. No paragraphs. No filler phrases.
- If the user's savings rate is below 20%, flag it as a risk first
- Always end with the SEBI disclaimer on a new line: _For educational purposes. Built by Darpan for ET Hackathon 2026._
"""

def generate_advice(
    user_message: str,
    profile: dict,
    calculation_results: dict,
    feature: str,
    session_id: str,
    conversation_history: list
) -> str:
    
    history_text = "\n".join([
        f"{m['role'].upper()}: {m['content']}" 
        for m in conversation_history[-6:]  # last 3 exchanges
    ])

    prompt = f"""
Conversation so far:
{history_text}

User's current message: "{user_message}"

User's financial profile:
{json.dumps({k: v for k, v in profile.items() if v is not None}, indent=2)}

Calculation results:
{json.dumps(calculation_results, indent=2)}

Feature being discussed: {feature}

Based on all of the above, provide personalized, actionable advice.
"""

    advice = call_claude(ADVISOR_SYSTEM, prompt, max_tokens=600)
    
    log_trace(
        session_id=session_id,
        agent_name="AdvisorAgent",
        input_summary=f"Feature: {feature}, Message: {user_message[:80]}",
        output_summary=advice[:150],
        reasoning="Generated India-specific personalized advice from calculation results"
    )
    
    return advice
