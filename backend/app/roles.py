import enum


class UserRole(str, enum.Enum):
    student = "student"
    company = "company"
    admin = "admin"
