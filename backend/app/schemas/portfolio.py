from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.student import StudentBase
from app.schemas.resume import ResumeResponse
from app.schemas.score import StudentPerformanceResponse
from app.schemas.submission import ProjectResponse, CertificationResponse, AchievementResponse

class PortfolioCustomizationSchema(BaseModel):
    headline: Optional[str] = None
    about_me: Optional[str] = None
    career_objective: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    external_portfolio_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    theme: str = "Dark Minimal"
    section_visibility_json: Optional[Dict[str, bool]] = None
    resume_visibility: bool = True

    class Config:
        from_attributes = True

class PortfolioCustomizationUpdate(BaseModel):
    headline: Optional[str] = None
    about_me: Optional[str] = None
    career_objective: Optional[str] = None
    skills: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    external_portfolio_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    theme: Optional[str] = None
    section_visibility_json: Optional[Dict[str, bool]] = None
    resume_visibility: Optional[bool] = None

class PortfolioResponse(BaseModel):
    student: Dict[str, Any]
    about: Dict[str, Any]
    resume: Optional[Dict[str, Any]] = None
    performance: Optional[Dict[str, Any]] = None
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    achievements: List[Dict[str, Any]] = Field(default_factory=list)
    portfolio_customization: Optional[PortfolioCustomizationSchema] = None
    portfolioCustomization: Optional[PortfolioCustomizationSchema] = None
    ai_summary: Optional[Dict[str, Any]] = None
    aiSummary: Optional[Dict[str, Any]] = None
    profile_image: Optional[str] = None
    profileImage: Optional[str] = None
