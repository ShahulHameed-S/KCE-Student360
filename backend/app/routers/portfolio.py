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

def serialize_customization(cust: PortfolioCustomization, register_no: str = "") -> dict:
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
    ext_url = ""
    if cust.section_visibility_json:
        try:
            parsed = json.loads(cust.section_visibility_json)
            if isinstance(parsed, dict):
                visibility = parsed
                ext_url = parsed.get("external_portfolio_url", "")
        except Exception:
            pass

    reg = register_no or (cust.student.register_no if cust.student else "")
    from app.utils.url_utils import build_portfolio_urls, sanitize_external_url
    clean_ext = sanitize_external_url(ext_url)
    urls = build_portfolio_urls(reg, clean_ext)

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
        "external_portfolio_url": urls["external_portfolio_url"],
        "default_portfolio_url": urls["default_portfolio_url"],
        "student360_portfolio_url": urls["student360_portfolio_url"],
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
        from app.utils.url_utils import build_portfolio_urls
        urls = build_portfolio_urls(student.register_no, "")
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
            "external_portfolio_url": urls["external_portfolio_url"],
            "default_portfolio_url": urls["default_portfolio_url"],
            "student360_portfolio_url": urls["student360_portfolio_url"],
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

    return serialize_customization(cust, student.register_no)

@router.put("/customization/{register_no}")
async def update_portfolio_customization(
    register_no: str,
    payload: PortfolioCustomizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates student's own portfolio theme, headline, Visibility limits, external portfolio URL, and links."""
    from sqlalchemy import func
    from app.utils.url_utils import sanitize_external_url, build_portfolio_urls

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
    if payload.resume_visibility is not None:
        cust.resume_visibility = payload.resume_visibility

    # Parse existing section_visibility_json
    existing_vis = {}
    if cust.section_visibility_json:
        try:
            parsed = json.loads(cust.section_visibility_json)
            if isinstance(parsed, dict):
                existing_vis = parsed
        except Exception:
            pass

    if payload.section_visibility_json is not None:
        if isinstance(payload.section_visibility_json, dict):
            existing_vis.update(payload.section_visibility_json)

    if payload.external_portfolio_url is not None:
        raw_ext = payload.external_portfolio_url.strip()
        if raw_ext:
            clean_ext = sanitize_external_url(raw_ext)
            if not clean_ext:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please enter a valid portfolio URL starting with https://"
                )
            existing_vis["external_portfolio_url"] = clean_ext
        else:
            existing_vis["external_portfolio_url"] = ""

    cust.section_visibility_json = json.dumps(existing_vis)

    db.commit()
    db.refresh(cust)

    serialized = serialize_customization(cust, student.register_no)

    return {
        "success": True,
        "external_portfolio_url": serialized["external_portfolio_url"],
        "default_portfolio_url": serialized["default_portfolio_url"],
        "student360_portfolio_url": serialized["student360_portfolio_url"],
        "message": "External portfolio link saved successfully" if payload.external_portfolio_url is not None else "Portfolio customization saved successfully.",
        "customization": serialized
    }
