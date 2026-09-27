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


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method in AUDITED_METHODS:
            db = SessionLocal()
            try:
                db.add(
                    AuditLog(
                        user_id=_try_get_user_id(request),
                        method=request.method,
                        path=request.url.path,
                        status_code=response.status_code,
                    )
                )
                db.commit()
            finally:
                db.close()

        return response
