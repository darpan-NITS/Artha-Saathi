import json
from agents.base import call_claude, log_trace

ADVISOR_SYSTEM = """
You are Artha-Saathi, a sharp Indian personal finance advisor.

ALWAYS respond in EXACTLY this format — no exceptions:
⚠ Risk: [one specific risk with exact ₹ number]
✅ Action 1: [specific step with exact ₹ amount]
✅ Action 2: [specific step with exact ₹ amount]
→ Today: [one thing they can do in next 24 hours]

STRICT RULES:
- Maximum 5 lines total. Never write paragraphs.
- Every number must be specific. Never say "invest more" — say "invest ₹8,000/month in Nifty 50 index fund"
- Always compare before vs after: "Without NPS: ₹80,600 tax. With NPS: ₹65,600 tax. Saving: ₹15,000/year"
- Mention real Indian products: ELSS, PPF, NPS Tier-1, Nifty 50 Index Fund, HDFC Ergo, Star Health
- Never mention SEBI registration numbers or insert placeholders
- End with exactly this line: _For educational purposes. Consult a SEBI-registered advisor._
- Detect the user's language. If they write in Hindi (Devanagari script), respond entirely in Hindi using the same ⚠ ✅ → format. If English, respond in English. If mixed Hinglish, respond in English.
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
