import base64
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(user_id: int, vault_key: bytes) -> str:
    """The vault key (derived from the Master PIN) rides inside the token,
    so the server never has to remember anything about your session.
    Anyone holding this token can decrypt your data — same risk profile as
    any bearer token, which is why it still needs HTTPS + a real expiry."""
    payload = {
        "user_id": user_id,
        "vault_key": base64.urlsafe_b64encode(vault_key).decode("utf-8"),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
