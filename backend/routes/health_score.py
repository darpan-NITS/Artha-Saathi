from fastapi import APIRouter
from pydantic import BaseModel
from agents.orchestrator import process_message

router = APIRouter()

class HealthScoreRequest(BaseModel):
    session_id: str

@router.get("/health-score/{session_id}")
def get_health_score(session_id: str):
    from agents.base import get_db
    import json
    conn = get_db()
    row = conn.execute(
        "SELECT profile_data FROM user_sessions WHERE session_id = ?",
        (session_id,)
    ).fetchone()
    conn.close()

    if not row:
        return {"error": "Session not found"}

    profile = json.loads(row["profile_data"])

    from calculators.health_score import calculate_money_health_score
    if not profile.get("monthly_income"):
        return {"error": "Not enough profile data yet", "profile": profile}

    score = calculate_money_health_score(
        monthly_income=profile.get("monthly_income", 0),
        monthly_expenses=profile.get("monthly_expenses", 0),
        monthly_savings=profile.get("monthly_savings", 0),
        emergency_fund=profile.get("emergency_fund", 0),
        has_term_insurance=profile.get("has_term_insurance", False),
        life_cover_amount=profile.get("life_cover_amount", 0),
        has_health_insurance=profile.get("has_health_insurance", False),
        health_cover_amount=profile.get("health_cover_amount", 0),
        total_investments=profile.get("total_investments", 0),
        equity_pct=profile.get("equity_pct", 60),
        total_debt=profile.get("total_debt", 0),
        monthly_emi=profile.get("monthly_emi", 0),
        annual_tax_paid=profile.get("annual_tax_paid", 0),
        annual_tax_optimized=profile.get("annual_tax_optimized", 0),
        has_retirement_account=profile.get("has_retirement_account", False),
        age=profile.get("age", 30)
    )
    return {"session_id": session_id, "score": score, "profile": profile}
