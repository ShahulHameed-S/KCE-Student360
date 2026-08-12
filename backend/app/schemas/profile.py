from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedinUrl: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    program: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    full_name: str
    fullName: str
    email: str
    phone: Optional[str] = None
    role: str
    department: Optional[str] = None
    location: Optional[str] = None
    profile_image: Optional[str] = None
    profileImage: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedinUrl: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict) # For supporting specific role parameters

    class Config:
        from_attributes = True
