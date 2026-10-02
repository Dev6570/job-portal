import logging
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User, utcnow
from app.roles import UserRole

logger = logging.getLogger(__name__)

# "3 months" is treated as 90 days, not a calendar-month calculation, to
# avoid pulling in an extra dependency (python-dateutil) for something that
# doesn't need calendar precision. Worth knowing if "3 months" needs to mean
# something more exact later (e.g. for a legal/compliance reason).
ARCHIVE_AFTER = timedelta(days=90)

_scheduler: BackgroundScheduler | None = None


def archive_stale_students(db: Session) -> int:
    """
    Soft-archive students deactivated 90+ days ago and not already archived.
    Never deletes a row: sets archived_at only, so the user, their profile,
    and their audit history all stay intact and recoverable (reactivating
    the user clears archived_at). Scoped to students only, per the current
    feature request - companies and admins are never auto-archived.

    Students deactivated before this feature existed have deactivated_at =
    NULL and are therefore never auto-archived; there's no reliable way to
    know when they were actually deactivated, so we don't guess.

    Returns the number of students archived by this call.
    """
    cutoff = utcnow() - ARCHIVE_AFTER
    stale = (
        db.query(User)
        .filter(
            User.role == UserRole.student,
            User.is_active.is_(False),
            User.deactivated_at.isnot(None),
            User.deactivated_at <= cutoff,
            User.archived_at.is_(None),
        )
        .all()
    )
    for user in stale:
        user.archived_at = utcnow()
    db.commit()
    return len(stale)


def _run_archival_job() -> None:
    db = SessionLocal()
    try:
        count = archive_stale_students(db)
        if count:
            logger.info("student archival job: archived %d student(s)", count)
    except Exception:
        logger.exception("student archival job failed")
    finally:
        db.close()


def start_scheduler() -> None:
    """Call once, on app startup. Safe to call more than once (no-ops after the first)."""
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(_run_archival_job, "interval", days=1, id="archive_stale_students")
    _scheduler.start()


def stop_scheduler() -> None:
    """Call once, on app shutdown."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
