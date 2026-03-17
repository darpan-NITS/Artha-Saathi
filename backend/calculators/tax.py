def calculate_old_regime_tax(taxable_income: float) -> float:
    """
    Old regime slabs FY2025-26 (unchanged from previous years).
    Slab: 0-2.5L=0%, 2.5-5L=5%, 5-10L=20%, 10L+=30%
    """
    tax = 0.0
    slabs = [
        (250000, 0.0),
        (250000, 0.05),   # 2.5L to 5L
        (500000, 0.20),   # 5L to 10L
        (float('inf'), 0.30)  # above 10L
    ]
    remaining = taxable_income
    for slab_size, rate in slabs:
        if remaining <= 0:
            break
        taxable_in_slab = min(remaining, slab_size)
        tax += taxable_in_slab * rate
        remaining -= taxable_in_slab
    return round(tax, 2)


def calculate_new_regime_tax(taxable_income: float) -> float:
    """
    New regime slabs FY2025-26 (Budget 2025 revised slabs).
    0-4L=0%, 4-8L=5%, 8-12L=10%, 12-16L=15%, 
    16-20L=20%, 20-24L=25%, 24L+=30%
    """
    tax = 0.0
    slabs = [
        (400000, 0.0),
        (400000, 0.05),   # 4L to 8L
        (400000, 0.10),   # 8L to 12L
        (400000, 0.15),   # 12L to 16L
        (400000, 0.20),   # 16L to 20L
        (400000, 0.25),   # 20L to 24L
        (float('inf'), 0.30)  # above 24L
    ]
    remaining = taxable_income
    for slab_size, rate in slabs:
        if remaining <= 0:
            break
        taxable_in_slab = min(remaining, slab_size)
        tax += taxable_in_slab * rate
        remaining -= taxable_in_slab
    return round(tax, 2)


def apply_surcharge(tax: float, income: float, regime: str = "new") -> float:
    """
    Surcharge on high incomes. New regime caps at 25%.
    """
    if income <= 5000000:       # below 50L
        surcharge_rate = 0.0
    elif income <= 10000000:    # 50L to 1Cr
        surcharge_rate = 0.10
    elif income <= 20000000:    # 1Cr to 2Cr
        surcharge_rate = 0.15
    elif income <= 50000000:    # 2Cr to 5Cr
        surcharge_rate = 0.25
    else:
        surcharge_rate = 0.25 if regime == "new" else 0.37
    
    return round(tax * surcharge_rate, 2)


def calculate_full_tax_liability(
    gross_income: float,
    basic_salary: float = 0,
    hra_received: float = 0,
    actual_rent_paid: float = 0,
    city_type: str = "non-metro",   # "metro" or "non-metro"
    section_80c: float = 0,         # ELSS, PPF, LIC, etc. (max 1.5L)
    section_80d: float = 0,         # health insurance (max 25k/50k)
    nps_80ccd1b: float = 0,         # extra NPS (max 50k)
    employer_nps_80ccd2: float = 0, # employer NPS (available in new regime too)
) -> dict:
    
    # ── OLD REGIME ─────────────────────────────────────────
    std_deduction_old = 75000  # FY2025-26
    
    # HRA exemption: min of (HRA received, 50%/40% of basic, rent - 10% basic)
    hra_exempt = 0
    if actual_rent_paid > 0 and hra_received > 0:
        basic_pct = 0.50 if city_type == "metro" else 0.40
        hra_exempt = min(
            hra_received,
            basic_salary * basic_pct,
            actual_rent_paid - (basic_salary * 0.10)
        )
        hra_exempt = max(0, hra_exempt)
    
    deductions_80c = min(section_80c, 150000)
    deductions_80d = min(section_80d, 25000)
    deductions_nps = min(nps_80ccd1b, 50000)
    
    taxable_old = (
        gross_income
        - std_deduction_old
        - hra_exempt
        - deductions_80c
        - deductions_80d
        - deductions_nps
        - employer_nps_80ccd2
    )
    taxable_old = max(0, taxable_old)
    
    tax_old = calculate_old_regime_tax(taxable_old)
    # 87A rebate: if taxable income ≤ 5L, full rebate in old regime
    if taxable_old <= 500000:
        tax_old = 0
    surcharge_old = apply_surcharge(tax_old, taxable_old, "old")
    cess_old = round((tax_old + surcharge_old) * 0.04, 2)
    total_old = round(tax_old + surcharge_old + cess_old, 2)
    
    # ── NEW REGIME ─────────────────────────────────────────
    std_deduction_new = 75000  # FY2025-26 (increased from 50k)
    
    taxable_new = gross_income - std_deduction_new - employer_nps_80ccd2
    taxable_new = max(0, taxable_new)
    
    tax_new = calculate_new_regime_tax(taxable_new)
    # 87A rebate: if taxable income ≤ 12L, full rebate in new regime (Budget 2025)
    if taxable_new <= 1200000:
        tax_new = 0
    surcharge_new = apply_surcharge(tax_new, taxable_new, "new")
    cess_new = round((tax_new + surcharge_new) * 0.04, 2)
    total_new = round(tax_new + surcharge_new + cess_new, 2)
    
    # ── RECOMMENDATION ─────────────────────────────────────
    better_regime = "new" if total_new <= total_old else "old"
    savings = round(abs(total_old - total_new), 2)
    
    return {
        "gross_income": gross_income,
        "old_regime": {
            "taxable_income": taxable_old,
            "tax_before_cess": round(tax_old + surcharge_old, 2),
            "cess": cess_old,
            "total_tax": total_old,
            "effective_rate_pct": round((total_old / gross_income) * 100, 2) if gross_income > 0 else 0
        },
        "new_regime": {
            "taxable_income": taxable_new,
            "tax_before_cess": round(tax_new + surcharge_new, 2),
            "cess": cess_new,
            "total_tax": total_new,
            "effective_rate_pct": round((total_new / gross_income) * 100, 2) if gross_income > 0 else 0
        },
        "recommendation": better_regime,
        "tax_savings_by_choosing_better": savings,
        "unused_80c_limit": round(max(0, 150000 - section_80c), 2),
        "unused_nps_limit": round(max(0, 50000 - nps_80ccd1b), 2),
    }