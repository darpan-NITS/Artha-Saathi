from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class TaxRequest(BaseModel):
    session_id: str
    override_80c: Optional[float] = None
    override_80d: Optional[float] = None
    override_nps: Optional[float] = None

@router.get("/tax/{session_id}")
def get_tax_plan(session_id: str):
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
        return {"error": "Not enough profile data"}

    return compute_tax(profile)


@router.post("/tax/optimize")
def optimize_tax(req: TaxRequest):
    """Called when user adjusts deduction sliders."""
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

    if req.override_80c is not None:
        profile["section_80c"] = req.override_80c
    if req.override_80d is not None:
        profile["section_80d"] = req.override_80d
    if req.override_nps is not None:
        profile["nps_80ccd1b"] = req.override_nps

    return compute_tax(profile)


def compute_tax(profile: dict) -> dict:
    from calculators.tax import calculate_full_tax_liability

    monthly_income = profile.get("monthly_income", 0)
    gross_annual = monthly_income * 12

    result = calculate_full_tax_liability(
        gross_income=gross_annual,
        basic_salary=profile.get("basic_salary", gross_annual * 0.4),
        hra_received=profile.get("hra_received", 0),
        actual_rent_paid=profile.get("actual_rent_paid", 0),
        city_type=profile.get("city_type", "non-metro"),
        section_80c=profile.get("section_80c", 0),
        section_80d=profile.get("section_80d", 0),
        nps_80ccd1b=profile.get("nps_80ccd1b", 0),
        employer_nps_80ccd2=profile.get("employer_nps_80ccd2", 0),
    )

    # Build deduction opportunities — what the user is MISSING
    current_80c = profile.get("section_80c", 0)
    current_80d = profile.get("section_80d", 0)
    current_nps = profile.get("nps_80ccd1b", 0)

    opportunities = []

    if current_80c < 150000:
        gap = 150000 - current_80c
        tax_saved = round(gap * 0.30)  # conservative 30% bracket estimate
        opportunities.append({
            "section": "80C",
            "title": "Invest more in ELSS / PPF",
            "current": current_80c,
            "limit": 150000,
            "gap": gap,
            "estimated_tax_saving": tax_saved,
            "options": ["ELSS mutual fund (tax + growth)", "PPF (safe, 15yr)",
                        "NPS Tier-1", "Life insurance premium"]
        })

    if current_80d < 25000:
        gap = 25000 - current_80d
        tax_saved = round(gap * 0.20)
        opportunities.append({
            "section": "80D",
            "title": "Buy health insurance",
            "current": current_80d,
            "limit": 25000,
            "gap": gap,
            "estimated_tax_saving": tax_saved,
            "options": ["Family floater health plan (HDFC Ergo, Star Health)",
                        "Parents' health insurance — extra ₹25k–50k deduction"]
        })

    if current_nps < 50000:
        gap = 50000 - current_nps
        tax_saved = round(gap * 0.30)
        opportunities.append({
            "section": "80CCD(1B)",
            "title": "NPS additional contribution",
            "current": current_nps,
            "limit": 50000,
            "gap": gap,
            "estimated_tax_saving": tax_saved,
            "options": ["NPS Tier-1 (over and above 80C limit)",
                        "Additional ₹50,000 deduction exclusively for NPS"]
        })

    total_potential_saving = sum(o["estimated_tax_saving"] for o in opportunities)

    # Which regime wins and by how much per month
    old_tax = result["old_regime"]["total_tax"]
    new_tax = result["new_regime"]["total_tax"]
    monthly_difference = round(abs(old_tax - new_tax) / 12)

    return {
        "tax_result": result,
        "opportunities": opportunities,
        "total_potential_saving": total_potential_saving,
        "monthly_difference": monthly_difference,
        "current_deductions": {
            "section_80c": current_80c,
            "section_80d": current_80d,
            "nps_80ccd1b": current_nps,
        },
        "gross_annual_income": gross_annual,
    }
