from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class FireRequest(BaseModel):
    session_id: str
    override_monthly_sip: Optional[float] = None
    override_annual_return: Optional[float] = None
    override_retirement_age: Optional[int] = None

@router.get("/fire/{session_id}")
def get_fire_plan(session_id: str):
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

    if not profile.get("monthly_income"):
        return {"error": "Not enough profile data", "profile": profile}

    return compute_fire(profile)


@router.post("/fire/scenario")
def fire_scenario(req: FireRequest):
    """Real-time scenario modeling — called when user moves the SIP slider."""
    from agents.base import get_db
    import json
    conn = get_db()
    row = conn.execute(
        "SELECT profile_data FROM user_sessions WHERE session_id = ?",
        (req.session_id,)
    ).fetchone()
    conn.close()

    if not row:
        return {"error": "Session not found"}

    profile = json.loads(row["profile_data"])

    # Apply overrides for scenario modeling
    if req.override_monthly_sip:
        profile["monthly_savings"] = req.override_monthly_sip
    if req.override_annual_return:
        profile["assumed_return"] = req.override_annual_return
    if req.override_retirement_age:
        profile["target_retirement_age"] = req.override_retirement_age

    return compute_fire(profile)


def compute_fire(profile: dict) -> dict:
    from calculators.fire import (
        calculate_years_to_fire,
        calculate_asset_allocation
    )
    from calculators.sip import calculate_sip_future_value

    monthly_income = profile.get("monthly_income", 0)
    monthly_expenses = profile.get("monthly_expenses", monthly_income * 0.6)
    monthly_savings = profile.get("monthly_savings", monthly_income - monthly_expenses)
    current_corpus = profile.get("current_corpus") or profile.get("total_investments", 0)
    age = profile.get("age", 25)
    annual_return = profile.get("assumed_return", 12.0)

    fire_result = calculate_years_to_fire(
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        current_savings=current_corpus,
        annual_return=annual_return,
        annual_expenses_for_fire=profile.get("annual_expenses_fire"),
    )

    allocation = calculate_asset_allocation(
        age=age,
        risk_appetite=profile.get("risk_appetite", "moderate")
    )

    # Build year-by-year corpus growth for the chart
    timeline = build_timeline(
        monthly_savings=monthly_savings,
        current_corpus=current_corpus,
        annual_return=annual_return,
        years=min(40, int(fire_result.get("years_to_fire", 30)) + 5)
        if fire_result.get("achievable") else 30
    )

    # SIP breakdown — how much in each fund category
    sip_breakdown = {}
    if monthly_savings > 0:
        for category, pct in allocation["equity_breakdown"].items():
            amount = round(monthly_savings * (allocation["equity_pct"] / 100) * (pct / 100))
            sip_breakdown[category] = amount
        for category, pct in allocation["debt_breakdown"].items():
            amount = round(monthly_savings * (allocation["debt_pct"] / 100) * (pct / 100))
            sip_breakdown[category] = amount

    # Milestones
    milestones = build_milestones(age, fire_result, monthly_income)

    return {
        "fire_result": fire_result,
        "asset_allocation": allocation,
        "timeline": timeline,
        "sip_breakdown": sip_breakdown,
        "milestones": milestones,
        "monthly_savings": monthly_savings,
        "current_age": age,
    }


def build_timeline(monthly_savings: float, current_corpus: float,
                   annual_return: float, years: int) -> list:
    """Year-by-year corpus growth for the chart."""
    timeline = []
    corpus = current_corpus
    monthly_rate = annual_return / 100 / 12

    for year in range(years + 1):
        timeline.append({
            "year": year,
            "corpus": round(corpus),
            "invested": round(current_corpus + monthly_savings * 12 * year),
        })
        # Grow for next year
        for _ in range(12):
            corpus = corpus * (1 + monthly_rate) + monthly_savings

    return timeline


def build_milestones(age: int, fire_result: dict,
                     monthly_income: float) -> list:
    """Key financial milestones on the FIRE journey."""
    milestones = []

    if not fire_result.get("achievable"):
        return milestones

    years = fire_result.get("years_to_fire", 0)
    fire_age = round(age + years)

    # Term insurance — should be bought ASAP
    milestones.append({
        "year": 0,
        "age": age,
        "event": "Buy term insurance",
        "detail": f"Cover = ₹{round(monthly_income * 12 * 10 / 100000)}L (10× annual income)",
        "priority": "urgent"
    })

    # Emergency fund target — 6 months
    milestones.append({
        "year": 1,
        "age": age + 1,
        "event": "Complete emergency fund",
        "detail": "6 months of expenses in liquid fund",
        "priority": "high"
    })

    # Shift to more debt at 40
    if age < 40:
        milestones.append({
            "year": 40 - age,
            "age": 40,
            "event": "Rebalance portfolio",
            "detail": "Shift to 60% equity / 40% debt as you approach 40",
            "priority": "medium"
        })

    # FIRE target
    milestones.append({
        "year": round(years),
        "age": fire_age,
        "event": "🎯 FIRE Target",
        "detail": f"Corpus of ₹{round(fire_result.get('fire_number', 0) / 100000)}L achieved",
        "priority": "goal"
    })

    return sorted(milestones, key=lambda x: x["year"])
