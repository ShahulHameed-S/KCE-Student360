import json
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.dependencies import get_db, get_current_user, RoleRequired
from app.models.user import User
from app.models.student import Student
from app.models.score import AssessmentScore, StudentAnalytics
from app.models.submission import StudentProject, StudentCertification, StudentAchievement
from app.models.resume import Resume
from app.models.profile import StudentAbout
from app.models.portfolio import PortfolioCustomization
from app.services.recommendation_service import get_student_recommendations
from app.utils.response_utils import error_response
from app.schemas.student import StudentAboutSchema

router = APIRouter()

DEFAULT_HEADLINE = "AI & DS Student | Java Full Stack Developer | Aspiring AI Engineer"
DEFAULT_ABOUT_ME = (
    "I am Shahul, an Artificial Intelligence and Data Science student at Karpagam College of Engineering. "
    "I am passionate about building useful software solutions that combine AI, full stack development, "
    "and real-world problem solving.\n\n"
    "I have experience working on projects related to student performance tracking, AI-based systems, "
    "portfolio generation, deepfake detection, and offline AI applications. I enjoy learning new technologies "
    "and applying them to create practical projects that can help students, institutions, and users in real life.\n\n"
    "My goal is to become a skilled AI Engineer and Java Full Stack Developer by continuously improving my "
    "programming, problem-solving, and project development skills."
)
DEFAULT_CAREER_OBJ = (
    "To build a strong career as an AI Engineer and Java Full Stack Developer by using my knowledge in "
    "Artificial Intelligence, Data Science, and software development to create innovative, practical, "
    "and impactful solutions. I aim to continuously improve my technical skills, work on real-world projects, "
    "and contribute effectively to organizations through problem-solving, teamwork, and continuous learning."
)
DEFAULT_SKILLS = [
    "AI & Data Science", "Java", "React", "Full Stack Development", 
    "Python", "DSA", "DBMS", "FastAPI", "PostgreSQL"
]

def serialize_student_flat(student: Student, db: Session) -> dict:
    """Serializes a student into a dictionary containing both flat fields and nested objects for compatibility."""
    analytics_obj = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student.id).first()
    
    domain_scores = {
        "DSA": analytics_obj.dsa_average if analytics_obj else 0.0,
        "DBMS": analytics_obj.dbms_average if analytics_obj else 0.0,
        "FullStack": analytics_obj.fullstack_average if analytics_obj else 0.0,
        "Aptitude": analytics_obj.aptitude_average if analytics_obj else 0.0,
        "Coding": analytics_obj.coding_average if analytics_obj else 0.0,
        "Academic": analytics_obj.academic_average if analytics_obj else 0.0,
        "Technical": analytics_obj.technical_average if analytics_obj else 0.0
    }

    student_dict = {
        "id": student.id,
        "register_no": student.register_no,
        "registerNo": student.register_no,
        "name": student.name,
        "email": student.email,
        "phone": student.phone or "",
        "department": student.department,
        "year": student.year,
        "section": student.section,
        "batch": student.batch,
        "cgpa": student.cgpa,
        "profile_image": student.profile_image or "",
        "profileImage": student.profile_image or "",
        "overall_score": analytics_obj.overall_score if analytics_obj else 0.0,
        "overallScore": analytics_obj.overall_score if analytics_obj else 0.0,
        "domain_scores": domain_scores,
        "domainScores": domain_scores,
        "strongest_domain": analytics_obj.strongest_domain if analytics_obj else None,
        "strongestDomain": analytics_obj.strongest_domain if analytics_obj else None,
        "weakest_domain": analytics_obj.weakest_domain if analytics_obj else None,
        "weakestDomain": analytics_obj.weakest_domain if analytics_obj else None
    }
    return student_dict

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_students(db: Session = Depends(get_db)):
    """Retrieves all students list with analytics averages."""
    students = db.query(Student).all()
    return [serialize_student_flat(s, db) for s in students]

