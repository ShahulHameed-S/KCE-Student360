from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import Student
from app.models.score import StudentAnalytics, AssessmentScore
from app.models.user import User
from app.utils.domain_utils import normalize_domain
from app.services.analytics_service import recalculate_student_analytics

def get_leaderboard_data(db: Session, domain: str = "Overall", current_user: User = None) -> list:
    """
    Retrieves ranked student rankings sorted by overall_score or a specific domain score.
    Supports mentor role filtering (assigned + class match), demo student filtering (22ad),
    and formats unscored students safely with null overall_score and "Not added" domains.
    """
    # 1. Determine student scope
    target_students = []
    if current_user and current_user.role == "mentor":
        from app.routers.mentor import get_assigned_student_ids, normalize_dept, normalize_year, normalize_section
        from app.models.profile import UserProfile
        from app.models.student import FacultyProfile
        import json

        explicit_students = []
        assigned_student_ids = get_assigned_student_ids(db, current_user.id)
        if assigned_student_ids:
            db_assigned = db.query(Student).filter(Student.id.in_(assigned_student_ids)).all()
            explicit_students = [s for s in db_assigned if not s.register_no.lower().startswith("22ad")]

        class_students = []
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

        if not (assigned_dept or assigned_yr or assigned_sec) and current_user.email == "monisha.r@kce.ac.in":
            assigned_dept = "AI & DS"
            assigned_yr = "3"
            assigned_sec = "A"
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
                if assigned_batch and s.batch and s.batch.strip() != assigned_batch.strip():
                    match = False
                if match:
                    class_students.append(s)

        if explicit_students:
            student_list = explicit_students
        else:
            student_list = class_students

        seen_ids = set()
        for s in student_list:
            if s.id not in seen_ids:
                seen_ids.add(s.id)
                target_students.append(s)
    else:
        # Admin, Faculty, or public
        all_students = db.query(Student).all()
        target_students = [s for s in all_students if not s.register_no.lower().startswith("22ad")]

    if not target_students:
        return []

    target_student_ids = [s.id for s in target_students]

    # 2. Query analytics with outer join
    analytics_records = db.query(StudentAnalytics).filter(StudentAnalytics.student_id.in_(target_student_ids)).all()
    analytics_map = {a.student_id: a for a in analytics_records}

    norm_cat = normalize_domain(domain)

    # 3. Build student records list
    items = []
    for student in target_students:
        analytics = analytics_map.get(student.id)

        # Fallback dynamic calculation from assessment_scores if analytics missing or total_assessments == 0
        if not analytics:
            scores_count = db.query(AssessmentScore).filter(AssessmentScore.student_id == student.id).count()
            if scores_count > 0:
                analytics = recalculate_student_analytics(db, student.id)
                if analytics:
                    db.flush()

        has_scores = False
        domain_score = None
        overall_score = None
        best_score = None
        latest_score = None
        strongest = "Not added"
        weakest = "Not added"
        domain_scores_map = {}

        if analytics and getattr(analytics, "total_assessments", 0) > 0:
            has_scores = True
            overall_score = analytics.overall_score
            best_score = analytics.best_score
            latest_score = analytics.latest_score
            strongest = analytics.strongest_domain or "Not added"
            weakest = analytics.weakest_domain or "Not added"

            domain_scores_map = {
                "DSA": analytics.dsa_average or 0.0,
                "DBMS": analytics.dbms_average or 0.0,
                "FullStack": analytics.fullstack_average or 0.0,
                "Aptitude": analytics.aptitude_average or 0.0,
                "Coding": analytics.coding_average or 0.0,
                "Academic": analytics.academic_average or 0.0,
                "Technical": analytics.technical_average or 0.0
            }

            if norm_cat == "DSA":
                domain_score = analytics.dsa_average
            elif norm_cat == "DBMS":
                domain_score = analytics.dbms_average
            elif norm_cat == "FullStack":
                domain_score = analytics.fullstack_average
            elif norm_cat == "Aptitude":
                domain_score = analytics.aptitude_average
            elif norm_cat == "Coding":
                domain_score = analytics.coding_average
            elif norm_cat == "Academic":
                domain_score = analytics.academic_average
            elif norm_cat == "Technical":
                domain_score = analytics.technical_average
            else:
                domain_score = analytics.overall_score

        profile_image = student.profile_image or ""
        if not profile_image and student.user_id:
            from app.models.profile import UserProfile
            user_prof = db.query(UserProfile).filter(UserProfile.user_id == student.user_id).first()
            if user_prof and user_prof.profile_image:
                profile_image = user_prof.profile_image

        items.append({
            "target_score": domain_score if (has_scores and domain_score is not None) else -1.0,
            "has_score": has_scores and domain_score is not None,
            "data": {
                "id": student.id,
                "user_id": student.user_id,
                "register_no": student.register_no,
                "registerNo": student.register_no,
                "name": student.name,
                "department": student.department,
                "year": student.year,
                "section": student.section,
                "batch": student.batch,
                "overall_score": overall_score,
                "overallScore": overall_score,
                "domain_score": domain_score,
                "domainScore": domain_score,
                "domain_scores": domain_scores_map,
                "domainScores": domain_scores_map,
                "best_score": best_score,
                "bestScore": best_score,
                "latest_score": latest_score,
                "latestScore": latest_score,
                "strongest_domain": strongest,
                "strongestDomain": strongest,
                "weakest_domain": weakest,
                "weakestDomain": weakest,
                "profile_image": profile_image,
                "profileImage": profile_image
            }
        })

    # 4. Sort records: scored students descending by score, unscored students by name
    items.sort(key=lambda x: (x["has_score"], x["target_score"], x["data"]["name"]), reverse=True)

    # 5. Assign rank numbers (only for scored students)
    leaderboard = []
    rank_counter = 1
    for item in items:
        row = item["data"]
        if item["has_score"]:
            row["rank"] = rank_counter
            rank_counter += 1
        else:
            row["rank"] = None
        leaderboard.append(row)

    return leaderboard
