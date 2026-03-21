from fastapi import APIRouter

router = APIRouter()

@router.get("/future-shock/{session_id}")
def get_future_shock(session_id: str):
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
        return {"error": "Not enough data"}

    return compute_future_shock(profile)


def compute_future_shock(profile: dict) -> dict:
    from calculators.tax import calculate_full_tax_liability

    monthly_income   = profile.get("monthly_income", 0)
    monthly_expenses = profile.get("monthly_expenses", monthly_income * 0.6)
    monthly_savings  = profile.get("monthly_savings", monthly_income - monthly_expenses)
    current_corpus   = profile.get("current_corpus") or profile.get("total_investments", 0)
    age              = profile.get("age", 28)

    # ── Current path — user does nothing ──────────────────
    current_sip      = max(0, monthly_savings * 0.3)   # assume only 30% invested
    current_80c      = profile.get("section_80c", 0)
    current_tax      = calculate_full_tax_liability(monthly_income * 12, section_80c=current_80c)
    current_tax_bill = current_tax["old_regime"]["total_tax"] \
                       if current_tax["recommendation"] == "old" \
                       else current_tax["new_regime"]["total_tax"]

    # ── Optimised path — follow Artha-Saathi advice ────────
    optimised_sip    = max(monthly_savings * 0.7, current_sip + 5000)  # invest 70% of savings
    optimised_80c    = 150000   # max out 80C
    optimised_80d    = 25000    # add health insurance
    optimised_nps    = 50000    # add NPS

    opt_tax = calculate_full_tax_liability(
        monthly_income * 12,
        section_80c=optimised_80c,
        section_80d=optimised_80d,
        nps_80ccd1b=optimised_nps
    )
    optimised_tax_bill = opt_tax["old_regime"]["total_tax"] \
                         if opt_tax["recommendation"] == "old" \
                         else opt_tax["new_regime"]["total_tax"]

    annual_tax_saving = round(current_tax_bill - optimised_tax_bill)
    monthly_tax_saving = round(annual_tax_saving / 12)

    # ── 5-year projections ─────────────────────────────────
    def project(monthly_sip, extra_monthly, years=5):
        corpus   = current_corpus
        rate     = 12.0 / 100 / 12
        timeline = []
        for month in range(years * 12 + 1):
            if month % 12 == 0:
                timeline.append({
                    "year": month // 12,
                    "corpus": round(corpus)
                })
            corpus = corpus * (1 + rate) + monthly_sip + extra_monthly
        return timeline

    current_timeline   = project(current_sip, 0)
    optimised_timeline = project(optimised_sip, monthly_tax_saving)

    corpus_at_5yr_current   = current_timeline[-1]["corpus"]
    corpus_at_5yr_optimised = optimised_timeline[-1]["corpus"]
    difference_5yr          = corpus_at_5yr_optimised - corpus_at_5yr_current

    # ── Crisis detection ───────────────────────────────────
    crisis_point = None
    if monthly_savings < monthly_expenses * 0.1:
        years_of_runway = round(current_corpus / (monthly_expenses * 12), 1) if current_corpus > 0 else 0
        if years_of_runway < 3:
            crisis_point = {
                "message": f"At current rate, savings run out in {years_of_runway} years",
                "severity": "critical"
            }

    # ── Key insights ───────────────────────────────────────
    insights = []
    if annual_tax_saving > 5000:
        insights.append({
            "icon": "tax",
            "text": f"You are overpaying ₹{annual_tax_saving:,} in taxes every year",
            "fix": f"Max 80C + NPS → save ₹{annual_tax_saving:,}/year"
        })
    sip_gap = optimised_sip - current_sip
    if sip_gap > 1000:
        insights.append({
            "icon": "sip",
            "text": f"Only ₹{round(current_sip):,}/month is being invested",
            "fix": f"Increase SIP to ₹{round(optimised_sip):,} → ₹{round(difference_5yr/100000, 1)}L more in 5 years"
        })
    if not profile.get("has_term_insurance"):
        insights.append({
            "icon": "insurance",
            "text": "No term insurance detected",
            "fix": f"₹{round(monthly_income * 12 * 10 / 100000)}L cover needed · ~₹800/month premium"
        })

    return {
        "current_path":    current_timeline,
        "optimised_path":  optimised_timeline,
        "difference_5yr":  round(difference_5yr),
        "annual_tax_saving": annual_tax_saving,
        "current_monthly_sip":   round(current_sip),
        "optimised_monthly_sip": round(optimised_sip),
        "corpus_current_5yr":    corpus_at_5yr_current,
        "corpus_optimised_5yr":  corpus_at_5yr_optimised,
        "crisis_point":    crisis_point,
        "insights":        insights,
        "age":             age,
    }
