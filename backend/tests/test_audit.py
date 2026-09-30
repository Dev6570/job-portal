from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.audit import AuditLogMiddleware
from app.database import SessionLocal
from app.models import AuditLog


def _build_crash_app() -> FastAPI:
    """A throwaway app - real middleware, real DB - with one route that
    raises an unhandled exception, to prove the audit row still gets
    written when a request 500s."""
    app = FastAPI()
    app.add_middleware(AuditLogMiddleware)

    @app.post("/__test_crash")
    def crash():
        raise RuntimeError("intentional crash for audit-log regression test")

    return app


def test_audit_log_written_when_route_raises():
    app = _build_crash_app()
    client = TestClient(app, raise_server_exceptions=False)

    response = client.post("/__test_crash")
    assert response.status_code == 500

    db = SessionLocal()
    try:
        rows = (
            db.query(AuditLog)
            .filter(AuditLog.path == "/__test_crash", AuditLog.method == "POST")
            .all()
        )
        assert len(rows) == 1, f"expected exactly 1 audit_logs row, found {len(rows)}"
        assert rows[0].status_code == 500
    finally:
        # clean up the test row so it does not pollute the real audit_logs table
        db.query(AuditLog).filter(AuditLog.path == "/__test_crash").delete()
        db.commit()
        db.close()
