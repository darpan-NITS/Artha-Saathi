"""
Run with: python -m pytest calculators/tests.py -v
Install pytest first: pip install pytest
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from calculators.sip import calculate_sip_future_value, calculate_required_sip
from calculators.fire import calculate_fire_number, calculate_years_to_fire
from calculators.tax import calculate_full_tax_liability
from calculators.health_score import calculate_money_health_score


# ── SIP TESTS ──────────────────────────────────────────────
def test_sip_standard_case():
    """₹10,000/month at 12% for 20 years ≈ ₹99.9 lakh"""
    result = calculate_sip_future_value(10000, 12.0, 20)
    assert 9900000 <= result["future_value"] <= 10100000, \
        f"Expected ~₹99.9L, got {result['future_value']}"

def test_sip_zero_return():
    """At 0% return, FV = monthly × months"""
    result = calculate_sip_future_value(5000, 0.0, 10)
    assert result["future_value"] == 600000.0

def test_required_sip():
    """Reverse SIP should be consistent with forward SIP"""
    target = 10000000  # 1 crore
    sip = calculate_required_sip(target, 12.0, 20)
    # Verify by forward calculation
    result = calculate_sip_future_value(sip, 12.0, 20)
    assert abs(result["future_value"] - target) < 1000, \
        f"Round-trip mismatch: {result['future_value']} vs {target}"


# ── FIRE TESTS ─────────────────────────────────────────────
def test_fire_number_4pct():
    """At 4% SWR, FIRE = 25× annual expenses"""
    assert calculate_fire_number(1200000, 4.0) == 30000000.0

def test_fire_negative_savings():
    """Should return not achievable if expenses > income"""
    result = calculate_years_to_fire(50000, 60000, 100000)
    assert result["achievable"] is False


# ── TAX TESTS ──────────────────────────────────────────────
def test_tax_zero_income():
    result = calculate_full_tax_liability(0)
    assert result["old_regime"]["total_tax"] == 0
    assert result["new_regime"]["total_tax"] == 0

def test_tax_12lpa_new_regime_rebate():
    """₹12L income in new regime → zero tax after 87A rebate"""
    result = calculate_full_tax_liability(1200000)
    assert result["new_regime"]["total_tax"] == 0, \
        f"12L should have 0 tax in new regime, got {result['new_regime']['total_tax']}"

def test_tax_5lpa_old_regime_rebate():
    """₹5L income in old regime → zero tax after 87A rebate"""
    result = calculate_full_tax_liability(500000)
    assert result["old_regime"]["total_tax"] == 0

def test_tax_recommendation_high_income():
    """High income with no deductions → new regime often better"""
    result = calculate_full_tax_liability(2000000)  # 20LPA
    # Should produce a clear recommendation
    assert result["recommendation"] in ["old", "new"]

def test_tax_with_full_80c():
    """Using full 80C should reduce old regime tax"""
    without = calculate_full_tax_liability(1000000)
    with_80c = calculate_full_tax_liability(1000000, section_80c=150000)
    assert with_80c["old_regime"]["total_tax"] <= without["old_regime"]["total_tax"]


# ── HEALTH SCORE TESTS ─────────────────────────────────────
def test_health_score_perfect():
    """A user with everything in order should score 80+"""
    result = calculate_money_health_score(
        monthly_income=100000, monthly_expenses=50000,
        monthly_savings=30000, emergency_fund=300000,
        has_term_insurance=True, life_cover_amount=10000000,
        has_health_insurance=True, health_cover_amount=500000,
        total_investments=2000000, equity_pct=65,
        total_debt=0, monthly_emi=0,
        annual_tax_paid=50000, annual_tax_optimized=50000,
        has_retirement_account=True, age=30
    )
    assert result["overall_score"] >= 80, \
        f"Perfect user should score 80+, got {result['overall_score']}"

def test_health_score_no_emergency_fund():
    """Zero emergency fund should drag the score down"""
    result = calculate_money_health_score(
        monthly_income=80000, monthly_expenses=60000,
        monthly_savings=10000, emergency_fund=0,
        has_term_insurance=False, life_cover_amount=0,
        has_health_insurance=False, health_cover_amount=0,
        total_investments=100000, equity_pct=50,
        total_debt=500000, monthly_emi=20000,
        annual_tax_paid=80000, annual_tax_optimized=60000,
        has_retirement_account=False, age=28
    )
    assert result["overall_score"] < 50
    assert result["dimension_scores"]["emergency_fund"] == 0


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])