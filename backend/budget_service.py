from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Budget, Transaction
from transaction_service import sum_amounts


def check_budget_alerts(db: Session, fernet, user_id: int, category: str, new_amount: float) -> list[str]:
    """Returns any budget-warning messages triggered by adding this expense —
    same two checks as the original CLI (category budget, then overall budget)."""
    alerts: list[str] = []
    start_of_month = date.today().replace(day=1)

    budget = db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.category == category)
    ).scalars().first()
    if budget:
        txns = db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.category == category,
                Transaction.date >= start_of_month,
            )
        ).scalars().all()
        spent = sum_amounts(fernet, txns)
        if spent + new_amount > budget.monthly_limit:
            alerts.append(
                f"Exceeded '{category}' budget! Limit: ${budget.monthly_limit:.2f}, "
                f"Current: ${spent:.2f}, Adding: ${new_amount:.2f}"
            )

    overall = db.execute(
        select(Budget).where(Budget.user_id == user_id, Budget.category == "Overall")
    ).scalars().first()
    if overall:
        txns = db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.type == "expense",
                Transaction.date >= start_of_month,
            )
        ).scalars().all()
        spent = sum_amounts(fernet, txns)
        if spent + new_amount > overall.monthly_limit:
            alerts.append(
                f"Exceeded OVERALL budget! Limit: ${overall.monthly_limit:.2f}, "
                f"Current: ${spent:.2f}, Adding: ${new_amount:.2f}"
            )

    return alerts
