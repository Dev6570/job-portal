import uuid
from datetime import timedelta

from fastapi.testclient import TestClient

from app.auth.utils import create_access_token
from app.database import SessionLocal
from app.jobs.archival import archive_stale_students
from app.main import app
from app.models import AuditLog, User, utcnow
from app.roles import UserRole


def _make_user(db, role, tag, is_active=True, deactivated_at=None, archived_at=None):
    user = User(
        email=f"test-archival-{tag}-{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="not-a-real-hash",
        role=role,
        is_active=is_active,
        deactivated_at=deactivated_at,
        archived_at=archived_at,
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
    db.query(AuditLog).filter(AuditLog.user_id.in_(ids)).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_student_deactivated_over_90_days_ago_gets_archived():
    db = SessionLocal()
    long_ago = utcnow() - timedelta(days=100)
    student = _make_user(db, UserRole.student, "old", is_active=False, deactivated_at=long_ago)

    try:
        archived_count = archive_stale_students(db)
        assert archived_count >= 1

        db.refresh(student)
        assert student.archived_at is not None
    finally:
        _cleanup(db, student)


def test_student_deactivated_recently_is_not_archived():
    db = SessionLocal()
    recently = utcnow() - timedelta(days=10)
    student = _make_user(db, UserRole.student, "recent", is_active=False, deactivated_at=recently)

    try:
        archive_stale_students(db)
        db.refresh(student)
        assert student.archived_at is None
    finally:
        _cleanup(db, student)


def test_active_student_is_never_archived():
    db = SessionLocal()
    # is_active True, deactivated_at None - the default "never deactivated" state
    student = _make_user(db, UserRole.student, "active")

    try:
        archive_stale_students(db)
        db.refresh(student)
        assert student.archived_at is None
    finally:
        _cleanup(db, student)


def test_company_is_never_auto_archived_even_if_long_deactivated():
    db = SessionLocal()
    long_ago = utcnow() - timedelta(days=200)
    company = _make_user(db, UserRole.company, "old", is_active=False, deactivated_at=long_ago)

    try:
        archive_stale_students(db)
        db.refresh(company)
        assert company.archived_at is None
    finally:
        _cleanup(db, company)


def test_already_archived_student_is_not_touched_again():
    db = SessionLocal()
    long_ago = utcnow() - timedelta(days=200)
    already_archived_at = utcnow() - timedelta(days=5)
    student = _make_user(
        db, UserRole.student, "prearchived", is_active=False,
        deactivated_at=long_ago, archived_at=already_archived_at,
    )

    try:
        archive_stale_students(db)
        db.refresh(student)
        # unchanged - still the original archived_at, not bumped to "now"
        assert student.archived_at.replace(microsecond=0) == already_archived_at.replace(microsecond=0)
    finally:
        _cleanup(db, student)


def test_admin_users_list_excludes_archived_by_default_but_can_include_them():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin")
    archived_student = _make_user(
        db, UserRole.student, "archived", is_active=False,
        deactivated_at=utcnow() - timedelta(days=200),
        archived_at=utcnow(),
    )

    try:
        resp = client.get("/admin/users", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text
        ids = [u["id"] for u in resp.json()]
        assert str(archived_student.id) not in ids

        resp = client.get("/admin/users?include_archived=true", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text
        ids = [u["id"] for u in resp.json()]
        assert str(archived_student.id) in ids
    finally:
        _cleanup(db, admin, archived_student)


def test_reactivating_a_user_clears_deactivated_and_archived_timestamps():
    db = SessionLocal()
    client = TestClient(app)
    admin = _make_user(db, UserRole.admin, "admin2")
    student = _make_user(
        db, UserRole.student, "toreactivate", is_active=False,
        deactivated_at=utcnow() - timedelta(days=200),
        archived_at=utcnow(),
    )

    try:
        resp = client.patch(f"/admin/users/{student.id}/activate", headers=_auth_header(admin))
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["is_active"] is True
        assert body["deactivated_at"] is None
        assert body["archived_at"] is None
    finally:
        _cleanup(db, admin, student)
