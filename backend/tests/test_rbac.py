from app.auth.rbac import role_is_allowed
from app.roles import UserRole


def test_allowed_role_passes():
    assert role_is_allowed(UserRole.admin, (UserRole.admin,)) is True


def test_disallowed_role_fails():
    assert role_is_allowed(UserRole.student, (UserRole.admin,)) is False


def test_multiple_allowed_roles():
    assert role_is_allowed(UserRole.company, (UserRole.company, UserRole.admin)) is True
    assert role_is_allowed(UserRole.student, (UserRole.company, UserRole.admin)) is False


def test_empty_allowed_roles_denies_everyone():
    assert role_is_allowed(UserRole.admin, ()) is False
