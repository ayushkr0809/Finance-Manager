import base64

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import decode_access_token
from database import get_db
from models import User
from security import get_fernet

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class CurrentVault:
    """Bundles the authenticated user with their already-unlocked Fernet
    instance, so every route just asks for one dependency instead of two."""

    def __init__(self, user: User, fernet):
        self.user = user
        self.fernet = fernet


def get_current_vault(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> CurrentVault:
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("user_id")
    vault_key_b64 = payload.get("vault_key")
    if user_id is None or vault_key_b64 is None:
        raise credentials_exception

    user = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if user is None:
        raise credentials_exception

    fernet = get_fernet(base64.urlsafe_b64decode(vault_key_b64))
    return CurrentVault(user=user, fernet=fernet)
