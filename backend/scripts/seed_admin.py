"""Create the first admin user for a fresh environment.

Usage (PowerShell, from the backend folder):
    $env:ADMIN_EMAIL = "you@example.com"
    $env:ADMIN_PASSWORD = "a-strong-password-here"
    python -m scripts.seed_admin

Credentials come from environment variables only - nothing is hardcoded,
so this is safe to run on any machine or in CI. Safe to re-run.
"""
import os
import sys

from app.auth.utils import hash_password
from app.database import SessionLocal
from app.models import User
from app.roles import UserRole

MIN_PASSWORD_LENGTH = 12


def main() -> int:
    email = os.environ.get("ADMIN_EMAIL", "").strip()
    password = os.environ.get("ADMIN_PASSWORD", "")

    if not email or not password:
        print("ERROR: set both ADMIN_EMAIL and ADMIN_PASSWORD environment variables first.")
        return 1
    if len(password) < MIN_PASSWORD_LENGTH:
        print("ERROR: ADMIN_PASSWORD must be at least " + str(MIN_PASSWORD_LENGTH) + " characters.")
        return 1

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == UserRole.admin:
                print("Admin " + email + " already exists (id=" + str(existing.id) + "). Nothing done.")
                return 0
            print(
                "ERROR: " + email + " already exists with role=" + str(existing.role)
                + ", not admin. Refusing to change it - use a different email."
            )
            return 1

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Created admin user: id=" + str(admin.id) + ", email=" + admin.email)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
