from app.roles import UserRole


def role_is_allowed(user_role: UserRole, allowed_roles: tuple[UserRole, ...]) -> bool:
    """The actual RBAC decision. Kept dependency-free (no FastAPI/DB) so it can
    be unit-tested directly, separately from the FastAPI wiring in dependencies.py."""
    return user_role in allowed_roles
