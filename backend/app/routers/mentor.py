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

from app.services.mentor_assignment_service import get_assigned_student_ids, resolve_mentor_students

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



@router.get("/students")
async def get_mentor_students(
    current_user: User = Depends(RoleRequired(["mentor", "admin", "faculty"])),
    db: Session = Depends(get_db)
):
    """Retrieves list of assigned students for a mentor (or all for admin/faculty)."""
    import json
    from app.services.cache_service import get_cache, set_cache
    from app.utils.url_utils import build_portfolio_urls

    cache_key = f"mentor_students:{current_user.id}"
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    students = resolve_mentor_students(db, current_user)

    res_list = []
    for s in students:
        try:
            # Use preloaded relationship
            analytics = s.analytics
            
            # Safe profile image resolution from preloaded relationship
            img_url = s.profile_image or ""
            if not img_url and s.user and s.user.user_profile:
                img_url = s.user.user_profile.profile_image or ""

            # Safe external portfolio URL resolution from preloaded relationship
            ext_url = ""
            cust = s.portfolio_customization
            if cust and getattr(cust, "section_visibility_json", None):
                try:
                    parsed = json.loads(cust.section_visibility_json)
                    if isinstance(parsed, dict):
                        ext_url = parsed.get("external_portfolio_url", "")
                except Exception:
                    pass

            reg_no = s.register_no or ""
            port_urls = build_portfolio_urls(reg_no, ext_url)

            overall_sc = None
            str_dom = "Not added"
            weak_dom = "Not added"
            if analytics and getattr(analytics, "overall_score", None) is not None:
                overall_sc = analytics.overall_score
                str_dom = getattr(analytics, "strongest_domain", None) or "Not added"
                weak_dom = getattr(analytics, "weakest_domain", None) or "Not added"

            res_list.append({
                "id": s.id,
                "user_id": s.user_id,
                "userId": s.user_id,
                "register_no": reg_no,
                "registerNo": reg_no,
                "name": s.name or "",
                "email": s.email or "",
                "phone": s.phone or "",
                "department": s.department or "",
                "year": s.year or "",
                "section": s.section or "",
                "batch": s.batch or "",
                "cgpa": s.cgpa or 0.0,
                "avatar_url": img_url,
                "profile_image_url": img_url,
                "image_url": img_url,
                "profile_image": img_url,
                "profileImage": img_url,
                "external_portfolio_url": port_urls["external_portfolio_url"],
                "default_portfolio_url": port_urls["default_portfolio_url"],
                "student360_portfolio_url": port_urls["student360_portfolio_url"],
                "created_at": s.created_at.isoformat() if s.created_at else "",
                "overall_score": overall_sc,
                "overallScore": overall_sc,
                "strongest_domain": str_dom,
                "strongestDomain": str_dom,
                "weakest_domain": weak_dom,
                "weakestDomain": weak_dom
            })
        except Exception as err:
            print(f"[WARN] Error serializing mentor student ID {s.id}: {err}")
            continue

    set_cache(cache_key, res_list, ttl_seconds=60)
    return res_list


@router.get("/debug/students")
async def get_mentor_debug_students(
    current_user: User = Depends(RoleRequired(["mentor", "admin"])),
    db: Session = Depends(get_db)
):
    """Debug endpoint for mentors to check assigned student records."""
    students = resolve_mentor_students(db, current_user)

    first_students = [
        {
            "register_no": s.register_no,
            "name": s.name
        }
        for s in students[:10]
    ]

    return {
        "mentor_email": current_user.email,
        "assignment_method": "register_number",
        "assigned_students_count": len(students),
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


@router.get("/leaderboard")
async def get_mentor_leaderboard(
    domain: str = "Overall",
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleRequired(["mentor", "admin"]))
):
    """Retrieves mentor student leaderboard."""
    from app.services.cache_service import get_cache, set_cache
    cache_key = f"mentor_leaderboard:{current_user.id}:{domain}"
    cached_data = get_cache(cache_key)
    if cached_data is not None:
        return cached_data

    from app.services.leaderboard_service import get_leaderboard_data
    leaderboard = get_leaderboard_data(db, domain, current_user=current_user)
    result = {"leaderboard": leaderboard}
    
    set_cache(cache_key, result, ttl_seconds=60)
    return result


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
    report = process_scores_excel(db, file_bytes, current_user.id, allowed_student_ids)

    from app.services.cache_service import invalidate_all_caches
    invalidate_all_caches()

    return report
