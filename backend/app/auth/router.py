import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.utils import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import Company, Student, User, UserRole
from app.schemas import (
    AccessTokenOnly,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if payload.role == UserRole.student and payload.student is None:
        raise HTTPException(status_code=422, detail="student details are required for role=student")
    if payload.role == UserRole.company and payload.company is None:
        raise HTTPException(status_code=422, detail="company details are required for role=company")
    if payload.role == UserRole.admin:
        # Admin accounts are provisioned out-of-band, not via public self-registration
        raise HTTPException(status_code=403, detail="admin accounts cannot self-register")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()  # get user.id before creating the profile row, same transaction

    if payload.role == UserRole.student:
        db.add(Student(user_id=user.id, **payload.student.model_dump()))
    else:
        db.add(Company(user_id=user.id, **payload.company.model_dump()))

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise invalid
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return TokenPair(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id, user.role.value),
    )


@router.post("/refresh", response_model=AccessTokenOnly)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    try:
        claims = decode_token(payload.refresh_token, TokenType.refresh)
    except InvalidTokenError:
        raise invalid

    user = db.get(User, uuid.UUID(claims["sub"]))
    if user is None or not user.is_active:
        raise invalid

    return AccessTokenOnly(access_token=create_access_token(user.id, user.role.value))


@router.get("/me", response_model=UserOut)
def read_current_user(user: User = Depends(get_current_user)):
    return user
