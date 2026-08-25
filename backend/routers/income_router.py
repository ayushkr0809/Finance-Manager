from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import transaction_service as svc
from database import get_db
from dependencies import CurrentVault, get_current_vault
from schemas import TransactionCreate, TransactionOut, TransactionUpdate

router = APIRouter(prefix="/income", tags=["income"])


@router.get("", response_model=list[TransactionOut])
def list_income(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    return svc.list_transactions(db, vault.fernet, vault.user.id, "income")


@router.post("", response_model=TransactionOut, status_code=201)
def add_income(
    data: TransactionCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    return svc.create_transaction(db, vault.fernet, vault.user.id, "income", data)


@router.put("/{txn_id}", response_model=TransactionOut)
def edit_income(
    txn_id: int,
    data: TransactionUpdate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txn = svc.get_owned_transaction(db, vault.user.id, "income", txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Income entry not found")
    return svc.update_transaction(db, vault.fernet, txn, data)


@router.delete("/{txn_id}", status_code=204)
def delete_income(
    txn_id: int,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    txn = svc.get_owned_transaction(db, vault.user.id, "income", txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Income entry not found")
    svc.delete_transaction(db, txn)
