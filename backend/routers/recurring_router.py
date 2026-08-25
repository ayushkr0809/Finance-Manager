from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import RecurringExpense, Transaction
from schemas import RecurringCreate, RecurringOut
from security import decrypt_value, encrypt_value

router = APIRouter(prefix="/recurring", tags=["recurring"])


def _to_out(fernet, r: RecurringExpense) -> dict:
    return {
        "id": r.id,
        "category": r.category,
        "amount": decrypt_value(fernet, r.encrypted_amount),
        "notes": decrypt_value(fernet, r.encrypted_notes),
        "frequency": r.frequency,
        "last_processed_date": r.last_processed_date,
    }


@router.get("", response_model=list[RecurringOut])
def list_recurring(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    templates = db.execute(
        select(RecurringExpense).where(RecurringExpense.user_id == vault.user.id)
    ).scalars().all()
    return [_to_out(vault.fernet, r) for r in templates]


@router.post("", response_model=RecurringOut, status_code=201)
def add_recurring(
    data: RecurringCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    r = RecurringExpense(
        user_id=vault.user.id,
        category=data.category,
        frequency=data.frequency,
        encrypted_amount=encrypt_value(vault.fernet, data.amount),
        encrypted_notes=encrypt_value(vault.fernet, data.notes or "Auto"),
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _to_out(vault.fernet, r)


@router.delete("/{recurring_id}", status_code=204)
def delete_recurring(
    recurring_id: int,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    r = db.execute(
        select(RecurringExpense).where(
            RecurringExpense.id == recurring_id, RecurringExpense.user_id == vault.user.id
        )
    ).scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurring template not found")
    db.delete(r)
    db.commit()


@router.post("/process")
def process_recurring(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    """Same daily-catch-up logic as the CLI's 'sync on login' — the frontend
    calls this once when the dashboard loads."""
    today = date.today()
    added = 0

    templates = db.execute(
        select(RecurringExpense).where(RecurringExpense.user_id == vault.user.id)
    ).scalars().all()

    for t in templates:
        if t.frequency != "daily":
            continue
        curr = (t.last_processed_date + timedelta(days=1)) if t.last_processed_date else today
        while curr <= today:
            amount = decrypt_value(vault.fernet, t.encrypted_amount)
            note = decrypt_value(vault.fernet, t.encrypted_notes)
            db.add(
                Transaction(
                    user_id=vault.user.id,
                    type="expense",
                    category=t.category,
                    date=curr,
                    encrypted_amount=encrypt_value(vault.fernet, amount),
                    encrypted_notes=encrypt_value(vault.fernet, f"{note} (Auto)"),
                )
            )
            added += 1
            t.last_processed_date = curr
            curr += timedelta(days=1)

    db.commit()
    return {"added": added}
