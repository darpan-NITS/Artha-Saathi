import json
from agents.base import call_claude_json, log_trace

PROFILE_SYSTEM = """
You are a financial data extraction specialist for Artha-Saathi, an Indian personal finance assistant.

Your job is to extract structured financial information from the user's conversational message.
Extract ONLY what the user has explicitly stated. Use null for unknown fields.

Return a JSON object with these fields:
{
  "age": null,
  "monthly_income": null,
  "monthly_expenses": null,
  "monthly_savings": null,
  "emergency_fund": null,
  "has_term_insurance": null,
  "life_cover_amount": null,
  "has_health_insurance": null,
  "health_cover_amount": null,
  "total_investments": null,
  "equity_pct": null,
  "total_debt": null,
  "monthly_emi": null,
  "has_retirement_account": null,
  "city_type": null,
  "basic_salary": null,
  "hra_received": null,
  "actual_rent_paid": null,
  "section_80c": null,
  "section_80d": null,
  "nps_80ccd1b": null,
  "risk_appetite": null,
  "target_retirement_age": null,
  "annual_expenses_fire": null,
  "current_corpus": null
}

Rules:
- Convert all amounts to rupees (if user says "80k" → 80000, "2 lakh" → 200000, "1.5Cr" → 15000000)
- city_type must be "metro" or "non-metro" (Mumbai/Delhi/Chennai/Kolkata/Bangalore/Hyderabad = metro)
- risk_appetite must be "aggressive", "moderate", or "conservative"
- If user mentions EPF/PPF/NPS, set has_retirement_account to true
"""

def extract_profile(user_message: str, existing_profile: dict, 
                    session_id: str) -> dict:
    """
    Extract financial data from user message and merge with existing profile.
    Only overwrites fields that are newly mentioned — preserves existing data.
    """
    prompt = f"""
Existing profile (already known):
{json.dumps(existing_profile, indent=2)}

User's new message:
"{user_message}"

Extract any NEW financial information from the message and return the complete updated profile.
Keep existing non-null values unless the user explicitly corrects them.
"""
    try:
        extracted = call_claude_json(PROFILE_SYSTEM, prompt, max_tokens=800)
        
        # Merge: new extraction overwrites only non-null fields
        merged = {**existing_profile}
        for key, value in extracted.items():
            if value is not None:
                merged[key] = value
        
        # Infer monthly_savings if not stated
        if (merged.get("monthly_income") and merged.get("monthly_expenses") 
                and not merged.get("monthly_savings")):
            merged["monthly_savings"] = (
                merged["monthly_income"] - merged["monthly_expenses"]
            )

        log_trace(
            session_id=session_id,
            agent_name="ProfileAgent",
            input_summary=f"Message: {user_message[:100]}",
            output_summary=f"Extracted {sum(1 for v in extracted.values() if v is not None)} fields",
            reasoning="Merged new data with existing profile"
        )
        return merged
        
    except Exception as e:
        log_trace(session_id, "ProfileAgent", user_message[:100], 
                  "Extraction failed", str(e))
        return existing_profile


def get_missing_fields(profile: dict) -> list[str]:
    """Returns human-readable list of important missing fields."""
    missing = []
    checks = [
        ("age", "your age"),
        ("monthly_income", "your monthly income"),
        ("monthly_expenses", "your monthly expenses"),
        ("emergency_fund", "your emergency fund amount"),
        ("has_health_insurance", "whether you have health insurance"),
        ("has_term_insurance", "whether you have term life insurance"),
        ("total_investments", "your total investment amount"),
    ]
    for field, label in checks:
        if profile.get(field) is None:
            missing.append(label)
    return missing