@router.get("/recommend")
async def recommend_students(
    domain: str = Query("DSA"),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    """Retrieves student recommendations ranked by domain score."""
    return get_student_recommendations(db, domain, limit)

@router.get("/{id_or_register_no}")
async def get_student_by_id(
    id_or_register_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full profile details for a student.
    Accepts student ID (integer), user_id, or register_no.
    """
    from sqlalchemy import func
    from app.models.student import MentorAssignment
    
    # 1. Fetch student
    student = None
    if str(id_or_register_no).isdigit():
        student = db.query(Student).filter(Student.id == int(id_or_register_no)).first()
        if not student:
            student = db.query(Student).filter(Student.user_id == int(id_or_register_no)).first()
            
    if not student:
        student = db.query(Student).filter(func.lower(Student.register_no) == func.lower(str(id_or_register_no))).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{id_or_register_no}' not found"
        )

    # 2. Access control check
    if current_user.role == "mentor":
        is_assigned = db.query(MentorAssignment).filter(
            MentorAssignment.mentor_id == current_user.id,
            MentorAssignment.student_id == student.id
        ).first()
        
        if not is_assigned:
            from app.models.profile import UserProfile
            import json
            profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
            assigned_dept = None
            assigned_yr = None
            assigned_sec = None
            if profile and profile.bio and profile.bio.startswith("{") and profile.bio.endswith("}"):
                try:
                    bio_data = json.loads(profile.bio)
                    assigned_dept = bio_data.get("assignedDepartment") or bio_data.get("department")
                    assigned_yr = bio_data.get("assignedYear") or bio_data.get("year")
                    assigned_sec = bio_data.get("assignedSection") or bio_data.get("section")
                    assigned_batch = bio_data.get("assignedBatch") or bio_data.get("batch")
                except Exception:
                    pass
                    
            if not assigned_dept:
                from app.models.student import FacultyProfile
                fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
                if fp:
                    assigned_dept = fp.department
            
            matches_class = True
            if assigned_dept and (not student.department or student.department.lower() != assigned_dept.lower()):
                matches_class = False
            if assigned_yr and student.year != assigned_yr:
                matches_class = False
            if assigned_sec and (not student.section or student.section.lower() != assigned_sec.lower()):
                matches_class = False
            if assigned_batch and (not student.batch or student.batch.lower() != assigned_batch.lower()):
                matches_class = False
                
            if not (assigned_dept or assigned_yr or assigned_sec or assigned_batch) or not matches_class:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You are not assigned as mentor for this student."
                )

    # 2. Fetch related details
    analytics_obj = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student.id).first()
    about_obj = db.query(StudentAbout).filter(StudentAbout.student_id == student.id).first()
    resume_obj = db.query(Resume).filter(Resume.student_id == student.id, Resume.use_in_portfolio == True).first()
    custom_obj = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == student.id).first()

    projects = db.query(StudentProject).filter(StudentProject.student_id == student.id).all()
    certifications = db.query(StudentCertification).filter(StudentCertification.student_id == student.id).all()
    achievements = db.query(StudentAchievement).filter(StudentAchievement.student_id == student.id).all()

    # Formulate performance dictionary representation
    domain_scores = {
        "DSA": analytics_obj.dsa_average if analytics_obj else 0.0,
        "DBMS": analytics_obj.dbms_average if analytics_obj else 0.0,
        "FullStack": analytics_obj.fullstack_average if analytics_obj else 0.0,
        "Aptitude": analytics_obj.aptitude_average if analytics_obj else 0.0,
        "Coding": analytics_obj.coding_average if analytics_obj else 0.0,
        "Academic": analytics_obj.academic_average if analytics_obj else 0.0,
        "Technical": analytics_obj.technical_average if analytics_obj else 0.0
    }

    performance_dict = {
        "overall_score": analytics_obj.overall_score if analytics_obj else 0.0,
        "overallScore": analytics_obj.overall_score if analytics_obj else 0.0,
        "domain_scores": domain_scores,
        "domainScores": domain_scores,
        "strongest_domain": analytics_obj.strongest_domain if analytics_obj else None,
        "weakest_domain": analytics_obj.weakest_domain if analytics_obj else None
    }

    # Serialization helpers
    def to_dict(obj):
        if not obj:
            return {}
        d = {}
        for col in obj.__table__.columns:
            val = getattr(obj, col.name)
            if isinstance(val, (date, datetime)):
                d[col.name] = val.isoformat()
            else:
                d[col.name] = val
        return d

    # Formulate responses with camelCase aliases where necessary
    student_flat = serialize_student_flat(student, db)
    
    analytics_dict = to_dict(analytics_obj)
    
    # About details with fallbacks
    about_skills = DEFAULT_SKILLS
    headline = DEFAULT_HEADLINE
    about_me = DEFAULT_ABOUT_ME
    career_objective = DEFAULT_CAREER_OBJ
    
    if about_obj:
        if about_obj.headline:
            headline = about_obj.headline
        if about_obj.about_me:
            about_me = about_obj.about_me
        if about_obj.career_objective:
            career_objective = about_obj.career_objective
        if about_obj.skills_json:
            try:
                about_skills = json.loads(about_obj.skills_json)
            except Exception:
                pass

    about_dict = {
        "headline": headline,
        "about_me": about_me,
        "aboutMe": about_me,
        "career_objective": career_objective,
        "careerObjective": career_objective,
        "skills": about_skills
    }

    resume_dict = {}
    if resume_obj:
        resume_skills = []
        if resume_obj.key_skills_json:
            try:
                resume_skills = json.loads(resume_obj.key_skills_json)
            except Exception:
                pass
                
        resume_dict = {
            "id": resume_obj.id,
            "resume_title": resume_obj.resume_title,
            "resumeTitle": resume_obj.resume_title,
            "preferred_role": resume_obj.preferred_role or "",
            "preferredRole": resume_obj.preferred_role or "",
            "career_objective": resume_obj.career_objective or "",
            "careerObjective": resume_obj.career_objective or "",
            "key_skills": resume_skills,
            "keySkills": resume_skills,
            "file_name": resume_obj.file_name,
            "fileName": resume_obj.file_name,
            "file_url": resume_obj.file_path,
            "fileUrl": resume_obj.file_path,
            "github_url": resume_obj.github_url or "",
            "linkedin_url": resume_obj.linkedin_url or "",
            "portfolio_url": resume_obj.portfolio_url or "",
            "use_in_portfolio": resume_obj.use_in_portfolio,
            "useInPortfolio": resume_obj.use_in_portfolio
        }

    custom_dict = {}
    if custom_obj:
        custom_skills = []
        if custom_obj.skills_json:
            try:
                custom_skills = json.loads(custom_obj.skills_json)
            except Exception:
                pass
                
        custom_visibility = {}
        if custom_obj.section_visibility_json:
            try:
                custom_visibility = json.loads(custom_obj.section_visibility_json)
            except Exception:
                pass

        custom_dict = {
            "headline": custom_obj.headline or "",
            "about_me": custom_obj.about_me or "",
            "career_objective": custom_obj.career_objective or "",
            "skills": custom_skills,
            "github_url": custom_obj.github_url or "",
            "linkedin_url": custom_obj.linkedin_url or "",
            "email": custom_obj.email or "",
            "phone": custom_obj.phone or "",
            "location": custom_obj.location or "",
            "theme": custom_obj.theme or "Dark Minimal",
            "section_visibility_json": custom_visibility,
            "resume_visibility": custom_obj.resume_visibility
        }

    serialized_projects = []
    for p in projects:
        pd = to_dict(p)
        tech_list = []
        if p.tech_stack:
            try:
                if p.tech_stack.startswith("["):
                    tech_list = json.loads(p.tech_stack)
                else:
                    tech_list = [s.strip() for s in p.tech_stack.split(",") if s.strip()]
            except Exception:
                tech_list = [p.tech_stack]
        pd["tech_stack"] = tech_list
        pd["techStack"] = tech_list
        serialized_projects.append(pd)

    serialized_certs = [to_dict(c) for c in certifications]
    serialized_achievements = [to_dict(a) for a in achievements]

    # Combine both flat fields and nested dictionaries to avoid frontend access crashes
    response_data = {
        **student_flat,
        "student": student_flat,
        "analytics": analytics_dict,
        "about": about_dict,
        "performance": performance_dict,
        "projects": serialized_projects,
        "certifications": serialized_certs,
        "achievements": serialized_achievements,
        "resume": resume_dict,
        "portfolio_customization": custom_dict,
        "portfolioCustomization": custom_dict
    }

    return response_data

@router.get("/{id_or_register_no}/performance")
async def get_student_performance(
    id_or_register_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves detailed test history logs and analytics averages for a student."""
    from sqlalchemy import func
    from app.models.student import MentorAssignment
    
    # 1. Fetch student
    student = None
    if str(id_or_register_no).isdigit():
        student = db.query(Student).filter(Student.id == int(id_or_register_no)).first()
        if not student:
            student = db.query(Student).filter(Student.user_id == int(id_or_register_no)).first()
            
    if not student:
        student = db.query(Student).filter(func.lower(Student.register_no) == func.lower(str(id_or_register_no))).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{id_or_register_no}' not found"
        )

    # 2. Access control check
    if current_user.role == "mentor":
        # Allow demo students (starting with 22ad) unconditionally for review
        if student.register_no and student.register_no.lower().startswith("22ad"):
            is_assigned = True
        else:
            is_assigned = db.query(MentorAssignment).filter(
                MentorAssignment.mentor_id == current_user.id,
                MentorAssignment.student_id == student.id
            ).first()
        
        if not is_assigned:
            from app.models.profile import UserProfile
            import json
            profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
            assigned_dept = None
            assigned_yr = None
            assigned_sec = None
            assigned_batch = None
            if profile and profile.bio and profile.bio.startswith("{") and profile.bio.endswith("}"):
                try:
                    bio_data = json.loads(profile.bio)
                    assigned_dept = bio_data.get("assignedDepartment") or bio_data.get("department")
                    assigned_yr = bio_data.get("assignedYear") or bio_data.get("year")
                    assigned_sec = bio_data.get("assignedSection") or bio_data.get("section")
                    assigned_batch = bio_data.get("assignedBatch") or bio_data.get("batch")
                except Exception:
                    pass
                    
            # TEMPORARY DEMO FALLBACK - should be replaced with admin mentor assignment UI.
            if not (assigned_dept or assigned_yr or assigned_sec) and current_user.email == "monisha.r@kce.ac.in":
                assigned_dept = "AI & DS"
                assigned_yr = "3"
                assigned_sec = "A"
                assigned_batch = "2028"
                    
            if not assigned_dept:
                from app.models.student import FacultyProfile
                fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
                if fp:
                    assigned_dept = fp.department
            
            from app.routers.mentor import normalize_dept, normalize_year, normalize_section
            
            matches_class = True
            if assigned_dept:
                if normalize_dept(student.department) != normalize_dept(assigned_dept):
                    matches_class = False
            if assigned_yr:
                if normalize_year(student.year) != normalize_year(assigned_yr):
                    matches_class = False
            if assigned_sec:
                if normalize_section(student.section) != normalize_section(assigned_sec):
                    matches_class = False
            if assigned_batch:
                if student.batch and student.batch.strip() != assigned_batch.strip():
                    matches_class = False
                
            if not (assigned_dept or assigned_yr or assigned_sec or assigned_batch) or not matches_class:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Mentor is not assigned to this student"
                )

    analytics_obj = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == student.id).first()
    scores = db.query(AssessmentScore).filter(
        AssessmentScore.student_id == student.id
    ).order_by(AssessmentScore.assessment_date.desc()).all()

    # Formulate domain scores mapping
    domain_scores = {
        "DSA": analytics_obj.dsa_average if analytics_obj else 0.0,
        "DBMS": analytics_obj.dbms_average if analytics_obj else 0.0,
        "FullStack": analytics_obj.fullstack_average if analytics_obj else 0.0,
        "Aptitude": analytics_obj.aptitude_average if analytics_obj else 0.0,
        "Coding": analytics_obj.coding_average if analytics_obj else 0.0,
        "Academic": analytics_obj.academic_average if analytics_obj else 0.0,
        "Technical": analytics_obj.technical_average if analytics_obj else 0.0
    }

    # Map score history list
    score_history = []
    for sc in scores:
        iso_date = sc.assessment_date.date().isoformat()
        score_history.append({
            "id": sc.id,
            "date": iso_date,
            "assessment_date": iso_date,
            "assessmentDate": iso_date,
            "assessment_name": sc.assessment_name,
            "assessmentName": sc.assessment_name,
            "category": sc.category,
            "score": sc.score,
            "max_marks": sc.max_marks,
            "maxMarks": sc.max_marks,
            "percentage": sc.percentage
        })

    # Find best and lowest assessment
    best_item = None
    lowest_item = None
    if score_history:
        best_item = max(score_history, key=lambda x: x["percentage"])
        lowest_item = min(score_history, key=lambda x: x["percentage"])

    summary = {
        "total_assessments": analytics_obj.total_assessments if analytics_obj else 0,
        "totalAssessments": analytics_obj.total_assessments if analytics_obj else 0,
        "average_test_score": analytics_obj.average_test_score if analytics_obj else 0.0,
        "averageTestScore": analytics_obj.average_test_score if analytics_obj else 0.0,
        "best_assessment": best_item or {},
        "bestAssessment": best_item or {},
        "lowest_assessment": lowest_item or {},
        "lowestAssessment": lowest_item or {},
        "improvement_trend": analytics_obj.improvement_trend if analytics_obj else "Stable",
        "improvementTrend": analytics_obj.improvement_trend if analytics_obj else "Stable",
        "placement_readiness_score": analytics_obj.placement_readiness_score if analytics_obj else 0.0,
        "placementReadinessScore": analytics_obj.placement_readiness_score if analytics_obj else 0.0,
        "placement_readiness_level": analytics_obj.placement_readiness_level if analytics_obj else "Needs Training",
        "placementReadinessLevel": analytics_obj.placement_readiness_level if analytics_obj else "Needs Training"
    }

    return {
        "student_id": student.id,
        "studentId": student.id,
        "register_no": student.register_no,
        "registerNo": student.register_no,
        "overall_score": analytics_obj.overall_score if analytics_obj else 0.0,
        "overallScore": analytics_obj.overall_score if analytics_obj else 0.0,
        "domain_scores": domain_scores,
        "domainScores": domain_scores,
        "strongest_domain": analytics_obj.strongest_domain if analytics_obj else None,
        "strongestDomain": analytics_obj.strongest_domain if analytics_obj else None,
        "weakest_domain": analytics_obj.weakest_domain if analytics_obj else None,
        "weakestDomain": analytics_obj.weakest_domain if analytics_obj else None,
        "score_history": score_history,
        "scoreHistory": score_history,
        "summary": summary
    }

