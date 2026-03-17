from agents.base import call_claude_json, log_trace

OUT_OF_SCOPE_TOPICS = [
    "stock tips", "which stock to buy", "penny stocks", "crypto",
    "forex trading", "intraday", "F&O", "futures", "options",
    "guaranteed returns", "MLM", "chit fund", "lottery"
]

GUARDRAILS_SYSTEM = """
You are a compliance checker for Artha-Saathi, an Indian financial advisory app.

Review the AI response and check for:
1. Hallucinated fund names (verify they sound like real Indian funds — HDFC, Mirae, Axis, SBI, ICICI, Nippon, Kotak, Parag Parikh are real AMCs)
2. Specific stock recommendations (not allowed — only fund categories/index funds are ok)
3. Guaranteed return claims (never allowed — markets are not guaranteed)
4. Out-of-scope advice (crypto, forex, F&O, insurance policies with specific premium amounts)
5. Missing SEBI disclaimer

Return JSON:
{
  "is_safe": true/false,
  "issues_found": ["list of issues if any"],
  "corrected_response": "the response with issues fixed, or original if safe",
  "compliance_note": "brief note on what was checked"
}
"""

def check_response(response: str, user_message: str, session_id: str) -> dict:
    
    # Quick keyword check before calling Claude (saves API calls)
    lower_msg = user_message.lower()
    for topic in OUT_OF_SCOPE_TOPICS:
        if topic in lower_msg:
            out_of_scope_reply = (
                f"I focus on personal financial planning — budgeting, SIPs, tax optimization, "
                f"and retirement planning. I'm not able to help with {topic}, as that falls "
                f"outside my scope and could require SEBI-registered investment advisory. "
                f"Want me to help you build a solid SIP-based investment plan instead?"
            )
            log_trace(session_id, "GuardrailsAgent", 
                     f"Out-of-scope: {topic}", 
                     "Blocked and redirected", 
                     f"Keyword match: {topic}")
            return {
                "is_safe": False,
                "issues_found": [f"Out-of-scope topic: {topic}"],
                "corrected_response": out_of_scope_reply,
                "compliance_note": f"Blocked: {topic} is outside advisory scope"
            }
    
    # Full Claude-based compliance check
    try:
        result = call_claude_json(
            GUARDRAILS_SYSTEM,
            f"User asked: '{user_message}'\n\nAI response to review:\n{response}",
            max_tokens=600
        )
        
        log_trace(
            session_id=session_id,
            agent_name="GuardrailsAgent",
            input_summary=f"Response length: {len(response)} chars",
            output_summary=f"Safe: {result.get('is_safe')}, Issues: {result.get('issues_found', [])}",
            reasoning=result.get("compliance_note", "")
        )
        return result
        
    except Exception as e:
        # If guardrails fail, add a safe disclaimer and pass through
        log_trace(session_id, "GuardrailsAgent", 
                 "Guardrails check failed", str(e), "Fallback: disclaimer added")
        return {
            "is_safe": True,
            "issues_found": [],
            "corrected_response": response + "\n\n*This is for educational purposes only. Please consult a SEBI-registered advisor.*",
            "compliance_note": "Guardrails check failed — disclaimer appended as fallback"
        }