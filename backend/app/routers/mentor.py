from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any

from app.dependencies import get_db, get_current_user, RoleRequired
from app.models.user import User
from app.models.student import Student, MentorAssignment
from app.models.submission import StudentProject, StudentCertification, StudentAchievement, MentorReviewLog
from app.services.analytics_service import recalculate_student_analytics
from app.schemas.submission import MentorReviewRequest

router = APIRouter()

def normalize_dept(dept: str) -> str:
    if not dept:
        return ""
    d = dept.strip().lower()
    d = d.replace("and", "&")
    d = d.replace(" ", "")
    if d in ["ai&ds", "artificialintelligence&datascience"]:
        return "aids"
    if d in ["it", "informationtechnology"]:
        return "it"
    if d in ["cse", "computerscience&engineering"]:
        return "cse"
    return d

def normalize_year(year) -> str:
    if not year:
        return ""
    y = str(year).strip().lower()
    y = y.replace("year", "").strip()
    roman_map = {"i": "1", "ii": "2", "iii": "3", "iv": "4"}
    if y in roman_map:
        return roman_map[y]
    return y

def normalize_section(sec: str) -> str:
    if not sec:
        return ""
    s = sec.strip().lower()
    if "-" in s:
        parts = [p.strip() for p in s.split("-")]
        if parts:
            s = parts[-1]
    return s

def get_assigned_student_ids(db: Session, mentor_id: int) -> List[int]:
    """Helper to retrieve Student IDs assigned to a specific mentor."""
    assignments = db.query(MentorAssignment).filter(MentorAssignment.mentor_id == mentor_id).all()
    return [a.student_id for a in assignments]

def build_unified_approval_item(item, item_type: str) -> dict:
    """Helper to convert projects/certs/achievements to a unified approval item dictionary."""
    # Determine display type Capitalized
    display_type = "Project"
    if item_type == "certification":
        display_type = "Certification"
    elif item_type == "achievement":
        display_type = "Achievement"

    # Handle proof links
    proof_link = getattr(item, "proof_file", None)
    if not proof_link:
        proof_link = getattr(item, "certificate_link", None)
    if not proof_link:
        proof_link = getattr(item, "proof_link", None)

    # Formatted submitted date
    sub_date = item.created_at.date().isoformat() if item.created_at else ""

    return {
        "id": item.id,
        "item_type": item_type,
        "itemType": item_type,
        "type": display_type,
        "title": item.title,
        "description": getattr(item, "description", ""),
        "student_id": item.student_id,
        "studentId": item.student_id,
        "student_name": item.student.name if item.student else "Unknown",
        "studentName": item.student.name if item.student else "Unknown",
        "register_no": item.student.register_no if item.student else "",
        "registerNo": item.student.register_no if item.student else "",
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else "",
        "submitted_date": sub_date,
        "proof_link": proof_link or "",
        "proof_file": item.proof_file or "",
        "proofFile": item.proof_file or "",
        "feedback": item.mentor_feedback or "",
        "mentor_feedback": item.mentor_feedback or "",
        "mentorFeedback": item.mentor_feedback or "",
        "reviewed_by": item.reviewed_by,
        "reviewed_at": item.reviewed_at.isoformat() if item.reviewed_at else None
    }

def query_submissions(db: Session, student_ids: List[int] = None, status_filter: str = None) -> List[dict]:
    """Queries all projects, certifications, and achievements in database with filters."""
    # Projects
    p_query = db.query(StudentProject)
    if student_ids is not None:
        p_query = p_query.filter(StudentProject.student_id.in_(student_ids))
    if status_filter:
        p_query = p_query.filter(StudentProject.status == status_filter)
    projects = p_query.all()

    # Certs
    c_query = db.query(StudentCertification)
    if student_ids is not None:
        c_query = c_query.filter(StudentCertification.student_id.in_(student_ids))
    if status_filter:
        c_query = c_query.filter(StudentCertification.status == status_filter)
    certs = c_query.all()

    # Achievements
    a_query = db.query(StudentAchievement)
    if student_ids is not None:
        a_query = a_query.filter(StudentAchievement.student_id.in_(student_ids))
    if status_filter:
        a_query = a_query.filter(StudentAchievement.status == status_filter)
    achs = a_query.all()

    unified_list = []
    for p in projects:
        unified_list.append(build_unified_approval_item(p, "project"))
    for c in certs:
        unified_list.append(build_unified_approval_item(c, "certification"))
    for a in achs:
        unified_list.append(build_unified_approval_item(a, "achievement"))

    # Sort by created_at descending
    unified_list.sort(key=lambda x: x["created_at"], reverse=True)
    return unified_list

