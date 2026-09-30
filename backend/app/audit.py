import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth.utils import InvalidTokenError, TokenType, decode_token
from app.database import SessionLocal
from app.models import AuditLog

AUDITED_METHODS = {"POST", "PATCH", "DELETE"}


def _try_get_user_id(request: Request) -> uuid.UUID | None:
    """Best-effort: pull the user id out of the bearer token if present.
    Never raises - an audit row with user_id=None is fine for anonymous
    endpoints like /auth/register, but we still want the row written."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        claims = decode_token(token, TokenType.access)
        return uuid.UUID(claims["sub"])
    except (InvalidTokenError, KeyError, ValueError):
        return None


def _write_audit_row(request: Request, status_code: int) -> None:
    """Isolated so a DB failure while logging can never mask/replace
    the real exception that triggered the finally block below."""
    db = SessionLocal()
    try:
        db.add(
            AuditLog(
                user_id=_try_get_user_id(request),
                method=request.method,
                path=request.url.path,
                status_code=status_code,
            )
        )
        db.commit()
    except Exception:
        # Logging must never take down the request or hide the original error.
        # TODO(team): route this to real logging once we have one.
        pass
    finally:
        db.close()


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        status_code = 500  # default if call_next raises before producing a response
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            if request.method in AUDITED_METHODS:
                _write_audit_row(request, status_code)
