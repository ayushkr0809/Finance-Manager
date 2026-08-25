from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import transaction_service as svc
from budget_service import check_budget_alerts
from database import get_db
from dependencies import CurrentVault, get_current_vault
from schemas import TransactionCreate, TransactionOut, TransactionUpdate

router = APIRouter(prefix="/expense", tags=["expense"])


@router.get("", response_model=list[TransactionOut])
def list_expense(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    return svc.list_transactions(db, vault.fernet, vault.user.id, "expense")


@router.post("/preview-alerts")
def preview_budget_alerts(
    data: TransactionCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    """Lets the frontend show a warning banner before the user confirms adding
    the expense — mirrors the CLI printing the alert before saving."""
    alerts = check_budget_alerts(db, vault.fernet, vault.user.id, data.category, float(data.amount))
    return {"alerts": alerts}


@router.post("", response_model=TransactionOut, status_code=201)
def add_expense(
    data: TransactionCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    return svc.create_transaction(db, vault.fernet, vault.user.id, "expense", data)


@router.put("/{txn_id}", response_model=TransactionOut)
def edit_expense(
    txn_id: int,
    data: TransactionUpdate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txn = svc.get_owned_transaction(db, vault.user.id, "expense", txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    return svc.update_transaction(db, vault.fernet, txn, data)


@router.delete("/{txn_id}", status_code=204)
def delete_expense(
    txn_id: int,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txn = svc.get_owned_transaction(db, vault.user.id, "expense", txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    svc.delete_transaction(db, txn)