@router.get("/pending")
async def get_pending_submissions(
    current_user: User = Depends(RoleRequired(["mentor", "admin", "faculty"])),
    db: Session = Depends(get_db)
):
    """Retrieves all pending submissions for assigned students (or all for demo/admin)."""
    student_ids = None
    if current_user.role == "mentor":
        assigned_ids = get_assigned_student_ids(db, current_user.id)
        # If mentor assignments exist, filter. Otherwise, return all for demo convenience.
        if assigned_ids:
            student_ids = assigned_ids

    return query_submissions(db, student_ids=student_ids, status_filter="Pending")

@router.get("/approvals")
async def get_all_approvals(
    current_user: User = Depends(RoleRequired(["mentor", "admin", "faculty"])),
    db: Session = Depends(get_db)
):
    """Retrieves all submissions (all states) for assigned students (or all for admin)."""
    student_ids = None
    if current_user.role == "mentor":
        assigned_ids = get_assigned_student_ids(db, current_user.id)
        if assigned_ids:
            student_ids = assigned_ids

    return query_submissions(db, student_ids=student_ids)

@router.put("/review")
async def review_submission(
    payload: MentorReviewRequest,
    current_user: User = Depends(RoleRequired(["mentor", "admin"])),
    db: Session = Depends(get_db)
):
    """Approves, rejects, or requests corrections on a specific student submission."""
    status_val = payload.status
    if status_val not in ["Approved", "Rejected", "Correction Required"]:
        raise HTTPException(status_code=400, detail=f"Invalid review status: '{status_val}'")

    # Normalize item_type
    raw_type = str(payload.item_type or payload.itemType or "").lower().strip()
    
    if raw_type and raw_type not in ["project", "projects", "certification", "certifications", "achievement", "achievements"]:
        raise HTTPException(status_code=400, detail=f"Invalid submission type: '{raw_type}'")
        
    # Resolve project/certification/achievement target
    item = None
    item_type_norm = None
    
    # We search by matching type
    if raw_type in ["project", "projects"]:
        item = db.query(StudentProject).filter(StudentProject.id == payload.id).first()
        item_type_norm = "project"
    elif raw_type in ["certification", "certifications"]:
        item = db.query(StudentCertification).filter(StudentCertification.id == payload.id).first()
        item_type_norm = "certification"
    elif raw_type in ["achievement", "achievements"]:
        item = db.query(StudentAchievement).filter(StudentAchievement.id == payload.id).first()
        item_type_norm = "achievement"
    else:
        # Fallback search across all three tables if no type was provided (legacy frontend calls)
        item = db.query(StudentProject).filter(StudentProject.id == payload.id).first()
        if item:
            item_type_norm = "project"
        else:
            item = db.query(StudentCertification).filter(StudentCertification.id == payload.id).first()
            if item:
                item_type_norm = "certification"
            else:
                item = db.query(StudentAchievement).filter(StudentAchievement.id == payload.id).first()
                if item:
                    item_type_norm = "achievement"

    if not item:
        raise HTTPException(
            status_code=404, 
            detail=f"Submission with ID {payload.id} not found."
        )

    # 1. Update review properties
    item.status = status_val
    item.mentor_feedback = payload.feedback or ""
    item.reviewed_by = current_user.id
    item.reviewed_at = datetime.utcnow()

    # 2. Insert MentorReviewLog
    log = MentorReviewLog(
        item_type=item_type_norm,
        item_id=item.id,
        student_id=item.student_id,
        mentor_id=current_user.id,
        status=status_val,
        feedback=payload.feedback or ""
    )
    db.add(log)
    db.flush()

    # 3. Recalculate StudentAnalytics (placement readiness score changes based on approved counts)
    recalculate_student_analytics(db, item.student_id)

    db.commit()
    db.refresh(item)

    return build_unified_approval_item(item, item_type_norm)


