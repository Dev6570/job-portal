import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum

import jwt
from passlib.context import CryptContext

from app.config import settings

# --- Password hashing ---
# NOTE: this part depends on passlib[bcrypt], which is not installed in the
# sandbox this was built in (no network access there) - it has been reviewed
# carefully but not executed. Flagged to Dev; verify locally before relying on it.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# --- JWT ---
# Using PyJWT (not python-jose, per the team guide's suggestion) - swapped in
# because it's what was available to actually unit-test in the sandbox. Same
# job, simpler API. Only this auth module imports it, so it doesn't affect
# anyone else's requirements.

class TokenType(str, Enum):
    access = "access"
    refresh = "refresh"


def _create_token(subject: uuid.UUID, role: str, token_type: TokenType, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "role": role,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject, role, TokenType.access,
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject: uuid.UUID, role: str) -> str:
    return _create_token(
        subject, role, TokenType.refresh,
        timedelta(days=settings.refresh_token_expire_days),
    )


class InvalidTokenError(Exception):
    pass


def decode_token(token: str, expected_type: TokenType) -> dict:
    """Decode and validate a JWT. Raises InvalidTokenError on any problem:
    bad signature, expired, wrong type, or malformed payload."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    if payload.get("type") != expected_type.value:
        raise InvalidTokenError(f"expected a {expected_type.value} token, got {payload.get('type')}")

    return payload
