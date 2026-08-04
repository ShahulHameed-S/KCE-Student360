import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.portfolio import PortfolioCustomization

router = APIRouter()

# Validation helpers
def validate_url(name: str, url: str):
    if url and not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} link must start with http:// or https://"
        )

def validate_cgpa(cgpa_val):
    if cgpa_val is not None and cgpa_val != "":
        try:
            val = float(cgpa_val)
            if val < 0.0 or val > 10.0:
                raise ValueError()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CGPA must be a valid decimal number between 0 and 10."
            )

class HeroCustomization(BaseModel):
    welcomeText: Optional[str] = ""
    displayName: Optional[str] = ""
    headline: Optional[str] = ""
    intro: Optional[str] = ""
    avatarInitials: Optional[str] = ""
    location: Optional[str] = ""
    cgpa: Optional[str] = ""
    showCgpa: Optional[bool] = True
    showEmail: Optional[bool] = True
    showPhone: Optional[bool] = True
    showRegisterNo: Optional[bool] = True
    showLocation: Optional[bool] = True

class SkillsCustomization(BaseModel):
    technical: Optional[list] = []
    programming: Optional[list] = []
    frameworks: Optional[list] = []
    databases: Optional[list] = []
    aiMl: Optional[list] = []
    softSkills: Optional[list] = []
    areasOfInterest: Optional[list] = []

class LinksCustomization(BaseModel):
    github: Optional[str] = ""
    linkedin: Optional[str] = ""
    leetcode: Optional[str] = ""
    hackerrank: Optional[str] = ""
    website: Optional[str] = ""
    resume: Optional[str] = ""

class SectionItem(BaseModel):
    visible: bool = True
    title: str

class SectionsCustomization(BaseModel):
    about: Optional[SectionItem] = None
    performance: Optional[SectionItem] = None
    resume: Optional[SectionItem] = None
    projects: Optional[SectionItem] = None
    achievements: Optional[SectionItem] = None
    contact: Optional[SectionItem] = None
    certifications: Optional[SectionItem] = None
    internships: Optional[SectionItem] = None
    hackathons: Optional[SectionItem] = None
    publications: Optional[SectionItem] = None
    workshops: Optional[SectionItem] = None

class MusicCustomization(BaseModel):
    visible: Optional[bool] = False
    title: Optional[str] = ""
    artist: Optional[str] = ""

class CustomizationPayload(BaseModel):
    hero: Optional[HeroCustomization] = None
    skills: Optional[SkillsCustomization] = None
    links: Optional[LinksCustomization] = None
    sections: Optional[SectionsCustomization] = None
    music: Optional[MusicCustomization] = None

@router.get("/portfolio/customization")
async def get_my_portfolio_customization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves current student's portfolio customization and pre-populates default database values."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can customize their portfolios."
        )

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()

    # Pre-populate default fallbacks from user and student tables
    defaults = {
        "hero": {
            "welcomeText": "WELCOME TO MY PORTFOLIO",
            "displayName": student.name or current_user.name or "Student",
            "headline": "AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer",
            "intro": "",
            "avatarInitials": "".join([n[0] for n in student.name.split() if n]).upper()[:2] if student.name else "ST",
            "location": student.location or "Coimbatore, Tamil Nadu",
            "cgpa": f"{student.cgpa:.2f}" if student.cgpa is not None else "",
            "showCgpa": True,
            "showEmail": True,
            "showPhone": True,
            "showRegisterNo": True,
            "showLocation": True
        },
        "skills": {
            "technical": [],
            "programming": [],
            "frameworks": [],
            "databases": [],
            "aiMl": [],
            "softSkills": [],
            "areasOfInterest": []
        },
        "links": {
            "github": "",
            "linkedin": "",
            "leetcode": "",
            "hackerrank": "",
            "website": "",
            "resume": ""
        },
        "sections": {
            "about": {"visible": True, "title": "About"},
            "performance": {"visible": True, "title": "Performance"},
            "resume": {"visible": True, "title": "Resume"},
            "projects": {"visible": True, "title": "Projects"},
            "achievements": {"visible": True, "title": "Achievements"},
            "contact": {"visible": True, "title": "Contact"},
            "certifications": {"visible": True, "title": "Certifications"},
            "internships": {"visible": True, "title": "Internships"},
            "hackathons": {"visible": True, "title": "Hackathons"},
            "publications": {"visible": True, "title": "Publications"},
            "workshops": {"visible": True, "title": "Workshops"}
        },
        "music": {
            "visible": False,
            "title": "",
            "artist": ""
        }
    }

    if not cust:
        return defaults

    # Safe merge of saved section_visibility_json
    saved_data = {}
    if cust.section_visibility_json:
        try:
            saved_data = json.loads(cust.section_visibility_json)
        except Exception:
            pass

    # Check if this is the new structured format or old flat format
    if isinstance(saved_data, dict) and ("hero" in saved_data or "skills" in saved_data or "links" in saved_data or "sections" in saved_data):
        # New format: merge deep defaults
        for section in ["hero", "skills", "links", "sections", "music"]:
            if section in saved_data and isinstance(saved_data[section], dict):
                for k, v in saved_data[section].items():
                    if k in defaults[section]:
                        defaults[section][k] = v
    else:
        # Old flat format: map old visibilities
        if isinstance(saved_data, dict):
            mapping = {
                "showProjects": "projects",
                "showCertifications": "certifications",
                "showAchievements": "achievements",
                "showAcademicHighlights": "performance",
                "showContactLinks": "contact",
                "showResume": "resume"
            }
            for old_key, new_sec in mapping.items():
                if old_key in saved_data:
                    defaults["sections"][new_sec]["visible"] = bool(saved_data[old_key])

        # Grab flat columns as fallbacks into new structure
        if cust.headline:
            defaults["hero"]["headline"] = cust.headline
        if cust.about_me:
            defaults["hero"]["intro"] = cust.about_me
        if cust.location:
            defaults["hero"]["location"] = cust.location
        if cust.github_url:
            defaults["links"]["github"] = cust.github_url
        if cust.linkedin_url:
            defaults["links"]["linkedin"] = cust.linkedin_url
        if cust.email:
            defaults["hero"]["email"] = cust.email
        if cust.skills_json:
            try:
                defaults["skills"]["technical"] = json.loads(cust.skills_json)
            except Exception:
                pass

    return defaults

