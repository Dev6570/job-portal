from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.audit import AuditLogMiddleware
from app.auth.router import router as auth_router

app = FastAPI(title="Job & Internship Management Portal API")

# TODO(team): tighten this to the deployed frontend origin only before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuditLogMiddleware)

app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/health")
def health():
    return {"status": "ok"}
