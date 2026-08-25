from collections import defaultdict
from calendar import monthrange
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Transaction
from schemas import (
    BalanceOut,
    BalanceTrendPoint,
    CategoryTotal,
    DailyExpensePoint,
    MonthlySummaryOut,
    MonthlyTrendPoint,
    YearlySummaryOut,
)
from security import decrypt_value
from transaction_service import sum_amounts

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/balance", response_model=BalanceOut)
def balance(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    income_txns = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.type == "income")
    ).scalars().all()
    expense_txns = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.type == "expense")
    ).scalars().all()

    income = sum_amounts(vault.fernet, income_txns)
    expense = sum_amounts(vault.fernet, expense_txns)
    return {"income": income, "expense": expense, "balance": income - expense}


@router.get("/expense-by-category", response_model=list[CategoryTotal])
def expense_by_category(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    """Same data the CLI turned into a saved pie-chart PNG — here it's plain
    JSON so the React dashboard can render it with a real interactive chart.
    Categories come from the predefined list now, so there's no more
    "Food" vs "food" splitting into separate slices."""
    expenses = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.type == "expense")
    ).scalars().all()

    totals: dict[str, float] = defaultdict(float)
    for t in expenses:
        totals[t.category] += float(decrypt_value(vault.fernet, t.encrypted_amount))

    return [{"category": cat, "total": total} for cat, total in totals.items()]


@router.get("/monthly-trend", response_model=list[MonthlyTrendPoint])
def monthly_trend(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    """Income vs expense totals per month, for the last 6 months that have data."""
    txns = db.execute(select(Transaction).where(Transaction.user_id == vault.user.id)).scalars().all()

    totals: dict[str, dict[str, float]] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for t in txns:
        month_key = t.date.strftime("%Y-%m")
        totals[month_key][t.type] += float(decrypt_value(vault.fernet, t.encrypted_amount))

    months = sorted(totals.keys())[-6:]
    return [{"month": m, "income": totals[m]["income"], "expense": totals[m]["expense"]} for m in months]


@router.get("/daily-expense", response_model=list[DailyExpensePoint])
def daily_expense(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    """Daily expense totals for the last 30 days, including zero-spend days —
    so the line chart shows real gaps instead of skipping straight over them."""
    start = date.today() - timedelta(days=29)

    txns = db.execute(
        select(Transaction).where(
            Transaction.user_id == vault.user.id,
            Transaction.type == "expense",
            Transaction.date >= start,
        )
    ).scalars().all()

    totals: dict[date, float] = defaultdict(float)
    for t in txns:
        totals[t.date] += float(decrypt_value(vault.fernet, t.encrypted_amount))

    return [{"date": start + timedelta(days=i), "total": totals.get(start + timedelta(days=i), 0.0)} for i in range(30)]


@router.get("/monthly", response_model=MonthlySummaryOut)
def monthly_summary(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    """Full breakdown for one specific month — income, expense, balance,
    and where the expenses went category by category."""
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])

    txns = db.execute(
        select(Transaction).where(
            Transaction.user_id == vault.user.id,
            Transaction.date >= start,
            Transaction.date <= end,
        )
    ).scalars().all()

    income = 0.0
    expense = 0.0
    by_category: dict[str, float] = defaultdict(float)

    for t in txns:
        amount = float(decrypt_value(vault.fernet, t.encrypted_amount))
        if t.type == "income":
            income += amount
        else:
            expense += amount
            by_category[t.category] += amount

    return {
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": len(txns),
        "by_category": [{"category": c, "total": v} for c, v in by_category.items()],
    }


@router.get("/yearly", response_model=YearlySummaryOut)
def yearly_summary(
    year: int = Query(...),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    """Full breakdown for one calendar year — totals, a month-by-month
    income/expense split, and category spending across the whole year."""
    start = date(year, 1, 1)
    end = date(year, 12, 31)

    txns = db.execute(
        select(Transaction).where(
            Transaction.user_id == vault.user.id,
            Transaction.date >= start,
            Transaction.date <= end,
        )
    ).scalars().all()

    income = 0.0
    expense = 0.0
    by_month: dict[int, dict[str, float]] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    by_category: dict[str, float] = defaultdict(float)

    for t in txns:
        amount = float(decrypt_value(vault.fernet, t.encrypted_amount))
        by_month[t.date.month][t.type] += amount
        if t.type == "income":
            income += amount
        else:
            expense += amount
            by_category[t.category] += amount

    monthly_breakdown = [
        {"month": m, "income": by_month[m]["income"], "expense": by_month[m]["expense"]} for m in range(1, 13)
    ]

    return {
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "monthly_breakdown": monthly_breakdown,
        "by_category": [{"category": c, "total": v} for c, v in by_category.items()],
    }


@router.get("/balance-trend", response_model=list[BalanceTrendPoint])
def balance_trend(
    days: int = Query(90, ge=7, le=365),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    """Running (cumulative) balance day by day, so you can see the overall
    trend line rather than just isolated period totals."""
    start = date.today() - timedelta(days=days - 1)

    # Balance carried in from before the window, so the line starts at the
    # real running total instead of resetting to zero at the window edge.
    prior_txns = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.date < start)
    ).scalars().all()
    running = 0.0
    for t in prior_txns:
        amount = float(decrypt_value(vault.fernet, t.encrypted_amount))
        running += amount if t.type == "income" else -amount

    window_txns = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.date >= start)
    ).scalars().all()
    daily_net: dict[date, float] = defaultdict(float)
    for t in window_txns:
        amount = float(decrypt_value(vault.fernet, t.encrypted_amount))
        daily_net[t.date] += amount if t.type == "income" else -amount

    points = []
    for i in range(days):
        d = start + timedelta(days=i)
        running += daily_net.get(d, 0.0)
        points.append({"date": d, "balance": running})
    return points