@router.put("/portfolio/customization")
async def update_my_portfolio_customization(
    payload: CustomizationPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates the logged-in student's customization settings, merging and validating fields."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can customize their portfolios."
        )

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    cust = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()
    if not cust:
        cust = PortfolioCustomization(student_id=student.id)
        db.add(cust)
        db.flush()

    # 1. Validation Checks
    if payload.hero:
        validate_cgpa(payload.hero.cgpa)
    if payload.links:
        validate_url("GitHub", payload.links.github)
        validate_url("LinkedIn", payload.links.linkedin)
        validate_url("LeetCode", payload.links.leetcode)
        validate_url("HackerRank", payload.links.hackerrank)
        validate_url("Website", payload.links.website)
        validate_url("Resume", payload.links.resume)

    # 2. Safely read existing configuration from database
    existing_json = {}
    if cust.section_visibility_json:
        try:
            existing_json = json.loads(cust.section_visibility_json)
        except Exception:
            pass

    # Ensure existing structure is a dictionary
    if not isinstance(existing_json, dict):
        existing_json = {}

    # Helper function to recursively merge dicts
    def merge_dicts(target, source):
        for k, v in source.items():
            if v is None:
                continue
            if k in target and isinstance(target[k], dict) and isinstance(v, dict):
                merge_dicts(target[k], v)
            elif isinstance(v, dict):
                target[k] = v.copy()
            else:
                target[k] = v

    # 3. Compile payload dictionary
    payload_dict = payload.model_dump(exclude_unset=True)

    # If old keys exist in existing_json but not in payload, merge_dicts will preserve them
    merge_dicts(existing_json, payload_dict)

    # 4. Sync flat database columns for backward compatibility with older components
    if payload.hero:
        if payload.hero.headline is not None:
            cust.headline = payload.hero.headline
        if payload.hero.intro is not None:
            cust.about_me = payload.hero.intro
        if payload.hero.location is not None:
            cust.location = payload.hero.location

    if payload.links:
        if payload.links.github is not None:
            cust.github_url = payload.links.github
        if payload.links.linkedin is not None:
            cust.linkedin_url = payload.links.linkedin

    if payload.skills:
        # Combine lists for backward compatible skills field
        all_skills = []
        for category in ["technical", "programming", "frameworks", "databases", "aiMl", "softSkills", "areasOfInterest"]:
            list_val = getattr(payload.skills, category, None)
            if list_val:
                all_skills.extend(list_val)
        if all_skills:
            cust.skills_json = json.dumps(all_skills)

    # Save complete merged payload into section_visibility_json
    cust.section_visibility_json = json.dumps(existing_json)

    db.commit()
    db.refresh(cust)

    return {
        "success": True,
        "message": "Portfolio customization saved successfully.",
        "customization": existing_json
    }