def resolve_mentor_students(db: Session, current_user: User) -> List[Student]:
    """Helper to resolve assigned and class-matching students for a mentor or admin/faculty. Section restriction is NOT used."""
    from app.models.student import FacultyProfile
    from app.models.profile import UserProfile
    import json

    if current_user.role in ["admin", "faculty"]:
        all_students = db.query(Student).all()
        return [s for s in all_students if not s.register_no.lower().startswith("22ad")]

    explicit_students = []
    assigned_student_ids = get_assigned_student_ids(db, current_user.id)
    if assigned_student_ids:
        db_assigned = db.query(Student).filter(Student.id.in_(assigned_student_ids)).all()
        explicit_students = [s for s in db_assigned if not s.register_no.lower().startswith("22ad")]

    class_students = []
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    assigned_dept = None
    assigned_yr = None
    assigned_batch = None

    if profile and profile.bio and profile.bio.startswith("{") and profile.bio.endswith("}"):
        try:
            bio_data = json.loads(profile.bio)
            assigned_dept = bio_data.get("assignedDepartment") or bio_data.get("department")
            assigned_yr = bio_data.get("assignedYear") or bio_data.get("year")
            assigned_batch = bio_data.get("assignedBatch") or bio_data.get("batch")
        except Exception:
            pass

    # TEMPORARY DEMO FALLBACK - batch-level mentor access, section not restricted.
    if not (assigned_dept or assigned_yr) and current_user.email == "monisha.r@kce.ac.in":
        assigned_dept = "AI & DS"
        assigned_yr = "3"
        assigned_batch = "2028"

    if not assigned_dept:
        fp = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
        if fp:
            assigned_dept = fp.department

    if assigned_dept or assigned_yr or assigned_batch:
        all_db_students = db.query(Student).all()
        norm_m_dept = normalize_dept(assigned_dept)
        norm_m_yr = normalize_year(assigned_yr)

        for s in all_db_students:
            if s.register_no.lower().startswith("22ad"):
                continue
            match = True
            if norm_m_dept and normalize_dept(s.department) != norm_m_dept:
                match = False
            if norm_m_yr and normalize_year(s.year) != norm_m_yr:
                match = False
            # Batch rule: match if both exist and overlap; do not reject if student or mentor batch is missing
            if assigned_batch and s.batch and s.batch.strip():
                m_b = assigned_batch.strip()
                s_b = s.batch.strip()
                if m_b != s_b and m_b not in s_b and s_b not in m_b:
                    match = False
            if match:
                class_students.append(s)

    # Combine both explicit assigned students and class matching students
    combined_list = explicit_students + class_students
    seen_ids = set()
    deduped_students = []
    for s in combined_list:
        if s.id not in seen_ids:
            seen_ids.add(s.id)
            deduped_students.append(s)

    first_10_regs = [s.register_no for s in deduped_students[:10]]
    print(f"[DEBUG MENTOR SCORE UPLOAD] user={current_user.email} dept={assigned_dept} yr={assigned_yr} batch={assigned_batch} section_filter_used=False allowed_count={len(deduped_students)} first_10={first_10_regs}")

    return deduped_students


