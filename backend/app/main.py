from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    admin,
    applications,
    auth,
    cover_letters,
    cv,
    emails,
    health,
    interviews,
    jobs,
    matching,
    recruiters,
    resumes,
)
from app.core.config import get_settings
from app.db.init_db import init_db
from app.services.vector_store.bootstrap import init_vector_store

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    init_vector_store()


app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(recruiters.router, prefix=settings.api_v1_prefix)
app.include_router(jobs.router, prefix=settings.api_v1_prefix)
app.include_router(resumes.router, prefix=settings.api_v1_prefix)
app.include_router(matching.router, prefix=settings.api_v1_prefix)
app.include_router(cv.router, prefix=settings.api_v1_prefix)
app.include_router(cover_letters.router, prefix=settings.api_v1_prefix)
app.include_router(applications.router, prefix=settings.api_v1_prefix)
app.include_router(interviews.router, prefix=settings.api_v1_prefix)
app.include_router(emails.router, prefix=settings.api_v1_prefix)
