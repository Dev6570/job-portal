import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.rbac import role_is_allowed
from app.auth.utils import InvalidTokenError, TokenType, decode_token
from app.database import get_db
from app.models import User
from app.roles import UserRole

# tokenUrl is just for the OpenAPI docs "Authorize" button; login itself is POST /auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_error

    try:
        payload = decode_token(token, TokenType.access)
    except InvalidTokenError:
        raise credentials_error

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error

    return user


def require_role(*roles: UserRole):
    """
    Reusable by every other member's routers, e.g.:
        @router.post("/drives", dependencies=[Depends(require_role(UserRole.company))])
        @router.patch("/admin/companies/{id}/verify", dependencies=[Depends(require_role(UserRole.admin))])
    """

    def dependency(user: User = Depends(get_current_user)) -> User:
        if not role_is_allowed(user.role, roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return dependency
