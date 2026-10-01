import uuid

from fastapi.testclient import TestClient

from app.auth.utils import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import AuditLog, User
from app.roles import UserRole


def _make_user(db, role, tag, is_active=True):
    user = User(
        email=f"test-status-{tag}-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="not-a-real-hash",  # never logged in with; only used for role/RBAC checks
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth_header(user):
    token = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


def _cleanup(db, *users):
    ids = [u.id for u in users]
    # Every PATCH made during these tests runs through AuditLogMiddleware,
    # which writes an audit_logs row referencing the acting admin's user_id.
    # That FK has no ON DELETE CASCADE, so the audit rows must go first or
    # deleting the test users violates the constraint.
    db.query(AuditLog).filter(AuditLog.user_id.in_(ids)).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_admin_can_deactivate_and_reactivate_a_student():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin-a")
    student = _make_user(db, UserRole.student, "student-a")

    try:
        resp = client.patch(f"/admin/users/{student.id}/deactivate", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text
        assert resp.json()["is_active"] is False

        db.refresh(student)
        assert student.is_active is False

        resp = client.patch(f"/admin/users/{student.id}/activate", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text
        assert resp.json()["is_active"] is True
    finally:
        _cleanup(db, admin, student)


def test_admin_cannot_deactivate_self():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin-b")

    try:
        resp = client.patch(f"/admin/users/{admin.id}/deactivate", headers=_auth_header(admin))
        assert resp.status_code == 400, resp.text
    finally:
        _cleanup(db, admin)


def test_one_admin_can_deactivate_a_different_admin():
    # Confirms deactivating someone else (not yourself) is allowed even when
    # the target is also an admin - self-protection is what matters, not role.
    db = SessionLocal()
    client = TestClient(app)
    admin_a = _make_user(db, UserRole.admin, "admin-c")
    admin_b = _make_user(db, UserRole.admin, "admin-d")

    try:
        resp = client.patch(f"/admin/users/{admin_b.id}/deactivate", headers=_auth_header(admin_a))
        assert resp.status_code == 200, resp.text
        assert resp.json()["is_active"] is False
    finally:
        _cleanup(db, admin_a, admin_b)


def test_deactivating_a_nonexistent_user_returns_404():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin-e")

    try:
        resp = client.patch(f"/admin/users/{uuid.uuid4()}/deactivate", headers=_auth_header(admin))
        assert resp.status_code == 404, resp.text
    finally:
        _cleanup(db, admin)


def test_deactivated_user_cannot_authenticate():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin-f")
    student = _make_user(db, UserRole.student, "student-b")

    try:
        resp = client.patch(f"/admin/users/{student.id}/deactivate", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text

        # a token minted for the now-deactivated student must be rejected everywhere,
        # since get_current_user checks is_active on every protected route
        resp = client.get("/auth/me", headers=_auth_header(student))
        assert resp.status_code == 401, resp.text
    finally:
        _cleanup(db, admin, student)
