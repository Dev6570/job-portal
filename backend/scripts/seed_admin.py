from app.database import SessionLocal
from app.models import User
from app.roles import UserRole
from app.auth.utils import hash_password

ADMIN_EMAIL = "admin1@test.com"
ADMIN_PASSWORD = "AdminPass123!"

db = SessionLocal()
try:
    existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if existing:
        print("User with email " + ADMIN_EMAIL + " already exists (id=" + str(existing.id) + ", role=" + str(existing.role) + "). Nothing done.")
    else:
        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Created admin user: id=" + str(admin.id) + ", email=" + admin.email + ", role=" + str(admin.role))
finally:
    db.close()
