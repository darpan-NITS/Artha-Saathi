def calculate_fire_number(
    annual_expenses: float,
    safe_withdrawal_rate: float = 4.0
) -> float:
    """
    FIRE Number = Annual expenses × (100 / SWR)
    At 4% SWR (Trinity Study), you need 25× annual expenses.
    Indian context: use 3.5% SWR due to higher inflation → 28.5× expenses.
    """
    return round(annual_expenses * (100 / safe_withdrawal_rate), 2)


def calculate_years_to_fire(
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    annual_return: float = 12.0,
    annual_expenses_for_fire: float = None,
    inflation_rate: float = 6.0
) -> dict:
    """
    How many years until you reach your FIRE number?
    Simulates year-by-year growth of corpus.
    """
    monthly_savings = monthly_income - monthly_expenses
    
    if monthly_savings <= 0:
        return {
            "achievable": False,
            "reason": "Monthly expenses exceed income. Reduce expenses first.",
            "monthly_deficit": round(abs(monthly_savings), 2)
        }
    
    annual_expenses = (annual_expenses_for_fire or monthly_expenses * 12)
    fire_number = calculate_fire_number(
        annual_expenses * ((1 + inflation_rate / 100) ** 10),  # inflation-adjusted
        safe_withdrawal_rate=3.5  # conservative for India
    )
    
    corpus = current_savings
    monthly_rate = annual_return / 100 / 12
    years = 0
    max_years = 60
    
    while corpus < fire_number and years < max_years:
        corpus = corpus * (1 + monthly_rate) + monthly_savings
        # Increase savings by inflation every 12 months (salary hike assumption)
        if years % 1 == 0 and years > 0:
            monthly_savings *= (1 + inflation_rate / 100 / 12)
        years += 1/12
    
    years = round(years, 1)
    
    return {
        "achievable": True,
        "years_to_fire": years,
        "fire_number": round(fire_number, 2),
        "current_corpus": round(current_savings, 2),
        "monthly_savings": round(monthly_income - monthly_expenses, 2),
        "savings_rate_pct": round((monthly_savings / monthly_income) * 100, 1),
        "projected_corpus_at_fire": round(corpus, 2)
    }


def calculate_asset_allocation(age: int, risk_appetite: str = "moderate") -> dict:
    """
    Age-based glide path for Indian investors.
    Rule: (100 - age)% in equity, rest in debt.
    Adjusted for risk appetite.
    """
    base_equity = 100 - age
    
    adjustments = {"aggressive": 10, "moderate": 0, "conservative": -15}
    equity_pct = max(20, min(90, base_equity + adjustments.get(risk_appetite, 0)))
    debt_pct = 100 - equity_pct
    
    # Indian-specific fund category recommendations
    equity_split = {
        "Large cap / Nifty 50 Index": round(equity_pct * 0.5, 1),
        "ELSS (80C + growth)": round(equity_pct * 0.25, 1),
        "Mid cap": round(equity_pct * 0.25, 1),
    }
    debt_split = {
        "PPF (tax-free, 15yr lock-in)": round(debt_pct * 0.4, 1),
        "NPS Tier-1 (80CCD benefit)": round(debt_pct * 0.3, 1),
        "Debt mutual funds": round(debt_pct * 0.3, 1),
    }
    
    return {
        "age": age,
        "risk_appetite": risk_appetite,
        "equity_pct": equity_pct,
        "debt_pct": debt_pct,
        "equity_breakdown": equity_split,
        "debt_breakdown": debt_split
    }