@router.get("/students")
async def get_mentor_students(
    current_user: User = Depends(RoleRequired(["mentor", "admin", "faculty"])),
    db: Session = Depends(get_db)
):
    """Retrieves list of assigned students for a mentor (or all for admin/faculty)."""
    from app.models.score import StudentAnalytics

    students = resolve_mentor_students(db, current_user)

    res_list = []
    for s in students:
        analytics = db.query(StudentAnalytics).filter(StudentAnalytics.student_id == s.id).first()
        res_list.append({
            "id": s.id,
            "user_id": s.user_id,
            "userId": s.user_id,
            "register_no": s.register_no,
            "registerNo": s.register_no,
            "name": s.name,
            "email": s.email,
            "phone": s.phone or "",
            "department": s.department,
            "year": s.year,
            "section": s.section,
            "batch": s.batch,
            "cgpa": s.cgpa,
            "profile_image": s.profile_image or "",
            "profileImage": s.profile_image or "",
            "created_at": s.created_at.isoformat() if s.created_at else "",
            "overall_score": analytics.overall_score if (analytics and analytics.overall_score is not None) else None,
            "overallScore": analytics.overall_score if (analytics and analytics.overall_score is not None) else None,
            "strongest_domain": analytics.strongest_domain if (analytics and analytics.strongest_domain) else "Not added",
            "strongestDomain": analytics.strongest_domain if (analytics and analytics.strongest_domain) else "Not added",
            "weakest_domain": analytics.weakest_domain if (analytics and analytics.weakest_domain) else "Not added",
            "weakestDomain": analytics.weakest_domain if (analytics and analytics.weakest_domain) else "Not added"
        })
    return res_list


@router.get("/debug/students")
async def get_mentor_debug_students(
    current_user: User = Depends(RoleRequired(["mentor", "admin"])),
    db: Session = Depends(get_db)
):
    """Debug endpoint for mentors to check assigned student records."""
    students = resolve_mentor_students(db, current_user)

    sections_set = set(s.section for s in students if s.section)
    first_students = [
        {
            "id": s.id,
            "register_no": s.register_no,
            "name": s.name,
            "department": s.department,
            "year": s.year,
            "section": s.section,
            "batch": s.batch
        }
        for s in students[:10]
    ]

    return {
        "mentor_email": current_user.email,
        "class_assignment": {
            "department": "AI & DS",
            "year": "3",
            "batch": "2028",
            "section_filter_used": False
        },
        "allowed_student_ids_count": len(students),
        "students_returned_count": len(students),
        "sections_included": sorted(list(sections_set)),
        "first_students": first_students
    }


@router.get("/debug/leaderboard")
async def get_mentor_debug_leaderboard(
    current_user: User = Depends(RoleRequired(["mentor", "admin"])),
    db: Session = Depends(get_db)
):
    """Debug proof endpoint for mentor leaderboard data."""
    from app.services.leaderboard_service import get_leaderboard_data
    from app.models.score import AssessmentScore, StudentAnalytics

    leaderboard = get_leaderboard_data(db, "Overall", current_user=current_user)
    student_ids = [s["id"] for s in leaderboard]
    
    analytics_count = db.query(StudentAnalytics).filter(StudentAnalytics.student_id.in_(student_ids)).count() if student_ids else 0
    scores_count = db.query(AssessmentScore).filter(AssessmentScore.student_id.in_(student_ids)).count() if student_ids else 0

    with_scores = [s for s in leaderboard if s.get("overall_score") is not None]
    without_scores = [s for s in leaderboard if s.get("overall_score") is None]

    first_students = [
        {
            "register_no": s.get("register_no"),
            "name": s.get("name"),
            "overall_score": s.get("overall_score"),
            "domain_scores": s.get("domain_scores", {})
        }
        for s in leaderboard[:10]
    ]

    return {
        "mentor_email": current_user.email,
        "students_found": len(leaderboard),
        "students_with_scores": len(with_scores),
        "students_without_scores": len(without_scores),
        "analytics_records_found": analytics_count,
        "scores_records_found": scores_count,
        "first_students": first_students
    }


from fastapi import UploadFile, File
from app.schemas.score import UploadScoresResponse
from app.services.upload_service import process_scores_excel

@router.post("/upload/scores", response_model=UploadScoresResponse)
@router.post("/scores/upload", response_model=UploadScoresResponse)
async def mentor_upload_scores(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleRequired(["mentor", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Uploads Excel test marks for students assigned to the logged in mentor.
    Validates mentor-student access, inserts valid rows, recalculates analytics.
    """
    allowed_student_ids = None
    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_student_ids = [s.id for s in mentor_students]

    file_bytes = await file.read()
    return process_scores_excel(db, file_bytes, current_user.id, allowed_student_ids)
