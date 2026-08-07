from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.student import Student, MentorAssignment

def get_assigned_student_ids(db: Session, mentor_id: int) -> List[int]:
    """Helper to retrieve Student IDs assigned to a specific mentor user."""
    assignments = db.query(MentorAssignment).filter(MentorAssignment.mentor_id == mentor_id).all()
    return [a.student_id for a in assignments]

def resolve_mentor_students(db: Session, current_user: User) -> List[Student]:
    """Resolves assigned students for a mentor (via mentor_assignments) or all students for admin/faculty."""
    if current_user.role in ["admin", "faculty"]:
        all_students = db.query(Student).all()
        return [s for s in all_students if not s.register_no.lower().startswith("22ad")]

    assigned_student_ids = get_assigned_student_ids(db, current_user.id)
    if not assigned_student_ids:
        return []

    assigned_students = db.query(Student).filter(Student.id.in_(assigned_student_ids)).all()
    # Filter out demo 22AD students so only real assigned students are returned
    return [s for s in assigned_students if not s.register_no.lower().startswith("22ad")]

def get_mentor_allowed_student_ids(db: Session, current_user: User) -> Optional[List[int]]:
    """Returns list of allowed student IDs for a mentor, or None for admin/faculty (unrestricted)."""
    if current_user.role in ["admin", "faculty"]:
        return None
    return get_assigned_student_ids(db, current_user.id)

def can_mentor_access_student(db: Session, current_user: User, student_id: int) -> bool:
    """Checks if a mentor is allowed to access a specific student by student_id."""
    if current_user.role in ["admin", "faculty"]:
        return True
    is_assigned = db.query(MentorAssignment).filter(
        MentorAssignment.mentor_id == current_user.id,
        MentorAssignment.student_id == student_id
    ).first()
    return is_assigned is not None
