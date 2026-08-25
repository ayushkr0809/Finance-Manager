from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Transaction
from security import decrypt_value, encrypt_value


def to_out(fernet, txn: Transaction) -> dict:
    return {
        "id": txn.id,
        "type": txn.type,
        "category": txn.category,
        "date": txn.date,
        "amount": decrypt_value(fernet, txn.encrypted_amount),
        "notes": decrypt_value(fernet, txn.encrypted_notes),
    }


def list_transactions(db: Session, fernet, user_id: int, txn_type: str) -> list[dict]:
    txns = db.execute(
        select(Transaction).where(Transaction.user_id == user_id, Transaction.type == txn_type)
    ).scalars().all()
    return [to_out(fernet, t) for t in txns]


def create_transaction(db: Session, fernet, user_id: int, txn_type: str, data) -> dict:
    txn = Transaction(
        user_id=user_id,
        type=txn_type,
        category=data.category,
        date=data.date,
        encrypted_amount=encrypt_value(fernet, data.amount),
        encrypted_notes=encrypt_value(fernet, data.notes or ""),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return to_out(fernet, txn)


def get_owned_transaction(db: Session, user_id: int, txn_type: str, txn_id: int) -> Transaction | None:
    return db.execute(
        select(Transaction).where(
            Transaction.id == txn_id,
            Transaction.user_id == user_id,
            Transaction.type == txn_type,
        )
    ).scalars().first()


def update_transaction(db: Session, fernet, txn: Transaction, data) -> dict:
    if data.amount is not None:
        txn.encrypted_amount = encrypt_value(fernet, data.amount)
    if data.category is not None:
        txn.category = data.category
    if data.date is not None:
        txn.date = data.date
    if data.notes is not None:
        txn.encrypted_notes = encrypt_value(fernet, data.notes)
    db.commit()
    db.refresh(txn)
    return to_out(fernet, txn)


def delete_transaction(db: Session, txn: Transaction) -> None:
    db.delete(txn)
    db.commit()


def sum_amounts(fernet, txns: list[Transaction]) -> float:
    return sum(float(decrypt_value(fernet, t.encrypted_amount)) for t in txns)
