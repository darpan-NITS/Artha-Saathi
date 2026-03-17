def calculate_money_health_score(
    monthly_income: float,
    monthly_expenses: float,
    monthly_savings: float,
    emergency_fund: float,
    has_term_insurance: bool,
    life_cover_amount: float,
    has_health_insurance: bool,
    health_cover_amount: float,
    total_investments: float,
    equity_pct: float,          # % of investments in equity
    total_debt: float,
    monthly_emi: float,
    annual_tax_paid: float,
    annual_tax_optimized: float, # what they should be paying
    has_retirement_account: bool,  # NPS/EPF/PPF
    age: int
) -> dict:
    
    scores = {}
    
    # 1. Emergency Fund (target: 6 months of expenses)
    target_ef = monthly_expenses * 6
    ef_ratio = min(emergency_fund / target_ef, 1.0) if target_ef > 0 else 0
    scores["emergency_fund"] = round(ef_ratio * 100)
    
    # 2. Insurance Coverage
    ins_score = 0
    if has_term_insurance:
        # Life cover should be 10× annual income
        target_life = monthly_income * 12 * 10
        ins_score += min(life_cover_amount / target_life, 1.0) * 50
    if has_health_insurance:
        # Health cover: min ₹5L for metro, ₹3L elsewhere
        target_health = 500000
        ins_score += min(health_cover_amount / target_health, 1.0) * 50
    scores["insurance"] = round(ins_score)
    
    # 3. Investment Diversification
    div_score = 0
    if total_investments > 0:
        # Ideal equity allocation = (100 - age)%
        ideal_equity = max(20, min(80, 100 - age))
        equity_deviation = abs(equity_pct - ideal_equity)
        div_score = max(0, 100 - equity_deviation * 2)
        # Bonus if they actually have investments vs income
        inv_to_income_ratio = total_investments / (monthly_income * 12)
        if inv_to_income_ratio > 2:
            div_score = min(100, div_score + 10)
    scores["investment_diversification"] = round(div_score)
    
    # 4. Debt Health (EMI should be < 40% of income)
    emi_ratio = monthly_emi / monthly_income if monthly_income > 0 else 1
    if emi_ratio <= 0:
        debt_score = 100
    elif emi_ratio <= 0.30:
        debt_score = 100
    elif emi_ratio <= 0.40:
        debt_score = 70
    elif emi_ratio <= 0.60:
        debt_score = 40
    else:
        debt_score = 10
    scores["debt_health"] = debt_score
    
    # 5. Tax Efficiency
    if annual_tax_optimized > 0:
        tax_efficiency = min(annual_tax_optimized / annual_tax_paid, 1.0) if annual_tax_paid > 0 else 1.0
        scores["tax_efficiency"] = round(tax_efficiency * 100)
    else:
        scores["tax_efficiency"] = 50  # unknown, neutral score
    
    # 6. Retirement Readiness
    ret_score = 0
    if has_retirement_account:
        ret_score += 50
    savings_rate = monthly_savings / monthly_income if monthly_income > 0 else 0
    if savings_rate >= 0.20:
        ret_score += 50
    elif savings_rate >= 0.10:
        ret_score += 25
    scores["retirement_readiness"] = min(100, ret_score)
    
    # Overall score (weighted average)
    weights = {
        "emergency_fund": 0.20,
        "insurance": 0.20,
        "investment_diversification": 0.15,
        "debt_health": 0.20,
        "tax_efficiency": 0.10,
        "retirement_readiness": 0.15
    }
    overall = sum(scores[k] * weights[k] for k in weights)
    
    grade = "A" if overall >= 80 else "B" if overall >= 60 else "C" if overall >= 40 else "D"
    
    return {
        "overall_score": round(overall),
        "grade": grade,
        "dimension_scores": scores,
        "interpretation": {
            "A": "Excellent financial health. Stay consistent.",
            "B": "Good foundation. A few gaps to address.",
            "C": "Needs attention. Focus on the lowest scores first.",
            "D": "Critical gaps. Start with emergency fund and insurance."
        }[grade]
    }