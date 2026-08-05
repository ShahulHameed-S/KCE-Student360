from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
from typing import Optional

from app.dependencies import get_db, get_current_user, RoleRequired
from app.models.user import User
from app.models.student import Student, MentorAssignment
from app.models.score import AssessmentScore
from app.schemas.score import UploadScoresResponse, ScoreListResponse, ScoreItemResponse, ScoreUpdateSchema
from app.services.upload_service import process_scores_excel
from app.services.analytics_service import recalculate_student_analytics
from app.utils.domain_utils import normalize_domain
from app.routers.mentor import resolve_mentor_students

router = APIRouter()

@router.post("/upload", response_model=UploadScoresResponse)
async def upload_scores(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleRequired(["faculty", "admin", "mentor"])),
    db: Session = Depends(get_db)
):
    """
    Uploads an Excel file containing student assessment scores.
    Validates data, inserts scores, and recalculates analytics.
    """
    allowed_student_ids = None
    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_student_ids = [s.id for s in mentor_students]

    file_bytes = await file.read()
    report = process_scores_excel(db, file_bytes, current_user.id, allowed_student_ids)
    return report


@router.get("/count")
async def get_scores_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the total count of assessment scores in the system."""
    count = db.query(AssessmentScore).count()
    return {"count": count}


@router.get("", response_model=ScoreListResponse)
@router.get("/", response_model=ScoreListResponse)
async def list_scores(
    register_no: Optional[str] = Query(None),
    assessment_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleRequired(["admin", "faculty", "mentor"])),
    db: Session = Depends(get_db)
):
    """Lists assessment scores with filters, pagination, and mentor access control."""
    query = db.query(AssessmentScore, Student).join(Student, AssessmentScore.student_id == Student.id)

    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_ids = [s.id for s in mentor_students]
        query = query.filter(AssessmentScore.student_id.in_(allowed_ids))

    if register_no:
        reg_pattern = f"%{register_no.strip()}%"
        query = query.filter(
            or_(
                func.lower(Student.register_no).like(func.lower(reg_pattern)),
                func.lower(Student.name).like(func.lower(reg_pattern))
            )
        )

    if assessment_name:
        ass_pattern = f"%{assessment_name.strip()}%"
        query = query.filter(func.lower(AssessmentScore.assessment_name).like(func.lower(ass_pattern)))

    if category:
        norm_cat = normalize_domain(category)
        if norm_cat:
            query = query.filter(AssessmentScore.category == norm_cat)

    if date_from:
        try:
            df = datetime.strptime(date_from.strip(), "%Y-%m-%d")
            query = query.filter(AssessmentScore.assessment_date >= df)
        except ValueError:
            pass

    if date_to:
        try:
            dt = datetime.strptime(date_to.strip(), "%Y-%m-%d")
            query = query.filter(AssessmentScore.assessment_date <= dt)
        except ValueError:
            pass

    total = query.count()
    results = query.order_by(AssessmentScore.id.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for score_obj, student_obj in results:
        items.append({
            "id": score_obj.id,
            "student_id": student_obj.id,
            "register_no": student_obj.register_no,
            "student_name": student_obj.name,
            "assessment_name": score_obj.assessment_name,
            "category": score_obj.category,
            "score": score_obj.score,
            "max_marks": score_obj.max_marks,
            "percentage": score_obj.percentage,
            "date": score_obj.assessment_date.strftime("%Y-%m-%d") if score_obj.assessment_date else ""
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.put("/{score_id}")
async def edit_score(
    score_id: int,
    data: ScoreUpdateSchema,
    current_user: User = Depends(RoleRequired(["admin", "mentor"])),
    db: Session = Depends(get_db)
):
    """Edits an existing assessment score record and updates analytics."""
    score_obj = db.query(AssessmentScore).filter(AssessmentScore.id == score_id).first()
    if not score_obj:
        raise HTTPException(status_code=404, detail="Score record not found")

    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_ids = [s.id for s in mentor_students]
        if score_obj.student_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not allowed to modify this student's score")

    # Validations
    if data.score is not None and data.score < 0:
        raise HTTPException(status_code=400, detail="Score cannot be negative")

    if data.max_marks is not None and data.max_marks <= 0:
        raise HTTPException(status_code=400, detail="Max Marks must be greater than zero")

    new_score = data.score if data.score is not None else score_obj.score
    new_max = data.max_marks if data.max_marks is not None else score_obj.max_marks

    if new_score > new_max:
        raise HTTPException(status_code=400, detail=f"Score ({new_score}) cannot exceed Max Marks ({new_max})")

    if data.category:
        norm_cat = normalize_domain(data.category)
        if not norm_cat:
            raise HTTPException(status_code=400, detail="Invalid assessment category")
        score_obj.category = norm_cat

    if data.assessment_name:
        score_obj.assessment_name = data.assessment_name.strip()

    if data.score is not None:
        score_obj.score = float(data.score)

    if data.max_marks is not None:
        score_obj.max_marks = float(data.max_marks)

    score_obj.percentage = round((score_obj.score / score_obj.max_marks) * 100.0, 2)

    if data.date:
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y"):
            try:
                score_obj.assessment_date = datetime.strptime(data.date.strip(), fmt)
                break
            except ValueError:
                continue

    db.commit()
    db.refresh(score_obj)

    # Recalculate student analytics after edit
    recalculate_student_analytics(db, score_obj.student_id)
    db.commit()

    student_obj = db.query(Student).filter(Student.id == score_obj.student_id).first()

    return {
        "id": score_obj.id,
        "student_id": score_obj.student_id,
        "register_no": student_obj.register_no if student_obj else "",
        "student_name": student_obj.name if student_obj else "",
        "assessment_name": score_obj.assessment_name,
        "category": score_obj.category,
        "score": score_obj.score,
        "max_marks": score_obj.max_marks,
        "percentage": score_obj.percentage,
        "date": score_obj.assessment_date.strftime("%Y-%m-%d") if score_obj.assessment_date else ""
    }


from app.schemas.score import BulkDeleteScoresRequest, BulkDeleteScoresResponse

@router.delete("/bulk", response_model=BulkDeleteScoresResponse)
async def bulk_delete_scores(
    data: BulkDeleteScoresRequest,
    current_user: User = Depends(RoleRequired(["admin", "mentor"])),
    db: Session = Depends(get_db)
):
    """Bulk deletes assessment score records and recalculates affected student analytics."""
    if not data.score_ids:
        return BulkDeleteScoresResponse(
            success=True,
            deleted_count=0,
            skipped_count=0,
            message="No score IDs provided"
        )

    score_records = db.query(AssessmentScore).filter(AssessmentScore.id.in_(data.score_ids)).all()
    if not score_records:
        return BulkDeleteScoresResponse(
            success=True,
            deleted_count=0,
            skipped_count=0,
            message="No matching score records found"
        )

    allowed_student_ids = None
    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_student_ids = set(s.id for s in mentor_students)

    deleted_count = 0
    skipped_count = 0
    affected_student_ids = set()

    for s_obj in score_records:
        if allowed_student_ids is not None and s_obj.student_id not in allowed_student_ids:
            skipped_count += 1
            continue

        affected_student_ids.add(s_obj.student_id)
        db.delete(s_obj)
        deleted_count += 1

    db.commit()

    # Recalculate student analytics for all affected students in batch
    for sid in affected_student_ids:
        recalculate_student_analytics(db, sid)
    db.commit()

    return BulkDeleteScoresResponse(
        success=True,
        deleted_count=deleted_count,
        skipped_count=skipped_count,
        message=f"Successfully deleted {deleted_count} score record(s)."
    )


@router.delete("/{score_id}")
async def delete_score(
    score_id: int,
    current_user: User = Depends(RoleRequired(["admin", "mentor"])),
    db: Session = Depends(get_db)
):
    """Deletes an assessment score record and updates analytics."""
    score_obj = db.query(AssessmentScore).filter(AssessmentScore.id == score_id).first()
    if not score_obj:
        raise HTTPException(status_code=404, detail="Score record not found")

    if current_user.role == "mentor":
        mentor_students = resolve_mentor_students(db, current_user)
        allowed_ids = [s.id for s in mentor_students]
        if score_obj.student_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not allowed to modify this student's score")

    student_id = score_obj.student_id
    db.delete(score_obj)
    db.commit()

    # Recalculate student analytics after deletion
    recalculate_student_analytics(db, student_id)
    db.commit()

    return {
        "success": True,
        "message": "Score deleted successfully",
        "analytics_recalculated": True
    }
