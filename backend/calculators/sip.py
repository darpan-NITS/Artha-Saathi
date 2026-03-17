def calculate_sip_future_value(
    monthly_investment: float,
    annual_rate: float,
    years: int
) -> dict:
    """
    SIP Future Value with monthly compounding.
    FV = P × [((1+r)^n − 1) / r] × (1+r)
    
    Example: ₹10,000/month at 12% for 20 years = ₹99.9 lakh
    """
    r = annual_rate / 100 / 12          # monthly rate
    n = years * 12                       # total months
    
    if r == 0:
        fv = monthly_investment * n
    else:
        fv = monthly_investment * (((1 + r) ** n - 1) / r) * (1 + r)
    
    total_invested = monthly_investment * n
    wealth_gained = fv - total_invested
    
    return {
        "future_value": round(fv, 2),
        "total_invested": round(total_invested, 2),
        "wealth_gained": round(wealth_gained, 2),
        "absolute_return_pct": round((wealth_gained / total_invested) * 100, 2)
    }


def calculate_required_sip(
    target_amount: float,
    annual_rate: float,
    years: int
) -> float:
    """
    Reverse SIP: how much monthly SIP do I need to reach a target?
    P = FV × r / [((1+r)^n − 1) × (1+r)]
    """
    r = annual_rate / 100 / 12
    n = years * 12
    
    if r == 0:
        return round(target_amount / n, 2)
    
    sip = target_amount * r / (((1 + r) ** n - 1) * (1 + r))
    return round(sip, 2)


def calculate_sip_with_inflation(
    monthly_investment: float,
    annual_rate: float,
    years: int,
    inflation_rate: float = 6.0
) -> dict:
    """
    Real return adjusted for Indian inflation (default 6%).
    Real rate = ((1 + nominal) / (1 + inflation)) - 1
    """
    nominal = annual_rate / 100
    inflation = inflation_rate / 100
    real_rate = ((1 + nominal) / (1 + inflation)) - 1
    
    result = calculate_sip_future_value(monthly_investment, real_rate * 100, years)
    result["inflation_adjusted"] = True
    result["real_rate_used"] = round(real_rate * 100, 2)
    return result