import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
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


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), limit: int = 100):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
