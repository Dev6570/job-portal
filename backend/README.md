# Backend - Auth, RBAC & Admin module (Member A)

## Setup

```
cd backend
python -m venv venv
venv\Scripts\activate        # PowerShell
pip install -r requirements.txt
copy .env.example .env       # then fill in JWT_SECRET etc
```

Start Postgres (Docker):
```
docker run --name jobportal-db -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=jobportal -p 5432:5432 -d postgres:15
```

Run migrations:
```
alembic upgrade head
```

Run the API:
```
uvicorn app.main:app --reload
```

Run tests:
```
pytest
```

## What's here

- `app/roles.py` - `UserRole` enum, zero dependencies (deliberately kept framework-free so RBAC logic is unit-testable).
- `app/models.py` / `app/schemas.py` - shared. **Route any change through a PR the other three glance at.**
- `app/auth/rbac.py` - the actual role-check logic (`role_is_allowed`), pure function.
- `app/auth/dependencies.py` - `require_role(*roles)`, the dependency every other member imports for their own routers.
- `app/auth/utils.py` - password hashing (passlib/bcrypt) + JWT issue/verify (PyJWT).
- `app/auth/router.py` - `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`.
- `app/admin/router.py` - `GET /admin/companies/pending`, `PATCH /admin/companies/{id}/verify`, `GET /admin/users`, `GET /admin/audit-logs`.
- `app/audit.py` - middleware, writes an `audit_logs` row on every POST/PATCH/DELETE.
- `alembic/versions/0001_initial_tables.py` - initial migration (users, students, companies, audit_logs).

## One deliberate deviation from the original guide

The guide named `python-jose` for JWTs; this uses **PyJWT** instead (same job, simpler API) -
a substitution made because only PyJWT was available to actually test against in the build
environment. Nothing outside this module imports it, so it doesn't affect anyone else's
`requirements.txt`.

## What was actually verified, and what wasn't

Built and tested in a sandbox with **no network access** - `pip`/`apt`/`npm` install all failed
with 403s, so only `PyJWT` and the standard library were available to run anything for real.

| Piece | Verified how |
|---|---|
| `app/roles.py`, `app/auth/rbac.py` (`role_is_allowed`) | Actually imported and unit-tested (`tests/test_rbac.py`, 4/4 passing) - zero framework deps, so this ran for real. |
| JWT create/decode/expiry/type-check/tamper-detection **design** | Verified with a standalone script using the real `PyJWT` library, identical logic to `app/auth/utils.py` - all 5 checks passed. `tests/test_jwt.py` targets the actual production file and is ready for CI, and has now been run: `pytest -v` passed 8/8 against the real installed environment. |
| Everything touching FastAPI, SQLAlchemy, or Postgres (routers, models, migration, middleware) | **Not executed.** `fastapi`, `starlette`, `sqlalchemy`, `pydantic`, `passlib`, `alembic` could not be installed at all. Every file was syntax-checked (`py_compile`, all pass) and hand-reviewed, but never actually run. |

**Before trusting this beyond a first read:** run `pytest`, start `uvicorn`, and hit
`/auth/register` -> `/auth/login` -> `/auth/me` and `/admin/*` against a real Postgres instance.
Given no framework code here has executed even once, there's a real chance of a typo or an
API-mismatch (SQLAlchemy 2.0 syntax, FastAPI dependency wiring, etc.) that only shows up at
runtime. Treat this as a careful first draft, not verified-working code.
