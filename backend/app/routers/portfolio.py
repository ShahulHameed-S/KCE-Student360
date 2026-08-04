import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.portfolio import PortfolioCustomization
from app.services.portfolio_service import get_public_portfolio
from app.schemas.portfolio import PortfolioCustomizationUpdate, PortfolioCustomizationSchema

router = APIRouter()

def serialize_customization(cust: PortfolioCustomization) -> dict:
    """Helper to convert database customization configs into camelCase/snake_case properties."""
    skills = []
    if cust.skills_json:
        try:
            skills = json.loads(cust.skills_json)
        except Exception:
            pass

    visibility = {
        "showProjects": True,
        "showCertifications": True,
        "showAchievements": True,
        "showAcademicHighlights": True,
        "showContactLinks": True,
        "showResume": True
    }
    if cust.section_visibility_json:
        try:
            visibility = json.loads(cust.section_visibility_json)
        except Exception:
            pass

    return {
        "headline": cust.headline or "",
        "about_me": cust.about_me or "",
        "aboutMe": cust.about_me or "",
        "career_objective": cust.career_objective or "",
        "careerObjective": cust.career_objective or "",
        "skills": skills,
        "github_url": cust.github_url or "",
        "githubUrl": cust.github_url or "",
        "linkedin_url": cust.linkedin_url or "",
        "linkedinUrl": cust.linkedin_url or "",
        "email": cust.email or "",
        "phone": cust.phone or "",
        "location": cust.location or "",
        "theme": cust.theme or "Dark Minimal",
        "section_visibility_json": visibility,
        "sectionVisibility": visibility,
        "resume_visibility": cust.resume_visibility,
        "resumeVisibility": cust.resume_visibility
    }

@router.get("/{register_no}")
async def get_portfolio(register_no: str, db: Session = Depends(get_db)):
    """Public endpoint to fetch all details representing a student's public portfolio."""
    portfolio = get_public_portfolio(db, register_no)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio for student '{register_no}' not found."
        )
    return portfolio

@router.get("/customization/{register_no}")
async def get_portfolio_customization(
    register_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves portfolio customization settings for a student."""
    from sqlalchemy import func
    student = db.query(Student).filter(func.lower(Student.register_no) == func.lower(register_no)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()
    if not cust:
        # Return default template structure
        return {
            "headline": "",
            "about_me": "",
            "aboutMe": "",
            "career_objective": "",
            "careerObjective": "",
            "skills": [],
            "github_url": "",
            "githubUrl": "",
            "linkedin_url": "",
            "linkedinUrl": "",
            "email": "",
            "phone": "",
            "location": "",
            "theme": "Dark Minimal",
            "section_visibility_json": {
                "showProjects": True,
                "showCertifications": True,
                "showAchievements": True,
                "showAcademicHighlights": True,
                "showContactLinks": True,
                "showResume": True
            },
            "sectionVisibility": {
                "showProjects": True,
                "showCertifications": True,
                "showAchievements": True,
                "showAcademicHighlights": True,
                "showContactLinks": True,
                "showResume": True
            },
            "resume_visibility": True,
            "resumeVisibility": True
        }

    return serialize_customization(cust)

@router.put("/customization/{register_no}")
async def update_portfolio_customization(
    register_no: str,
    payload: PortfolioCustomizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates student's own portfolio theme, headline, Visibility limits, and links."""
    from sqlalchemy import func
    student = db.query(Student).filter(func.lower(Student.register_no) == func.lower(register_no)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Access security check
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied. Can only customize own portfolio.")

    cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()
    if not cust:
        cust = PortfolioCustomization(student_id=student.id)
        db.add(cust)
        db.flush()

    if payload.headline is not None:
        cust.headline = payload.headline
    if payload.about_me is not None:
        cust.about_me = payload.about_me
    if payload.career_objective is not None:
        cust.career_objective = payload.career_objective
    if payload.skills is not None:
        cust.skills_json = json.dumps(payload.skills)
    if payload.github_url is not None:
        cust.github_url = payload.github_url
    if payload.linkedin_url is not None:
        cust.linkedin_url = payload.linkedin_url
    if payload.email is not None:
        cust.email = payload.email
    if payload.phone is not None:
        cust.phone = payload.phone
    if payload.location is not None:
        cust.location = payload.location
    if payload.theme is not None:
        cust.theme = payload.theme
    if payload.section_visibility_json is not None:
        cust.section_visibility_json = json.dumps(payload.section_visibility_json)
    if payload.resume_visibility is not None:
        cust.resume_visibility = payload.resume_visibility

    db.commit()
    db.refresh(cust)

    return {
        "success": True,
        "message": "Portfolio customization saved successfully.",
        "customization": serialize_customization(cust)
    }
