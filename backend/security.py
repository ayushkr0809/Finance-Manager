import base64
import os

import bcrypt
from argon2.low_level import Type, hash_secret_raw
from cryptography.fernet import Fernet, InvalidToken


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def new_salt() -> bytes:
    return os.urandom(16)


def derive_key(master_pin: str, salt: bytes) -> bytes:
    """Same Argon2id derivation as the original CLI's key_manager.py."""
    return hash_secret_raw(
        secret=master_pin.encode("utf-8"),
        salt=salt,
        time_cost=3,
        memory_cost=65536,
        parallelism=4,
        hash_len=32,
        type=Type.ID,
    )


def get_fernet(key_bytes: bytes) -> Fernet:
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt_value(fernet: Fernet, value: str) -> bytes:
    return fernet.encrypt(value.encode("utf-8"))


def decrypt_value(fernet: Fernet, value: bytes) -> str:
    if not value:
        return ""
    return fernet.decrypt(value).decode("utf-8")


def key_unlocks_data(fernet: Fernet, sample_encrypted_value: bytes) -> bool:
    """Used at login to confirm the Master PIN was actually correct —
    Argon2id itself can't tell you that, only trying to decrypt something
    with the resulting key can."""
    try:
        fernet.decrypt(sample_encrypted_value)
        return True
    except InvalidToken:
        return False
