import json
from agents.base import log_trace
from calculators.sip import calculate_sip_future_value, calculate_required_sip
from calculators.fire import calculate_years_to_fire, calculate_asset_allocation
from calculators.tax import calculate_full_tax_liability
from calculators.health_score import calculate_money_health_score

def run_calculations(profile: dict, requested_feature: str, 
                     session_id: str) -> dict:
    """
    Runs the appropriate calculations based on profile data and feature.
    requested_feature: "health_score" | "fire" | "tax" | "sip"
    """
    results = {}
    errors = []

    try:
        if requested_feature in ("health_score", "full"):
            if all(profile.get(f) is not None for f in 
                   ["monthly_income", "monthly_expenses", "age"]):
                
                results["health_score"] = calculate_money_health_score(
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
            else:
                errors.append("health_score: need monthly_income, monthly_expenses, age")

        if requested_feature in ("fire", "full"):
            if all(profile.get(f) is not None for f in 
                   ["monthly_income", "monthly_expenses"]):

                results["fire"] = calculate_years_to_fire(
                    monthly_income=profile["monthly_income"],
                    monthly_expenses=profile["monthly_expenses"],
                    current_savings=profile.get("current_corpus") or profile.get("total_investments", 0),
                    annual_return=12.0,
                    annual_expenses_for_fire=profile.get("annual_expenses_fire"),
                )
                results["asset_allocation"] = calculate_asset_allocation(
                    age=profile.get("age", 30),
                    risk_appetite=profile.get("risk_appetite", "moderate")
                )
            else:
                errors.append("fire: need monthly_income, monthly_expenses")

        if requested_feature in ("tax", "full"):
            if profile.get("monthly_income"):
                gross_annual = profile["monthly_income"] * 12
                results["tax"] = calculate_full_tax_liability(
                    gross_income=gross_annual,
                    basic_salary=profile.get("basic_salary", gross_annual * 0.4),
                    hra_received=profile.get("hra_received", 0),
                    actual_rent_paid=profile.get("actual_rent_paid", 0),
                    city_type=profile.get("city_type", "non-metro"),
                    section_80c=profile.get("section_80c", 0),
                    section_80d=profile.get("section_80d", 0),
                    nps_80ccd1b=profile.get("nps_80ccd1b", 0),
                )
            else:
                errors.append("tax: need monthly_income")

        if requested_feature == "sip" and profile.get("monthly_savings"):
            results["sip"] = calculate_sip_future_value(
                monthly_investment=profile["monthly_savings"] * 0.5,
                annual_rate=12.0,
                years=20
            )

    except Exception as e:
        errors.append(f"Calculation error: {str(e)}")

    log_trace(
        session_id=session_id,
        agent_name="CalculatorAgent",
        input_summary=f"Feature: {requested_feature}, Profile fields: {sum(1 for v in profile.values() if v is not None)}",
        output_summary=f"Computed: {list(results.keys())}, Errors: {errors}",
        reasoning="Ran calculations based on available profile data"
    )

    return {"results": results, "errors": errors}