from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import CurrentVault, get_current_vault
from models import Goal
from schemas import GoalContribute, GoalCreate, GoalOut
from security import decrypt_value, encrypt_value

router = APIRouter(prefix="/goals", tags=["goals"])


def _to_out(fernet, g: Goal) -> dict:
    return {
        "id": g.id,
        "name": g.name,
        "target_amount": decrypt_value(fernet, g.encrypted_target_amount),
        "current_amount": decrypt_value(fernet, g.encrypted_current_amount),
        "target_date": g.target_date,
    }


@router.get("", response_model=list[GoalOut])
def list_goals(vault: CurrentVault = Depends(get_current_vault), db: Session = Depends(get_db)):
    goals = db.execute(select(Goal).where(Goal.user_id == vault.user.id)).scalars().all()
    return [_to_out(vault.fernet, g) for g in goals]


@router.post("", response_model=GoalOut, status_code=201)
def add_goal(
    data: GoalCreate,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    goal = Goal(
        user_id=vault.user.id,
        name=data.name,
        target_date=data.target_date,
        encrypted_target_amount=encrypt_value(vault.fernet, data.target_amount),
        encrypted_current_amount=encrypt_value(vault.fernet, "0"),
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_out(vault.fernet, goal)


@router.post("/{goal_id}/contribute", response_model=GoalOut)
def contribute_to_goal(
    goal_id: int,
    data: GoalContribute,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    goal = db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == vault.user.id)
    ).scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    current = float(decrypt_value(vault.fernet, goal.encrypted_current_amount))
    current += float(data.amount)
    goal.encrypted_current_amount = encrypt_value(vault.fernet, str(current))

    db.commit()
    db.refresh(goal)
    return _to_out(vault.fernet, goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    vault: CurrentVault = Depends(get_current_vault),
    db: Session = Depends(get_db),
):
    goal = db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == vault.user.id)
    ).scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
