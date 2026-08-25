from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Transaction
from schemas import TransactionOut
from transaction_service import to_out

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/category", response_model=list[TransactionOut])
def search_by_category(
    q: str = Query(..., description="Category text to search for"),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    q_lower = q.lower()
    txns = db.execute(select(Transaction).where(Transaction.user_id == vault.user.id)).scalars().all()
    matches = [t for t in txns if q_lower in t.category.lower()]
    return [to_out(vault.fernet, t) for t in matches]


@router.get("/date", response_model=list[TransactionOut])
def search_by_date(
    date_value: date = Query(..., alias="date"),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txns = db.execute(
        select(Transaction).where(Transaction.user_id == vault.user.id, Transaction.date == date_value)
    ).scalars().all()
    return [to_out(vault.fernet, t) for t in txns]


@router.get("/amount", response_model=list[TransactionOut])
def search_by_amount(
    amount: str = Query(...),
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txns = db.execute(select(Transaction).where(Transaction.user_id == vault.user.id)).scalars().all()
    matches = [t for t in txns if to_out(vault.fernet, t)["amount"] == amount]
    return matches
