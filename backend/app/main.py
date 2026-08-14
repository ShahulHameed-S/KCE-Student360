import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.dependencies import get_db
from app.utils.response_utils import error_response

# Import routers skeleton
from app.routers import (
    auth, students, scores, leaderboard, mentor,
    submissions, resume, profile, portfolio, ai, admin,
    student_portfolio
)

app = FastAPI(
    title="Student360 Backend",
    description="Centralized Student Intelligence & Portfolio Platform API",
    version="1.0.0"
)

allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://kce-student360.vercel.app",
    "https://kce-student360-backend.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_migrations():
    """Ensure database tables and columns exist without deleting or altering existing data."""
    try:
        from app.database import engine, Base
        import app.models  # Register all models
        Base.metadata.create_all(bind=engine)
        
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image VARCHAR;"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_image VARCHAR;"))
            conn.execute(text("ALTER TABLE portfolio_customizations ADD COLUMN IF NOT EXISTS section_visibility_json TEXT;"))
    except Exception as e:
        print(f"[STARTUP MIGRATION WARNING] {e}")

# Mount local uploads static directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Health check route
@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    try:
        # Perform quick select check to ensure database is online
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "service": "Student360 Backend",
            "database": "connected",
            "database_provider": "supabase"
        }
    except Exception as e:
        return error_response(
            message=f"Database connection failed: {str(e)}",
            code="DATABASE_DISCONNECTED",
            status_code=500
        )

# Include API routers with prefixes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(scores.router, prefix="/scores", tags=["Scores"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(mentor.router, prefix="/mentor", tags=["Mentor Approval"])
app.include_router(submissions.router, prefix="/student", tags=["Student Submissions"])
app.include_router(student_portfolio.router, prefix="/student", tags=["Student Portfolio"])
app.include_router(resume.router, prefix="/students", tags=["Student Resumes"])
app.include_router(profile.router, prefix="/users", tags=["User Profiles"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Public Portfolios"])
app.include_router(ai.router, prefix="/ai", tags=["AI Analytics"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])

# Mount static uploads directory if available
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

