from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from auth import create_access_token
from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Budget, Goal, RecurringExpense, Transaction, User
from schemas import AccountDeleteIn, CurrencyUpdate, LoginIn, RegisterIn, TokenOut
from security import derive_key, get_fernet, hash_password, key_unlocks_data, new_salt, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

SUPPORTED_CURRENCIES = {"INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"}


@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.username == data.username)).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        master_salt=new_salt(),
    )
    db.add(user)
    db.commit()
    return {"message": "Registered successfully"}


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.username == data.username)).scalars().first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    vault_key = derive_key(data.master_pin, user.master_salt)
    fernet = get_fernet(vault_key)

    # Argon2id can't tell us if the PIN was right on its own — it always
    # produces *some* key. We confirm it's the *right* key by trying to
    # decrypt one of the user's own existing transactions with it.
    sample = db.execute(
        select(Transaction).where(Transaction.user_id == user.id)
    ).scalars().first()
    if sample and not key_unlocks_data(fernet, sample.encrypted_amount):
        raise HTTPException(status_code=401, detail="Incorrect Master PIN")

    token = create_access_token(user.id, vault_key)
    return {"access_token": token, "token_type": "bearer"}


@router.delete("/account", status_code=204)
def delete_account(
    data: AccountDeleteIn,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    user = vault.user

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Re-derive a key from the freshly-typed PIN and check it independently —
    # don't just trust vault.fernet from the token, since that proves the
    # token is valid, not that the person typing right now knows the PIN.
    check_key = derive_key(data.master_pin, user.master_salt)
    check_fernet = get_fernet(check_key)
    sample = db.execute(select(Transaction).where(Transaction.user_id == user.id)).scalars().first()
    if sample and not key_unlocks_data(check_fernet, sample.encrypted_amount):
        raise HTTPException(status_code=401, detail="Incorrect Master PIN")

    db.execute(delete(Transaction).where(Transaction.user_id == user.id))
    db.execute(delete(RecurringExpense).where(RecurringExpense.user_id == user.id))
    db.execute(delete(Budget).where(Budget.user_id == user.id))
    db.execute(delete(Goal).where(Goal.user_id == user.id))
    db.delete(user)
    db.commit()


@router.patch("/currency")
def update_currency(
    data: CurrencyUpdate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    code = data.currency.upper()
    if code not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {code}")

    vault.user.currency = code
    db.commit()
    return {"currency": code}