@router.get("/{register_no}/about")
async def get_student_about(register_no: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves student About Me configuration parameters with fallback options."""
    # 1. Fetch student
    student = db.query(Student).filter(Student.register_no == register_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    about_obj = db.query(StudentAbout).filter(StudentAbout.student_id == student.id).first()

    headline = DEFAULT_HEADLINE
    about_me = DEFAULT_ABOUT_ME
    career_objective = DEFAULT_CAREER_OBJ
    skills = DEFAULT_SKILLS

    if about_obj:
        if about_obj.headline:
            headline = about_obj.headline
        if about_obj.about_me:
            about_me = about_obj.about_me
        if about_obj.career_objective:
            career_objective = about_obj.career_objective
        if about_obj.skills_json:
            try:
                skills = json.loads(about_obj.skills_json)
            except Exception:
                pass

    return {
        "headline": headline,
        "about_me": about_me,
        "aboutMe": about_me,
        "career_objective": career_objective,
        "careerObjective": career_objective,
        "skills": skills
    }

@router.put("/{register_no}/about")
async def update_student_about(
    register_no: str,
    payload: StudentAboutSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates student's own About Me configuration."""
    student = db.query(Student).filter(Student.register_no == register_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Access security check
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied. Can only update own About Me.")

    about_obj = db.query(StudentAbout).filter(StudentAbout.student_id == student.id).first()
    if not about_obj:
        about_obj = StudentAbout(student_id=student.id)
        db.add(about_obj)

    about_obj.headline = payload.headline
    about_obj.about_me = payload.about_me or payload.aboutMe
    about_obj.career_objective = payload.career_objective or payload.careerObjective
    
    if payload.skills:
        about_obj.skills_json = json.dumps(payload.skills)

    db.commit()
    db.refresh(about_obj)

    return {
        "headline": about_obj.headline,
        "about_me": about_obj.about_me,
        "aboutMe": about_obj.about_me,
        "career_objective": about_obj.career_objective,
        "careerObjective": about_obj.career_objective,
        "skills": payload.skills
    }
