from app.database import Base
from app.models.user import User
from app.models.student import Student, FacultyProfile, MentorAssignment
from app.models.score import AssessmentScore, StudentAnalytics
from app.models.submission import StudentProject, StudentCertification, StudentAchievement, MentorReviewLog
from app.models.resume import Resume
from app.models.profile import UserProfile, StudentAbout
from app.models.portfolio import PortfolioCustomization
from app.models.ai_summary import AISummary
from app.models.otp_models import PasswordResetOTP, PasswordResetLog

# All models imported and bound to Base
__all__ = [
    "Base",
    "User",
    "Student",
    "FacultyProfile",
    "MentorAssignment",
    "AssessmentScore",
    "StudentAnalytics",
    "StudentProject",
    "StudentCertification",
    "StudentAchievement",
    "MentorReviewLog",
    "Resume",
    "UserProfile",
    "StudentAbout",
    "PortfolioCustomization",
    "AISummary",
    "PasswordResetOTP",
    "PasswordResetLog"
]
