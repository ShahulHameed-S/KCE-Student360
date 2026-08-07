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
    Uses resolve_mentor_students for mentor scope (department + year + batch matching, section ignored).
    Optimized for high performance with zero N+1 database queries.
    """
    # 1. Determine student scope
    target_students = []
    if current_user and current_user.role == "mentor":
        from app.services.mentor_assignment_service import resolve_mentor_students
        target_students = resolve_mentor_students(db, current_user)
    else:
        # Admin, Faculty, or public
        all_students = db.query(Student).all()
        target_students = [s for s in all_students if not s.register_no.lower().startswith("22ad")]

    if not target_students:
        return []

    target_student_ids = [s.id for s in target_students]

    # 2. Batch query analytics
    analytics_records = db.query(StudentAnalytics).filter(StudentAnalytics.student_id.in_(target_student_ids)).all()
    analytics_map = {a.student_id: a for a in analytics_records}

    # 3. Batch query UserProfile for profile images
    user_ids = [s.user_id for s in target_students if s.user_id]
    profile_image_map = {}
    if user_ids:
        from app.models.profile import UserProfile
        profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).all()
        profile_image_map = {p.user_id: p.profile_image for p in profiles if p.profile_image}

    norm_cat = normalize_domain(domain)

    # 4. Build student records list
    items = []
    for student in target_students:
        analytics = analytics_map.get(student.id)

        has_scores = False
        domain_score = None
        overall_score = None
        best_score = None
        latest_score = None
        strongest = "Not added"
        weakest = "Not added"
        domain_scores_map = {}

        if analytics and getattr(analytics, "overall_score", None) is not None:
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

            if domain_score is not None:
                has_scores = True

        profile_image = student.profile_image or profile_image_map.get(student.user_id, "")

        items.append({
            "target_score": float(domain_score) if (has_scores and domain_score is not None) else -1.0,
            "has_score": has_scores,
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

    # 5. Sort records: scored students descending by score, unscored students by name
    items.sort(key=lambda x: (x["has_score"], x["target_score"], x["data"]["name"]), reverse=True)

    # 6. Assign rank numbers (only for scored students)
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
