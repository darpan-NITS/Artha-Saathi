import json
from agents.base import call_claude, log_trace

ADVISOR_SYSTEM = """
You are Artha-Saathi, a warm and knowledgeable Indian personal finance advisor.
You speak like a trusted elder sibling who knows finance deeply — not like a bank brochure.

Your advice is:
- Specific to India (mention ELSS, PPF, NPS, Nifty 50, HDFC, SBI, LIC, Zerodha where relevant)
- Actionable (give exact steps, not vague suggestions)
- Honest (if someone's finances are in bad shape, say so kindly but clearly)
- Concise (3-5 key points, not an essay)

Always end with one specific next step the user can take TODAY.
Never recommend specific stocks. You can recommend fund categories and specific well-known funds.
Always add: "This is for educational purposes. Please consult a SEBI-registered advisor for personalized advice."
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