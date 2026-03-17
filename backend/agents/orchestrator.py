import json
import uuid
from agents.base import call_claude_json, log_trace, init_db, get_db
from agents.profile_agent import extract_profile, get_missing_fields
from agents.calculator_agent import run_calculations
from agents.advisor_agent import generate_advice
from agents.guardrails_agent import check_response

ORCHESTRATOR_SYSTEM = """
You are the orchestrator for Artha-Saathi, an Indian AI money mentor.

Analyze the user's message and return JSON:
{
  "intent": "greeting|health_score|fire_planning|tax_advice|sip_query|general_finance|out_of_scope|clarification",
  "feature": "health_score|fire|tax|sip|general|none",
  "needs_more_info": true/false,
  "missing_critical_fields": ["list of fields needed before calculation"],
  "reasoning": "one sentence explaining your routing decision"
}

Intent guide:
- greeting: hello, hi, start
- health_score: score, health check, how am I doing financially
- fire_planning: retire, FIRE, financial independence, how long to retire
- tax_advice: tax, 80C, form 16, save tax, old regime, new regime
- sip_query: SIP, mutual fund, invest monthly
- general_finance: budgeting, savings, insurance, general questions
- out_of_scope: stocks, crypto, F&O, specific stock tips
"""

def get_or_create_session(session_id: str = None) -> tuple[str, dict, list]:
    """Returns (session_id, profile, conversation_history)"""
    init_db()
    conn = get_db()
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    row = conn.execute(
        "SELECT * FROM user_sessions WHERE session_id = ?", 
        (session_id,)
    ).fetchone()
    
    if row:
        profile = json.loads(row["profile_data"])
        history = json.loads(row["conversation_history"])
    else:
        profile = {}
        history = []
        from datetime import datetime
        conn.execute("""
            INSERT INTO user_sessions 
            (session_id, profile_data, conversation_history, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, "{}", "[]", 
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()
    
    conn.close()
    return session_id, profile, history


def save_session(session_id: str, profile: dict, history: list):
    from datetime import datetime
    conn = get_db()
    conn.execute("""
        UPDATE user_sessions 
        SET profile_data = ?, conversation_history = ?, updated_at = ?
        WHERE session_id = ?
    """, (json.dumps(profile), json.dumps(history), 
          datetime.now().isoformat(), session_id))
    conn.commit()
    conn.close()


def process_message(user_message: str, session_id: str = None) -> dict:
    """
    Main entry point. Takes a user message, returns AI response + metadata.
    """
    session_id, profile, history = get_or_create_session(session_id)
    
    # Step 1: Orchestrator decides intent
    try:
        routing = call_claude_json(
            ORCHESTRATOR_SYSTEM,
            f"User profile so far: {json.dumps({k:v for k,v in profile.items() if v is not None})}\n\nUser message: {user_message}",
            max_tokens=300
        )
    except Exception:
        routing = {"intent": "general_finance", "feature": "general", 
                   "needs_more_info": False, "missing_critical_fields": [], 
                   "reasoning": "Fallback routing"}

    log_trace(session_id, "Orchestrator",
              f"Message: {user_message[:80]}",
              f"Intent: {routing.get('intent')}, Feature: {routing.get('feature')}",
              routing.get("reasoning", ""))

    # Step 2: Profile Agent extracts data
    profile = extract_profile(user_message, profile, session_id)
    missing = get_missing_fields(profile)

    # Step 3: Calculator Agent runs math
    feature = routing.get("feature", "general")
    calc_results = {}
    if feature != "general" and feature != "none":
        calc_data = run_calculations(profile, feature, session_id)
        calc_results = calc_data.get("results", {})

    # Step 4: Advisor Agent generates response
    # If critical info is missing, ask for it naturally
    if routing.get("needs_more_info") and missing and feature != "general":
        next_question = missing[0]
        response_text = (
            f"To give you accurate {feature.replace('_', ' ')} advice, "
            f"I need a bit more information. Could you tell me {next_question}?"
        )
    else:
        response_text = generate_advice(
            user_message=user_message,
            profile=profile,
            calculation_results=calc_results,
            feature=feature,
            session_id=session_id,
            conversation_history=history
        )

    # Step 5: Guardrails Agent checks response
    guardrails_result = check_response(response_text, user_message, session_id)
    final_response = guardrails_result.get("corrected_response", response_text)

    # Update conversation history
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": final_response})
    
    # Keep last 20 messages only (memory management)
    if len(history) > 20:
        history = history[-20:]

    save_session(session_id, profile, history)

    return {
        "session_id": session_id,
        "response": final_response,
        "intent": routing.get("intent"),
        "feature": feature,
        "profile_snapshot": {k: v for k, v in profile.items() if v is not None},
        "calculations": calc_results,
        "guardrails": {
            "is_safe": guardrails_result.get("is_safe"),
            "issues": guardrails_result.get("issues_found", [])
        }
    }