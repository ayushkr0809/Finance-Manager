from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Budget, Transaction
from schemas import BudgetOut, BudgetSet
from transaction_service import sum_amounts

router = APIRouter(prefix="/budget", tags=["budget"])


@router.post("", response_model=BudgetOut)
def set_budget(
    data: BudgetSet,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    existing = db.execute(
        select(Budget).where(Budget.user_id == vault.user.id, Budget.category == data.category)
    ).scalars().first()

    if existing:
        existing.monthly_limit = data.monthly_limit
    else:
        existing = Budget(user_id=vault.user.id, category=data.category, monthly_limit=data.monthly_limit)
        db.add(existing)
    db.commit()
    db.refresh(existing)

    return _to_budget_out(db, vault, existing)


@router.get("", response_model=list[BudgetOut])
def view_budgets(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    budgets = db.execute(select(Budget).where(Budget.user_id == vault.user.id)).scalars().all()
    return [_to_budget_out(db, vault, b) for b in budgets]


def _to_budget_out(db: Session, vault: CurrentVault, budget: Budget) -> dict:
    start_of_month = date.today().replace(day=1)
    query = select(Transaction).where(
        Transaction.user_id == vault.user.id,
        Transaction.type == "expense",
        Transaction.date >= start_of_month,
    )
    if budget.category != "Overall":
        query = query.where(Transaction.category == budget.category)

    txns = db.execute(query).scalars().all()
    spent = sum_amounts(vault.fernet, txns)

    return {
        "category": budget.category,
        "monthly_limit": budget.monthly_limit,
        "spent": spent,
        "remaining": budget.monthly_limit - spent,
    }
