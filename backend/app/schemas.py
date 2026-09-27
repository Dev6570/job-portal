import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.roles import UserRole


# ---- Auth: register ----

class StudentRegisterExtra(BaseModel):
    full_name: str
    branch: str | None = None
    cgpa: float | None = None
    backlogs: int = 0
    batch_year: int | None = None


class CompanyRegisterExtra(BaseModel):
    company_name: str
    website: str | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole
    student: StudentRegisterExtra | None = None
    company: CompanyRegisterExtra | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Auth: login / tokens ----

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenOnly(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Admin ----

class CompanyOut(BaseModel):
    id: uuid.UUID
    company_name: str
    website: str | None
    is_verified: bool

    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    method: str
    path: str
    status_code: int
    created_at: datetime

    model_config = {"from_attributes": True}
