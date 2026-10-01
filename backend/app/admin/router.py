import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import AuditLog, Company, User, UserRole
from app.schemas import AuditLogOut, CompanyOut, UserOut

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(UserRole.admin))],
)


@router.get("/companies/pending", response_model=list[CompanyOut])
def list_pending_companies(db: Session = Depends(get_db)):
    return db.query(Company).filter(Company.is_verified.is_(False)).all()


@router.patch("/companies/{company_id}/verify", response_model=CompanyOut)
def verify_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    company.is_verified = True
    db.commit()
    db.refresh(company)
    return company


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_user),
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # No separate "last active admin" count check: the caller reaching this
    # line is always themselves an active admin (enforced by require_role
    # above), so a different target can never be the sole remaining active
    # admin. The only path to zero active admins is self-deactivation,
    # which is already blocked above.
    target.is_active = False
    db.commit()
    db.refresh(target)
    return target


@router.patch("/users/{user_id}/activate", response_model=UserOut)
def activate_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target.is_active = True
    db.commit()
    db.refresh(target)
    return target


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), limit: int = 100):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
